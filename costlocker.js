const { ipcRenderer } = require('electron');

const reloadApp = (state, data) => ipcRenderer.sendToHost(state, data);

// Costlocker -> Desktop
global._clWrapApp = {
    setWindowSettings_: (settings) => reloadApp('update-window', settings),
    setRunningEntry_: (settings) => reloadApp('update-tray', settings),
    startDetectingIdleTime_: (seconds) => reloadApp('update-idletime', seconds),
    stopDetectingIdleTime: () => reloadApp('update-idletime', null),
    startRemindingToTrack_: (seconds) => reloadApp('update-reminder', seconds),
    stopRemindingToTrack: () => reloadApp('update-reminder', null),
    presentPopover_: () => reloadApp('app-show'),
    dismissPopover: () => reloadApp('app-hide'),
    terminateApp: () => reloadApp('app-quit'),
};

// renderer.js: Desktop -> Costlocker
// _clWrapApp_idleTimeDetected
// _clWrapApp_reminderTrackButtonPressed
