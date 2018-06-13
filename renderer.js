
const { ipcRenderer } = require('electron');

const webview = document.querySelector('webview');
webview.addEventListener('did-start-loading', () => {
    console.log('start loading');
});
webview.addEventListener('did-stop-loading', () => {
    console.log('Costlocker loaded');
});
webview.addEventListener('dom-ready', () => {
    webview.openDevTools();
    return;
    setTimeout(
        () => {
            const idleDate = new Date();
            idleDate.setHours(idleDate.getHours() - 2);
            const timestamp = Math.floor(idleDate / 1000);
            webview.executeJavaScript("_clWrapApp_reminderTrackButtonPressed()");
            webview.executeJavaScript("_clWrapApp_idleTimeDetected(" + timestamp + ");");
        },
        2000
    );
});
webview.addEventListener('ipc-message', event => {
    ipcRenderer.send(event.channel, event.args);
});
