
const { ipcRenderer } = require('electron');

const webview = document.querySelector('webview');
const spinner = document.getElementById('spinner');

const deleteElement = (e) => e.parentElement ? e.parentElement.removeChild(e) : null;

webview.addEventListener('did-stop-loading', () => {
    deleteElement(spinner);
});
webview.addEventListener('did-fail-load', (e) => {
    deleteElement(webview);
    deleteElement(spinner);
    document.getElementById('error').removeAttribute('style');
    document.getElementById('error-message').innerHTML = `${e.errorCode} ${e.errorDescription}`;
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
ipcRenderer.on('webview-devtools', () => webview.openDevTools());
