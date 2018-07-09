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

function getIcon(isActive) {
    let icon;
    if (process.platform == 'linux') { 
        icon = isActive ? 'png/blue.png' : `png/${state.window.theme || 'white'}.png`;
    } else if (process.platform == 'win32') { 
        if (!state.window.theme) {
            state.window.theme = systemPreferences.getColor('desktop') == '#000000' ? 'white' : 'black';
        }
        icon = isActive ? 'win/icon.ico' : `win/${state.window.theme}.ico`;
    } else {
        icon = isActive ? 'png/activeTemplate.png' : 'png/inactive.png';
    }
    return getFile(`assets/icons/${icon}`);
}

function getFile(path) {
    return `${__dirname}/${path}`;
}

function setWindowPosition() {
    if (!mainWindow) {
        return;
    }
    const position = getWindowPosition();
    if (position.x !== undefined) {
        mainWindow.setPosition(position.x, position.y);
    }
}

function getWindowPosition() {
    if (process.platform == 'linux') {
        return { center: true };
    }
    const screen = require('electron').screen;
    let position = mainWindow && process.platform == 'win32'
        ? screen.getCursorScreenPoint() : tray.getBounds();
    const primarySize = screen.getPrimaryDisplay().workAreaSize; // Todo: this uses primary screen, it should use current
    const verticalPosition = position.y >= primarySize.height / 2 ? 'bottom' : 'top';
    const horizontalPosition = position.x >= primarySize.width / 2 ? 'right' : 'left';
    return {
        x: getX(),
        y: getY()
    };

    function getX() {
        // Find the horizontal bounds if the window were positioned normally
        const horizBounds = {
            left: position.x - state.window.width / 2,
            right: position.x + state.window.width / 2
        }
        // If the window crashes into the side of the screem, reposition
        if (horizontalPosition == 'left') {
            return horizBounds.left <= state.window.padding
                ? (position.x + 2 * state.window.padding)
                : horizBounds.left;
        } else {
            return horizBounds.right >= primarySize.width
                ? primarySize.width - state.window.padding - state.window.width
                : horizBounds.right - state.window.width;
        }
    }
    function getY() {
        return verticalPosition == 'bottom'
            ? Math.max(state.window.padding, position.y - state.window.height - state.window.padding)
            : position.y + state.window.padding;
    }
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
    width: state.window.width,
    height: state.window.height,
    frame: false,
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
    ...getWindowPosition(),
    icon: getFile('assets/icons/png/1024x1024.png'),
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
        setWindowPosition();
    } else {
        mainWindow.focus();
        setWindowPosition();
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
  ]))
};

app.on('ready', () => {
    createTray();
    createWindow();
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
    setAppImage(getIcon(state.traySettings.isActive));
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
    setAppImage(getIcon(state.traySettings ? state.traySettings.isActive : false));
};
ipcMain.on('update-window', (event, args) => {
    const settings = args[0];
    if (settings) {
        state.window =  { ...state.window, ...settings };
        reloadWindowSettings();
    }
});
