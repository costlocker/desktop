
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

#### 2019.8.29

* Better idle time detection
* _Mac:_ behavior like in native app (no tray menu, keyboard shortcuts)
* _Internal:_ update electron

#### 2018.8.22

* Tray & taskbar/dock
* _Binaries:_ Windows installer, MacOS dmg, Linux zip
* _Internal:_ electron-builder, Windows code signing

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
npm install
npm start
```

### Release

1. [Changelog commit + tag](https://github.com/costlocker/desktop/commit/3ff8cb7)
1. Travis/Appveyor uploads binaries to an pre-release
    ```bash
    npm run package-osx
    npm run package-linux
    npm run package-win
    ```
1. [Sign an Windows app](https://www.digicert.com/code-signing/ev-code-signing-certificate-installation.htm#sign) _([Win7](https://knowledge.digicert.com/solution/SO20528.html))_
    ```bash
    # 1) plug an USB dongle
    # 2) sign the app
    "C:\Program Files\Microsoft SDKs\Windows\v7.0A\bin\signtool.exe" sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /n "Costlocker SE" /v "win-installer-x86-2018.8.20.exe"
        The following certificate was selected:
        Issued to: Costlocker SE
        Issued by: DigiCert EV Code Signing CA (SHA2)
        Expires:   Fri Jul 24 14:00:00 2020
        SHA1 hash: A71780C9FA2FC15E04B05D09404A7688813671DC

        Done Adding Additional Store
        Successfully signed and timestamped: win-installer-x86-2018.8.20.exe

        Number of files successfully Signed: 1
        Number of warnings: 0
        Number of errors: 0
1. [Verify the signed app](https://docs.microsoft.com/cs-cz/windows/desktop/SecCrypto/using-signtool-to-verify-a-file-signature) - _[SignTool Error?](https://knowledge.digicert.com/solution/SO21771.html)_
    ```bash
    "C:\Program Files\Microsoft SDKs\Windows\v7.0A\bin\signtool.exe" verify /pa /v "win-installer-x86-2018.8.20.exe"
        Verifying: win-installer-x86-2018.8.20.exe
        Hash of file (sha256): ...
        Signing Certificate Chain: ...
        The signature is timestamped: Wed Aug 22 09:24:30 2018
        Timestamp Verified by: ...
        Successfully verified: win-installer-x86-2018.8.20.exe

        Number of files successfully Verified: 1
        Number of warnings: 0
        Number of errors: 0
    ```
1. Upload the signed app & publish the release
