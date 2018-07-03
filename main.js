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

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: '#f2f2f2'
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.send('webview-devtools'));
};

const openApp = () => {
    if (mainWindow === null) {
        createWindow();
    } else if (mainWindow.isMinimized()) {
        mainWindow.restore();
    } else {
        mainWindow.focus();
    }
}

function createTray () {
  tray = new Tray('images/icon_inactive_16x16.png');
  tray.setToolTip('Costlocker');
  tray.on('click', openApp);
};

app.on('ready', () => {
    createWindow();
    createTray();
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
ipcMain.on('app-hide', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});
ipcMain.on('app-quit', () => app.quit());

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
ipcMain.on('update-tray', (event, args) => {
    state.traySettings = args[0];
    if (state.trayInterval) {
        clearInterval(state.trayInterval);
    }
    if (!state.traySettings.isActive) {
        tray.setImage('images/icon_inactive_16x16.png');
        tray.setTitle('');
        return;
    }
    tray.setImage('images/icon_16x16.png');
    const updateTitle = () => {
        const now = Math.floor(new Date().getTime() / 1000);
        const duration = formatSeconds(now - state.traySettings.timestamp);
        if (state.traySettings.name && state.traySettings.timestamp) {
            tray.setTitle(`${state.traySettings.name} (${duration})`);
        } else if (state.traySettings.name) {
            tray.setTitle(`${state.traySettings.name}`);
        } else {
            tray.setTitle(`${duration}`);
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
