
const { ipcRenderer } = require('electron');

const webview = document.querySelector('webview');
webview.addEventListener('did-start-loading', () => {
    console.log('start loading');
});
webview.addEventListener('did-stop-loading', () => {
    console.log('Costlocker loaded');
});
webview.addEventListener('did-fail-load', (e) => {
    webview.parentElement.removeChild(webview);
    document.getElementById('error').removeAttribute('style');
    document.getElementById('error-message').innerHTML = `${e.errorCode} ${e.errorDescription}`;
});
webview.addEventListener('dom-ready', () => {
    webview.openDevTools();
});
webview.addEventListener('ipc-message', event => {
    ipcRenderer.send(event.channel, event.args);
});

const callCostlocker = (method, arg) => {
    if (arg === undefined) {
        webview.executeJavaScript(`${method}()`);
    } else {
        webview.executeJavaScript(`${method}(${arg})`);
    }
};
ipcRenderer.on('reminder-clicked', () => callCostlocker('_clWrapApp_reminderTrackButtonPressed'));
ipcRenderer.on('idletime-detected', (event, timestamp) => callCostlocker('_clWrapApp_idleTimeDetected', timestamp));
