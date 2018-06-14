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
const reloadReminder = (seconds) => ipcRenderer.sendToHost('update-reminder', seconds);
const reloadApp = (state) => ipcRenderer.sendToHost(state);

// Costlocker -> Desktop
global._clWrapApp = {
    setStatusBarIcon_: (isActive) => reloadTray({ isActive }),
    setProjectName_: (name) => reloadTray({ name }),
    setProjectTime_: (timestamp) => reloadTray({ timestamp }),
    startDetectingIdleTime_: (interval) => console.log('startDetectingIdleTime_', interval),
    stopDetectingIdleTime: () => console.log('stopDetectingIdleTime'),
    startRemindingToTrack_: (seconds) => reloadReminder(seconds),
    stopRemindingToTrack: () => reloadReminder(null),
    presentPopover_: () => reloadApp('app-show'),
    dismissPopover: () => reloadApp('app-hide'),
    terminateApp: () => reloadApp('app-quit'),
};

// Desktop -> Costlocker
// _clWrapApp_idleTimeDetected
// _clWrapApp_reminderTrackButtonPressed
