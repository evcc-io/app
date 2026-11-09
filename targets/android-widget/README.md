# Android home-screen widget

Jetpack Glance counterpart of the iOS loadpoint widget (`targets/widget/`).

- `kotlin/` — widget sources, copied into `android/app/src/main/java/io/evcc/android/widget/` at prebuild.
  - `LoadpointWidget.kt` — Glance widget, mode buttons, reload, deep link into the app.
  - `LoadpointWidgetConfigActivity.kt` + `WidgetPreview.kt` — placement flow: pick server, pick loadpoint, live preview. Selection lives in the widget's Glance state.
  - `SharedStore.kt` — reads the server list `utils/widgetSync.ts` writes to `files/evcc-widget-servers.json`.
  - `ApiClient.kt`, `Format.kt`, `Theme.kt`, `ProgressBarRenderer.kt` — ports of the Swift equivalents.
- `scripts/androidWidget/withAndroidWidget.ts` — Expo config plugin. Injects the Kotlin, widget info / preview / icon resources, manifest `<receiver>` + `<activity>`, Glance dependency and Compose compiler wiring. Registered in `app.config.ts`.

Strings: shared widget strings come from `targets/widget/Localizable.xcstrings` (`npm run widget:strings`), the Android-only config Activity strings (`widget.androidConfig.*`) from `i18n/*.json`. The plugin turns both into `res/values-b+<locale>/strings.xml` at prebuild; nothing generated is committed.

## Build

```
npx expo prebuild --platform android --clean
npx expo run:android
```

Long-press the home screen → Widgets → evcc → Charging point.

## Gotchas

- The Compose compiler plugin version must equal the Kotlin version React Native pins; the plugin reads it from `node_modules/react-native/gradle/libs.versions.toml`.
- Always one cell high, four layouts by width via `SizeMode.Exact` (1x1/2x1 SoC+power, 3x1 +name and status, 4x1 +docked mode selector). Progress is a strip along the bottom edge. Horizontal resize only.
- Server ids are list positions (see `widgetServerId` in `utils/widgetSync.ts`), so reordering servers in the app can point a widget at a different server.
