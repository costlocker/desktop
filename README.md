
# Costlocker desktop app

[![Build Status](https://travis-ci.org/costlocker/desktop.svg?branch=master)](https://travis-ci.org/costlocker/desktop)
[![Windows status](https://ci.appveyor.com/api/projects/status/whw8pi4r8hbq7qoh?svg=true&passingText=Windows)](https://ci.appveyor.com/project/costlockerbot/desktop)

**Work in Progress!**
We recommend to use [Costlocker from App Store](https://blog.costlocker.com/45af1ab4fcb8) for Mac users.

## Usage

1. [Download binary from releases](https://github.com/costlocker/desktop/releases)
1. Unzip the file
1. Create shortcut
    * `Costlocker.exe` on Windows
    * symlink `Costlocker` on Linux
    * move `Costlocker.app` to Applications on Mac
1. Execute binary _(might cause warnings)_

#### Platform limitations

* _Windows_ - might not work on older systems _(`Connection timed-out` error)_

## Changelog

#### 2018.07.16

* _Windows:_ fix loading application icon

#### 2018.07.13

* taskbar/dock instead of tray
* movable window with frame _(minimize/close buttons)_

![Windows 10 - taskbar](https://user-images.githubusercontent.com/7994022/42687619-a8a293e4-8699-11e8-9228-5ddabb340c2a.png)

#### 2018.07.10

* tray integration, window settings, idle time detection, reminder to track time
* app binaries without installer (Windows, Linux, Mac)

![Windows 10 - tray](https://user-images.githubusercontent.com/7994022/42493819-aa900fc4-841e-11e8-8e53-01c9e46ab148.png)

---

## Development

```bash
# development
npm install
npm start

# release
npm run package-osx
npm run package-linux
npm run package-win-x86-installer
```
