const { app, BrowserWindow, Menu, Tray, systemPreferences, ipcMain, Notification } = require('electron');
const desktopIdle = require('desktop-idle');

let mainWindow, tray;
const state = {
    traySettings: null,
    trayInterval: null,
    reminderTimeout: null,
    idleTimeSeconds: null,
    detectIdletime: null,
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
        onOpen: () => {
            if (!mainWindow) {
                return;
            }
            setTimeout(() => mainWindow.setSkipTaskbar(false), 200);
        },
        onHide: () => {
            if (!mainWindow) {
                return;
            }
            mainWindow.setSkipTaskbar(true);
        },
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
        onOpen: () => {
            app.dock.show();
        },
        onHide: () => {
            app.dock.hide();
        },
        getWindowIcon: () => `png/blue.png`,
        getTrayIcon: isActive => isActive ? 'mac/activeTemplate.png' : 'mac/inactive.png',
        setTrackerStatus: (settings) => {
            tray.setImage(settings.trayIcon);
            setTimeout(() => app.dock.setIcon(settings.windowIcon), 100);
        },
    })
}
const platform = platforms[process.platform]();

function getIcon(imagePath) {
    return getFile(`assets/icons/${imagePath}`);
}

function getFile(path) {
    return `${__dirname}/${path}`;
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
  tray.setContextMenu(Menu.buildFromTemplate([	
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
        label: "Test notification",	
        click: () => {
            const notification = new Notification({
                title: 'Test from Costlocker',
                body: 'Don’t forget to track time',
                closeButtonText: 'Close',
            });
            notification.on('click', toggleApp);
            notification.show();
        },	
    },	
    {	
        label: `About (v${app.getVersion()})`,	
        click: () => require('electron').shell.openExternal('https://costlocker.com?utm_source=desktop'),	
    },	
  ]));
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

const toggleApp = () => {
    if (mainWindow && mainWindow.isVisible() && !mainWindow.isMinimized()) {
        hideApp();
    } else {
        openApp();
    }
}

platform.init();
app.on('ready', () => {
    createTray();
    openApp();
});
app.on('activate', function () {
  if (!mainWindow) {
    createWindow();
  }
});

ipcMain.on('app-show', openApp);
ipcMain.on('app-hide', hideApp);
ipcMain.on('app-quit', quitApp);

const checkIdleTime = () => {
    if (!state.idleTimeSeconds) {
        return;
    }
    const now = Math.floor(new Date().getTime() / 1000);
    const idleTime = Math.floor(desktopIdle.getIdleTime());
    if (idleTime != state.idleTimeSeconds) {
        return;
    }
    openApp();
    state.detectIdletime(now - idleTime);
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
    state.idleTimeSeconds = args[0];
    state.detectIdletime = (timestamp) => event.sender.send('idletime-detected', timestamp);
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
