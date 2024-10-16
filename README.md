# evcc Native App

Native app wrapper for evcc UI based on [react-native](https://reactnative.dev/) and [expo.dev](https://expo.dev/). It uses [UI Kitten / Eva](https://akveo.github.io/react-native-ui-kitten/) as a design system. Native parts are written in TypeScript and kept to a minimum.

## iOS Beta Testing

Join the beta program via TestFlight:

https://testflight.apple.com/join/8Y4elMpv

## Features

- Onboarding
  - find evcc instances in local network via mDNS
  - add instance manually via URL
  - try the app using the demo instance
- Full screen evcc UI
  - use the app in a full screen web view
  - UI runs in an optimized mode that respects insets (notch, ...)
  - better gesture support (swipe, ...) by disabling browser zoom and overscroll
- Online/offline detection
  - app shows loading screen when instance is not reachable
  - automatic reconnection when instance becomes reachable again
  - avoids missleading situations where the app is shown but not functional
- Configured URL can be changed
  - in offline mode
  - via additional top navigation entry "Server ändern"
- Light and dark mode for native UI
  - based on system settings (not configurable)

## Screenshots

![iOS Screenshots](./ressources/evcc_app_ios_v1.png)

## Known limitations

- Only German language is supported [#2](https://github.com/evcc-io/app/issues/2)
- No support for multiple instances [#3](https://github.com/evcc-io/app/issues/3)
- mDNS discovery only supports HTTP [#1](https://github.com/evcc-io/app/issues/1)
- No Android release yet [#4](https://github.com/evcc-io/app/issues/4)
- Not (basic) auth support [#5](https://github.com/evcc-io/app/issues/5)

We'll work on these in a future release. Feel free to vote 👍 to help priorization and add new feature ideas.

## Development

Ensure that you've Node.js and NPM installed. Then install the dependencies:

```bash
npm install
```

Follow the expo instructions to run local simulators for [iOS](https://docs.expo.dev/workflow/ios-simulator/) and [Android](https://docs.expo.dev/workflow/android-studio-emulator/).

Alternatively, if you use VS Code and [devcontainers](https://code.visualstudio.com/docs/devcontainers/containers), you can use the "Dev containers: Clone repository in container volume" action. This will create a devcontainer with the required toolchain and install dependencies. Wait until the startup log says "Done. Press any key to close the terminal." and check for any errors.

Start dev mode to get into an interactive development environment.

```bash
npm run start
```

Or start iOS, Android or Web simulator directly.

```bash
npm run ios
npm run android
npm run web
```

## Building an Android apk

To build an Android apk, in addition to the Development setup explained above, you need to:

- Install the EAS CLI with `npm install --global eas-cli`
- Create a (free) EAS account on https://expo.dev/
- Remove `projectId` from app.json
- Run `eas build -p android --profile preview` and follow the instructions
- When the build has finished, you should get a link that you can directly use to download the apk and a QR code to scan on your phone, also getting you the apk