
# Costlocker desktop app

**Work in Progress!**
We recommend to use [Costlocker from App Store](https://blog.costlocker.com/45af1ab4fcb8) for Mac users.

## Usage

1. Download binary from releases
1. Unzip the file
1. Create shortcut
    * `Costlocker.exe` on Windows
    * symlink `Costlocker` on Linux
    * move `Costlocker.app` to Applications on Mac
1. Execute binary _(might cause warnings)_

![Windows 10](https://user-images.githubusercontent.com/7994022/42493819-aa900fc4-841e-11e8-8e53-01c9e46ab148.png)

#### Platform limitations

* _Mac_ - app is opened by right click on tray icon, left click shows menu
* _Windows_ - might not work on older systems _(`Connection timed-out` error)_
* _Linux_ - centered window position, click on tray always opens menu

## Changelog

#### 2018.07.10

* tray integration, window settings, idle time detection, reminder to track time
* app binaries without installer (Windows, Linux, Mac)

---

## Development

```bash
# development
npm install
npm start

# release
npm run package-osx
npm run package-linux
npm run package-win-x86 # 32-bit
npm run package-win-x64
```
