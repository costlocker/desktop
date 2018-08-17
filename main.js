const { app, BrowserWindow, Menu, Tray, systemPreferences, ipcMain, Notification } = require('electron');
const desktopIdle = require('desktop-idle');

let mainWindow, tray;
const state = {
    traySettings: null,
    trayInterval: null,
    reminderTimeout: null,
    idleTimeSeconds: null,
    detectIdletime: null,
    window: {
        theme: null,
        width: 480,
        height: 680,
        padding: 20,
    }
};

const platforms = {
    linux: () => ({
        init: () => null,
        onReady: () => null,
        onOpen: () => null,
        onHide: () => null,
        onWindowClose: quitApp => quitApp(),
        getIcon: isActive =>
            isActive ? 'png/blue.png' : `png/${state.window.theme || 'black'}.png`,
        setTrackerStatus: (isActive, icon) => {
            if (!mainWindow) {
                return;
            }
            mainWindow.setIcon(icon);
        },
    }),
    win32: () => ({
        init: () => app.setAppUserModelId('com.github.costlocker.desktop'),
        onReady: () => null,
        onOpen: () => null,
        onHide: () => null,
        onWindowClose: quitApp => quitApp(),
        getIcon: () => 'win/icon.ico',
        setTrackerStatus: (isActive) => {
            if (!mainWindow) {
                return;
            }
            mainWindow.setOverlayIcon(
                isActive ? getFile(`assets/icons/png/16x16.png`) : null,
                isActive ? "Tracking..." : ""
            );
            mainWindow.setProgressBar(isActive ? 1 : 0);
        },
    }),
    darwin: () => ({
        init: () => {
            app.dock.hide();
        },
        onReady: () => {
            createTray();
        },
        onOpen: (icon) => {
            app.dock.show();
            setTimeout(
                () => app.dock.setIcon(icon),
                100
            );
        },
        onHide: () => {
            app.dock.hide();
        },
        onWindowClose: () => {
            app.dock.hide();
        },
        getIcon: isActive => {
            const theme =
                state.window.theme ||
                (systemPreferences.isDarkMode() ? 'white' : 'black');
            return isActive ? 'png/blue.png' : `png/${theme}.png`;
        },
        setTrackerStatus: (isActive, icon) => {
            app.dock.setIcon(icon);
            tray.setImage(getFile(isActive ? 'assets/icons/mac/activeTemplate.png' : 'assets/icons/mac/inactive.png'));
        },
    })
}
const platform = platforms[process.platform]();

function getIcon(isActive) {
    return getFile(`assets/icons/${platform.getIcon(isActive)}`);
}

function getFile(path) {
    return `${__dirname}/${path}`;
}

function hideApp(event) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    if (mainWindow) {
        mainWindow.minimize();
    }
    platform.onHide();
}

function quitApp() {
    app.quit();
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: state.window.width,
    height: state.window.height,
    frame: true,
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: false,
    movable: true,
    center: true,
    icon: getIcon(false),
    backgroundColor: '#f2f2f2'
  });
  reloadTrackerStatus(false);
  mainWindow.loadFile(getFile('index.html'));
  mainWindow.on('minimize', hideApp);
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.send('webview-devtools'));
}

function createTray () {
  if (tray) {
    return;
  }
  tray = new Tray(getIcon());	
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
        label: 'About',	
        click: () => require('electron').shell.openExternal('https://costlocker.com?utm_source=desktop'),	
    },	
  ]));
}

const openApp = () => {
    if (!mainWindow) {
        createWindow();
    } else if (mainWindow.isMinimized()) {
        mainWindow.restore();
    } else {
        mainWindow.focus();
    }
    platform.onOpen(getIcon(state.traySettings ? state.traySettings.isActive : false));
}

const toggleApp = () => {
    if (mainWindow && mainWindow.isVisible && !mainWindow.isMinimized()) {
        hideApp();
    } else {
        openApp();
    }
}

platform.init();
app.on('ready', () => {
    platform.onReady();
    openApp();
});
app.on('window-all-closed', function () {
    platform.onWindowClose(quitApp);
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
const reloadTrackerStatus = (isActive) => platform.setTrackerStatus(isActive, getIcon(isActive));
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
    reloadTrackerStatus(state.traySettings.isActive);
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
    reloadTrackerStatus(state.traySettings ? state.traySettings.isActive : false);
};
ipcMain.on('update-window', (event, args) => {
    const settings = args[0];
    if (settings) {
        state.window =  { ...state.window, ...settings };
        reloadWindowSettings();
    }
});
