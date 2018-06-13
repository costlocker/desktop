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

// Costlocker -> Desktop
global._clWrapApp = {
    setStatusBarIcon_: (isActive) => reloadTray({ isActive }),
    setProjectName_: (name) => reloadTray({ name }),
    setProjectTime_: (timestamp) => reloadTray({ timestamp }),
    startDetectingIdleTime_: (interval) => console.log('startDetectingIdleTime_', interval),
    stopDetectingIdleTime: () => console.log('stopDetectingIdleTime'),
    startRemindingToTrack_: (interval) => console.log('startRemindingToTrack_', interval),
    stopRemindingToTrack: () => console.log('stopRemindingToTrack'),
    presentPopover_: () => console.log('presentPopover_'),
    dismissPopover: () => console.log('dismissPopover'),
    terminateApp: () => console.log('terminateApp'),
};

// Desktop -> Costlocker
// _clWrapApp_idleTimeDetected
// _clWrapApp_reminderTrackButtonPressed
