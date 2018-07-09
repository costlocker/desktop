const { ipcRenderer } = require('electron');

const reloadApp = (state) => ipcRenderer.sendToHost(state);
const reloadAppTimeout = (state, seconds) => ipcRenderer.sendToHost(state, seconds);

// Costlocker -> Desktop
global._clWrapApp = {
    setWindowSettings_: (settings) => reloadAppTimeout('update-window', settings),
    setRunningEntry_: (settings) => reloadAppTimeout('update-tray', settings),
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
