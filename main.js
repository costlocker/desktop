const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');

let mainWindow, tray;
const state = {
    traySettings: null,
    trayInterval: null,
};

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600});
  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
};

function createTray () {
  tray = new Tray('images/icon_inactive_16x16.png');
  tray.setToolTip('Costlocker');
  tray.on('click', function () {
    if (mainWindow === null) {
        createWindow();
    } else if (mainWindow.isMinimized()) {
        mainWindow.restore();
    } else {
        mainWindow.focus();
    }
  });
};

app.on('ready', () => {
    createWindow();
    createTray();
});
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

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
    state.trayInterval = setInterval(updateTitle, 1000);
});
