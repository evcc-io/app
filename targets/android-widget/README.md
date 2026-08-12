# Android widgets (Jetpack Glance)

Android counterpart of the iOS WidgetKit widgets in `targets/widget/`. Home-screen
widgets are native on both platforms — no code is shared with the Swift widgets;
this is a Kotlin/Glance reimplementation of the same contracts.

## Status

This is a **pipeline spike**: one interactive **Loadpoint** widget, end-to-end.
It has **not been compiled** yet — it needs `expo prebuild` + a real Android
build to verify (see below). Treat it as a foundation to iterate on.

Done:

- `utils/widgetSync.ts` — writes the server list to a JSON file the widget reads
  (Android has no App Group; the widget is in the same package, so a file in the
  app's `filesDir` works).
- `kotlin/SharedStore.kt` — reads that file (mirrors `SharedStore.swift`).
- `kotlin/ApiClient.kt` — GET `/api/state?jq=…` + basic auth + POST actions, plus
  the `Loadpoint` model (mirrors `ApiClient.swift` / `Loadpoint.swift`).
- `kotlin/LoadpointWidget.kt` — Glance widget + interactive mode buttons.
- `kotlin/Theme.kt` — brand colors / text styles.
- `scripts/androidWidget/withAndroidWidget.ts` — Expo config plugin: injects the
  Kotlin, the `res/xml` widget info, the manifest `<receiver>`, and the
  Glance/Compose gradle wiring. Registered in `app.config.ts`.

Not done yet (follow-ups for parity with iOS):

- **Per-instance config** (pick server + loadpoint). iOS uses App Intents; Android
  needs a widget **configuration Activity**. The spike uses the default server and
  `loadpoints[0]`.
- **The other 5 widgets** (Solar / Price / CO₂ / Feed-in forecasts).
- **Immediate refresh on config change** — `widgetSync.ts` only writes the file;
  pushing an instant update from RN needs a tiny native module calling
  `LoadpointWidget().updateAll(context)`. Today the widget refreshes on its own
  schedule (`updatePeriodMillis`, 30 min floor) / after a mode change.
- Localization (`.xcstrings` → `strings.xml`), size variants, full visual parity.

## Build / test

```
npm install
npx expo prebuild --platform android --clean
npx expo run:android           # or open android/ in Android Studio
```

Then long-press the home screen → Widgets → evcc → Loadpoint.

## ⚠ Known integration risks (verify these first)

1. **Compose compiler vs Kotlin version.** Glance needs the Compose compiler.
   The plugin applies `org.jetbrains.kotlin.plugin.compose` (Kotlin 2.0+). After
   prebuild, check the project's Kotlin version:
   - Kotlin **2.0+**: the compose plugin must also be on the classpath. If the
     build complains, add it to the root `build.gradle` `plugins`/`classpath`.
   - Kotlin **< 2.0**: drop the plugin and instead set
     `composeOptions { kotlinCompilerExtensionVersion "…" }` in `withGlanceGradle`.
   - Align `COMPOSE_BOM` / `GLANCE_VERSION` in the plugin accordingly.
2. **Manifest receiver** — confirm `<receiver>` landed with the
   `APPWIDGET_UPDATE` filter and `@xml/loadpoint_widget_info` meta-data.
3. **File path** — `Paths.document` (RN) must resolve to `context.filesDir`
   (Kotlin). Verify the written file appears at
   `/data/user/0/io.evcc.android/files/evcc-widget-servers.json`.
