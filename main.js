const { app, BrowserWindow, systemPreferences, ipcMain, Notification } = require('electron');
const desktopIdle = require('desktop-idle');

let mainWindow;
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
        getIcon: isActive =>
            isActive ? 'png/blue.png' : `png/${state.window.theme || 'black'}.png`,
        setAppImage: image => mainWindow.setIcon(image),
        onWindowClose: quitApp => quitApp(),
    }),
    win32: () => ({
        init: () => app.setAppUserModelId('com.github.costlocker.desktop'),
        getIcon: isActive => {
            const theme = 
                state.window.theme ||
                (systemPreferences.getColor('desktop') == '#000000' ? 'white' : 'black');
            return isActive ? 'win/icon.ico' : `win/${theme}.ico`;
        },
        setAppImage: image => mainWindow.setIcon(image),
        onWindowClose: quitApp => quitApp(),
    }),
    darwin: () => ({
        init: () => null,
        getIcon: isActive => {
            const theme =
                state.window.theme ||
                (systemPreferences.isDarkMode() ? 'white' : 'black');
            return isActive ? 'png/blue.png' : `png/${theme}.png`;
        },
        setAppImage: image => app.dock.setIcon(image),
        onWindowClose: () => null,
    })
}
const platform = platforms[process.platform]();

function getIcon(isActive) {
    return getFile(`assets/icons/${platform.getIcon(isActive)}`);
}

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
  const icon = getIcon(false);
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
    icon: icon,
    backgroundColor: '#f2f2f2'
  });
  setAppImage(icon);
  mainWindow.loadFile(getFile('index.html'));
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.send('webview-devtools'));
}

const openApp = () => {
    if (!mainWindow) {
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

platform.init();
app.on('ready', () => {
    createWindow();
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
const setAppImage = (image) => {
    platform.setAppImage(image);
};
const setAppTitle = (title) => {
    mainWindow.setTitle(title && title.length ? title : 'Costlocker');
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
