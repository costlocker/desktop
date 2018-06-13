const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');

let mainWindow, tray;

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

ipcMain.on('update-tray', (event, args) => {
    const settings = args[0]; 
    var image = settings.isActive ? 'images/icon_16x16.png' : 'images/icon_inactive_16x16.png';
    var title = settings.timestamp ? `${settings.timestamp} ${settings.name || ''}` : '';
    tray.setImage(image);
    tray.setTitle(title);
});
