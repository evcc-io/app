# evcc Native App

Native app wrapper for evcc UI based on [react-native](https://reactnative.dev/) and [expo.dev](https://expo.dev/). It uses [UI Kitten / Eva](https://akveo.github.io/react-native-ui-kitten/) as a design system. Native parts are written in TypeScript and kept to a minimum.

## iOS Beta Testing

Join the beta program via TestFlight:

https://testflight.apple.com/join/8Y4elMpv

## Android Beta Testing

Install the APK from the [releases](https://github.com/evcc-io/app/releases) page.

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

- No support for multiple instances [#3](https://github.com/evcc-io/app/issues/3)
- mDNS discovery only supports HTTP [#1](https://github.com/evcc-io/app/issues/1)

We'll work on these in a future release. Feel free to vote 👍 to help priorization and add new feature ideas.

## Development

Ensure that you've Node.js and NPM installed. Then install the dependencies:

```bash
npm install
```

Follow the expo instructions to run local simulators for [iOS](https://docs.expo.dev/workflow/ios-simulator/) and [Android](https://docs.expo.dev/workflow/android-studio-emulator/).

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
