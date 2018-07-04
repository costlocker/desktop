const { app, BrowserWindow, Menu, Tray, ipcMain, Notification } = require('electron');
const desktopIdle = require('desktop-idle');

let mainWindow, tray;
const state = {
    traySettings: null,
    trayInterval: null,
    reminderTimeout: null,
    idleTimeSeconds: null,
    detectIdletime: null,
};

function getFile(path) {
    return `${__dirname}/${path}`;
}

function hideApp() {
    if (mainWindow) {
        mainWindow.minimize();
    }
}

function quitApp() {
    app.quit();
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 680,
    frame: false,
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#f2f2f2'
  });
  mainWindow.loadFile(getFile('index.html'));
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.send('webview-devtools'));
}

const openApp = () => {
    if (mainWindow === null) {
        createWindow();
    } else if (mainWindow.isMinimized()) {
        mainWindow.restore();
    } else {
        mainWindow.focus();
    }
}

const toggleApp = () => {
    if (mainWindow && mainWindow.isVisible && !mainWindow.isMinimized()) {
        hideApp();
    } else {
        openApp();
    }
}

function createTray () {
  tray = new Tray(getFile('assets/images/icon_inactive_16x16.png'));
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
  ]))
};

app.on('ready', () => {
    createWindow();
    createTray();
    if (app.dock) {
        app.dock.hide();
    }
});
app.on('window-all-closed', function () {
  const isNotMacOS = process.platform !== 'darwin';
  if (isNotMacOS) {
    app.quit();
  }
});
app.on('activate', function () {
  if (mainWindow === null) {
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
const setAppImage = (image) => tray.setImage(image);
const setAppTitle = (title) => {
    tray.setTitle(title);
    tray.setToolTip(title && title.length ? title : 'Costlocker');
};
ipcMain.on('update-tray', (event, args) => {
    state.traySettings = args[0];
    if (state.trayInterval) {
        clearInterval(state.trayInterval);
    }
    if (!state.traySettings.isActive) {
        setAppImage(getFile('assets/images/icon_inactive_16x16.png'));
        setAppTitle('');
        return;
    }
    setAppImage(getFile('assets/images/icon_16x16.png'));
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
