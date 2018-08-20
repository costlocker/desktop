
# Costlocker desktop app

[![Build Status](https://travis-ci.org/costlocker/desktop.svg?branch=master)](https://travis-ci.org/costlocker/desktop)
[![Windows status](https://ci.appveyor.com/api/projects/status/whw8pi4r8hbq7qoh?svg=true&passingText=Windows)](https://ci.appveyor.com/project/costlockerbot/desktop)

## Usage

1. [Download an app for your OS](https://github.com/costlocker/desktop/releases)
1. Install
    * _Windows:_ run installer
    * _Linux:_ unzip the file, create symlink `Costlocker`
    * _Mac:_ move `Costlocker.app` to Applications
1. Run the app

#### Platform limitations

* _Mac:_ we recommend to use [Costlocker from App Store](https://blog.costlocker.com/45af1ab4fcb8) for Mac users. It has no warning about an unsigned app.

## Changelog

#### 2018.8.20

* Tray & taskbar/dock
* _Binaries:_ Windows installer, MacOS dmg, Linux zip
* _Internal:_ electron-builder

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
npm run package-win
```

### Release

1. [Changelog commit + tag](https://github.com/costlocker/desktop/commit/3ff8cb7)
1. Travis/Appveyor uploads binaries to an pre-release
1. Publish the release
