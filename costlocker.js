
// Costlocker -> Desktop
global._clWrapApp = {
    setStatusBarIcon_: (isActive) => console.log('setStatusBarIcon_', isActive),
    setProjectName_: (name) => console.log('setProjectName_', name),
    setProjectTime_: (timestamp) => console.log('setProjectTime_', timestamp),
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
