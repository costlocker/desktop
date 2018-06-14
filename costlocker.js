const { ipcRenderer } = require('electron');

let traySettings = {
    isActive: false,
    name: '',
    timestamp: '',
};
const reloadTray = (updatedSettings) => {
    traySettings = { ...traySettings, ...updatedSettings };
    ipcRenderer.sendToHost('update-tray', traySettings);
};
const reloadApp = (state) => ipcRenderer.sendToHost(state);
const reloadAppTimeout = (state, seconds) => ipcRenderer.sendToHost(state, seconds);

// Costlocker -> Desktop
global._clWrapApp = {
    setStatusBarIcon_: (isActive) => reloadTray({ isActive }),
    setProjectName_: (name) => reloadTray({ name }),
    setProjectTime_: (timestamp) => reloadTray({ timestamp }),
    startDetectingIdleTime_: (seconds) => reloadAppTimeout('update-idletime', seconds),
    stopDetectingIdleTime: () => reloadAppTimeout('update-idletime', null),
    startRemindingToTrack_: (seconds) => reloadAppTimeout('update-reminder', seconds),
    stopRemindingToTrack: () => reloadAppTimeout('update-reminder', null),
    presentPopover_: () => reloadApp('app-show'),
    dismissPopover: () => reloadApp('app-hide'),
    terminateApp: () => reloadApp('app-quit'),
};

// renderer.js: Desktop -> Costlocker
// _clWrapApp_idleTimeDetected
// _clWrapApp_reminderTrackButtonPressed
