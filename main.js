const { app, BrowserWindow, Menu, Tray, systemPreferences, ipcMain, Notification } = require('electron');
const desktopIdle = require('desktop-idle');

let mainWindow, tray;
const state = {
    traySettings: null,
    trayInterval: null,
    reminderTimeout: null,
    idleTime: {
        minSeconds: null,
        currentSeconds: null,
        showIdleTime: null,
        isSuspended: false,
    },
    isQuitting: false,
    window: {
        theme: null,
        width: 480,
        height: 680,
        padding: 20,
    }
};

const platforms = {
    linux: () => ({
        windowOptions: {
            frame: true,
            skipTaskbar: true, // weird behavior on ElementaryOS if value is false (more info in commit)
        },
        init: () => null,
        onOpen: () => mainWindow ? setTimeout(() => mainWindow.setSkipTaskbar(false), 200) : null,
        onHide: () => mainWindow ? mainWindow.setSkipTaskbar(true) : null,
        setMenu: (menuItems) => tray.setContextMenu(Menu.buildFromTemplate(menuItems)),
        getWindowIcon: () => 'png/blue.png',
        getTrayIcon: isActive => isActive ? 'png/blue.png' : `png/${state.window.theme || 'white'}.png`,
        setTrackerStatus: (settings) => tray.setImage(settings.trayIcon),
    }),
    win32: () => ({
        windowOptions: {
            frame: true,
            skipTaskbar: false,
        },
        init: () => app.setAppUserModelId('com.github.costlocker.desktop'),
        onOpen: () => mainWindow ? mainWindow.setSkipTaskbar(false) : null,
        onHide: () => mainWindow ? mainWindow.setSkipTaskbar(true) : null,
        setMenu: (menuItems) => tray.setContextMenu(Menu.buildFromTemplate(menuItems)),
        getWindowIcon: () => 'win/icon.ico',
        getTrayIcon: (isActive) => {
            const theme = 
                state.window.theme ||
                (systemPreferences.getColor('desktop') == '#000000' ? 'white' : 'black');
            return isActive ? 'png/blue.png' : `png/${theme}.png`;
        },
        setTrackerStatus: (settings) => {
            tray.setImage(settings.trayIcon);
            if (!mainWindow) {
                return;
            }
            mainWindow.setProgressBar(settings.isActive ? 1 : 0);
        },
    }),
    darwin: () => ({
        windowOptions: {
            frame: false,
            skipTaskbar: false,
        },
        init: () => null,
        onOpen: () => app.dock.show(),
        onHide: () => app.dock.hide(),
        setMenu: (standardMenu) => {
            // Mac menu is different, because it's application menu
            const menuItems = standardMenu.slice(1); // Open option make no sense
            // Enable keyboard shortcuts
            menuItems[2].accelerator = 'Command+Q';
            Menu.setApplicationMenu(Menu.buildFromTemplate([
                {
                    label: app.getName(),
                    submenu: menuItems,
                },
                {
                    label: "Edit",
                    submenu: [
                        { role: 'cut' },
                        { role: 'copy' },
                        { role: 'paste' },
                        { role: 'selectAll' },
                    ],
                },
            ]));
            app.dock.setMenu(Menu.buildFromTemplate([
                {	
                    label: 'Minimize',	
                    click: hideApp,	
                },
            ]));
        },
        getWindowIcon: () => `png/blue.png`,
        getTrayIcon: isActive => isActive ? 'mac/activeTemplate.png' : 'mac/inactive.png',
        setTrackerStatus: (settings) => {
            tray.setImage(settings.trayIcon);
            setTimeout(() => app.dock.setIcon(settings.windowIcon), 200);
        },
    })
}
const platform = platforms[process.platform]();

function createWindow () {
  mainWindow = new BrowserWindow({
    width: state.window.width,
    height: state.window.height,
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    ...platform.windowOptions,
    movable: true,
    center: true,
    icon: getIcon(platform.getWindowIcon()),
    backgroundColor: '#f2f2f2'
  });
  reloadTrackerStatus();
  mainWindow.loadFile(getFile('index.html'));
  mainWindow.on('minimize', hideApp);
  mainWindow.on('close', function (event) {
    if (state.isQuitting) {
        return;
    }
    hideApp(event);
  });
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.send('webview-devtools'));
}

function createTray () {
  if (tray) {
    return;
  }
  tray = new Tray(getIcon(platform.getTrayIcon()));	
  tray.setToolTip('Costlocker');	
  tray.on('click', toggleApp);	
  tray.on('double-click', toggleApp);	
  tray.on('right-click', toggleApp);
  platform.setMenu([
    {	
        label: 'Open',	
        click: openApp,	
    },	
    {	
        label: 'Minimize',	
        click: hideApp,	
    },	
    {	
        type: 'separator'	
    },	
    {	
        label: 'Quit',	
        click: quitApp,	
    },	
    {	
        type: 'separator'	
    },
    {
        label: `About (v${app.getVersion()})`,	
        click: () => require('electron').shell.openExternal('https://costlocker.com?utm_source=desktop'),	
    },
  ]);
}

const openApp = () => {
    if (!mainWindow) {
        createWindow();
    } else if (mainWindow.isMinimized()) {
        mainWindow.restore();
    } else if (!mainWindow.isVisible()) {
        mainWindow.show();
    } else {
        mainWindow.focus();
    }
    platform.onOpen();
    reloadTrackerStatus();
}

function hideApp(event) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    if (mainWindow) {
        mainWindow.hide();
    }
    platform.onHide();
}

function quitApp() {
    state.isQuitting = true;
    app.quit();
}

const toggleApp = () => {
    if (mainWindow && mainWindow.isVisible() && !mainWindow.isMinimized()) {
        hideApp();
    } else {
        openApp();
    }
}

function getIcon(imagePath) {
    return getFile(`assets/icons/${imagePath}`);
}

function getFile(path) {
    return `${__dirname}/${path}`;
}

platform.init();
app.on('ready', () => {
    createTray();
    openApp();
    checkIdleDuringSleep();
});
app.on('before-quit', () => state.isQuitting = true);

ipcMain.on('app-show', openApp);
ipcMain.on('app-hide', hideApp);
ipcMain.on('app-quit', quitApp);

function checkIdleDuringSleep() {
    const powerMonitor = require('electron').powerMonitor;
    powerMonitor.on('suspend', () => {
        state.idleTime.isSuspended = true;
    });
    powerMonitor.on('resume', () => {
        // app isn't opened if checkIdleTime is called immediately when user logs in
        const delayAfterResumeInSeconds = 5;
        setTimeout(
            () => {
                state.idleTime.isSuspended = false;
                state.idleTime.currentSeconds -= delayAfterResumeInSeconds;
            },
            delayAfterResumeInSeconds * 1000
        );
    });
}

const checkIdleTime = () => {
    if (!state.idleTime.minSeconds) {
        return;
    }
    if (state.idleTime.isSuspended) {
        state.idleTime.currentSeconds++;
        return;
    }
    const now = Math.floor(new Date().getTime() / 1000);
    const idleTime = Math.floor(desktopIdle.getIdleTime());
    const isIdleTimeShown =
        // limit was reached in previous check
        state.idleTime.currentSeconds >= state.idleTime.minSeconds &&
        // computer is not idle
        idleTime < state.idleTime.currentSeconds;
    if (isIdleTimeShown) {
        openApp();
        state.idleTime.showIdleTime(now - state.idleTime.currentSeconds);
    }
    state.idleTime.currentSeconds = idleTime;
};

const formatSeconds = (seconds) => new Date(seconds * 1000).toISOString().substr(11, 8);
const reloadTrackerStatus = () => {
    const isActive = state.traySettings ? state.traySettings.isActive : false;
    platform.setTrackerStatus({
        isActive: isActive,
        windowIcon: getIcon(platform.getWindowIcon()),
        trayIcon: getIcon(platform.getTrayIcon(isActive)),
    });
};
const setAppTitle = (title) => {
    if (mainWindow) {
        mainWindow.setTitle(title && title.length ? title : 'Costlocker');
    }
    if (tray) {
        tray.setTitle(title);
        tray.setToolTip(title && title.length ? title : 'Costlocker');
    }
};
ipcMain.on('update-tray', (event, args) => {
    state.traySettings = args[0];
    if (state.trayInterval) {
        clearInterval(state.trayInterval);
    }
    reloadTrackerStatus();
    if (!state.traySettings.isActive) {
        setAppTitle('');
        return;
    }
    const updateTitle = () => {
        const now = Math.floor(new Date().getTime() / 1000);
        const duration = formatSeconds(now - state.traySettings.timestamp);
        if (state.traySettings.name && state.traySettings.timestamp) {
            setAppTitle(`${state.traySettings.name} (${duration})`);
        } else if (state.traySettings.name) {
            setAppTitle(`${state.traySettings.name}`);
        } else if (state.traySettings.timestamp) {
            setAppTitle(`${duration}`);
        } else {
            setAppTitle('');
        }
    };
    updateTitle();
    state.trayInterval = setInterval(
        () => {
            updateTitle();
            checkIdleTime();
        },
        1000
    );
});

ipcMain.on('update-reminder', (event, args) => {
    if (state.reminderTimeout) {
        clearTimeout(state.reminderTimeout);
    }
    const seconds = args[0];
    if (!seconds) {
        return;
    }
    state.reminderTimeout = setTimeout(
        () => {
            const notification = new Notification({
                title: 'Reminder from Costlocker',
                body: 'Don’t forget to track time',
                closeButtonText: 'Close',
            });
            notification.on('click', () => {
                openApp();
                event.sender.send('reminder-clicked', 2);
            });
            notification.show();
        },
        seconds * 1000
    );
});

ipcMain.on('update-idletime', (event, args) => {
    state.idleTime.minSeconds = args[0];
    state.idleTime.showIdleTime = (timestamp) => event.sender.send('idletime-detected', timestamp);
});

const reloadWindowSettings = () => {
    openApp();
    mainWindow.setSize(state.window.width, state.window.height);
    reloadTrackerStatus();
};
ipcMain.on('update-window', (event, args) => {
    const settings = args[0];
    if (settings) {
        state.window =  { ...state.window, ...settings };
        reloadWindowSettings();
    }
});
