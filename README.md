# evcc Companion App

Native app wrapper for evcc UI based on [react-native](https://reactnative.dev/) and [expo.dev](https://expo.dev/). It uses [UI Kitten / Eva](https://akveo.github.io/react-native-ui-kitten/) as a design system. Native parts are written in TypeScript and kept to a minimum.

## Download the App

| Apple                                                                                                                                                                             | Android                                                                                                                                                                              |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [<img src="assets/badges/apple-appstore.svg" height="47" alt="Download on the App Store" style="height:47px; width: auto;">](https://apps.apple.com/app/evcc-io/id6478510176)     | [<img src="assets/badges/google-play.svg" height="47" alt="Get it on Google Play" style="height:47px; width: auto;">](https://play.google.com/store/apps/details?id=io.evcc.android) |
| [<img src="assets/badges/apple-macstore.svg" height="47" alt="Download on the Mac App Store" style="height:47px; width: auto;">](https://apps.apple.com/app/evcc-io/id6478510176) | [<img src="assets/badges/fdroid.svg" height="47" alt="Get it on F-Droid" style="height:47px; width: auto;">](https://f-droid.org/packages/io.evcc.android)                           |
|                                                                                                                                                                                   | [<img src="assets/badges/github.svg" height="47" alt="Get APK from GitHub" style="height:47px; width: auto;">](https://github.com/evcc-io/app/releases/latest)                       |

## Beta Testing

- Apple Testflight https://testflight.apple.com/join/8Y4elMpv
- Android: Download the APK from [GitHub Releases](https://github.com/evcc-io/app/releases)

## Features

- Onboarding
  - find evcc instances in local network via mDNS
  - add instance manually via URL
  - custom url scheme to improve setup (see [here](#url-scheme))
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
  - via additional top navigation entry "Change server"
- Light and dark mode for native UI
  - based on system settings (not configurable)

## Screenshots

![iOS Screenshots](./ressources/evcc_app_ios_v1.png)

## URL Scheme

The evcc app registers a `evcc://` URL scheme on your device.
This can be helpful to improve the setup process by providing the users with a link or QR code that prefills the server URL and basic auth credentials (optional).
Especially helpful when dealing with longer URLs for public tunnels or related setups.

The app supports the following URL scheme:

**Format:**

Opens the server entry field with prefilled values.
All params are optional.

```
evcc://server?url=...&username=...&password=...
```

_Note: Ensure that query values are properly encoded._

**Example:**

![URL Scheme Example](https://api.qrserver.com/v1/create-qr-code/?color=000000&bgcolor=FFFFFF&data=evcc%3A%2F%2Fserver%3Furl%3Dhttps%3A%2F%2Fevcc.local%26username%3Dadmin%26password%3Dsecret&qzone=1&margin=0&size=150x150&ecc=L)

[evcc://server?url=https://evcc.local&username=admin&password=secret](evcc://server?url=https://evcc.local&username=admin&password=secret)

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

You can test basic auth locally by with a [caddy server](https://caddyserver.com):

```bash
caddy run
```

It will open a server on http://localhost:7080 with `admin:secret` as basic auth credentials and forward requests to your local evcc instance 7070.

## Build Android APK without EAS

This is how F-Droid builds the APK:

```bash
npx expo prebuild --platform android --clean
cd android/app
sed -i -e '/signingConfig /d' build.gradle
./../gradlew assembleRelease
```

## Translation

We use [Weblate](https://hosted.weblate.org/projects/evcc/app/) to manage our translations.

[![Translation status](https://hosted.weblate.org/widget/evcc/app/287x66-white.png)](https://hosted.weblate.org/engage/evcc/)
