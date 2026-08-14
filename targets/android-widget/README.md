# Android widgets (Jetpack Glance)

Android counterpart of the iOS WidgetKit widgets in `targets/widget/`. Home-screen
widgets are native on both platforms — no code is shared with the Swift widgets;
this is a Kotlin/Glance reimplementation of the same contracts.

## Status

Five interactive home-screen widgets, end-to-end, with per-instance
configuration and instant refresh: **Loadpoint**, and forecast widgets for
**Solar / Price / CO₂ / Feed-in**. Verified with `expo prebuild` + a real local
Android build (`./gradlew assembleDebug` / `assembleRelease`).

Done:

- `utils/widgetSync.ts` — writes the server list to a JSON file the widget reads
  (Android has no App Group; the widget is in the same package, so a file in the
  app's `filesDir` works).
- `kotlin/SharedStore.kt` — reads that file (mirrors `SharedStore.swift`).
- `kotlin/ApiClient.kt` — GET `/api/state?jq=…` + basic auth + POST actions, plus
  the `Loadpoint` model (mirrors `ApiClient.swift` / `Loadpoint.swift`).
- `kotlin/LoadpointWidget.kt` — Glance widget + interactive mode buttons.
- `kotlin/ForecastWidget.kt` / `ChartRenderer.kt` — the four forecast widgets,
  with a Canvas-drawn chart (mirrors `ForecastWidget.swift`).
- **Per-instance config**: `LoadpointWidgetConfigActivity.kt` (pick server, then
  loadpoint) and `ForecastWidgetConfigActivity.kt` (pick server; Solar also gets
  an "adjust to real production" toggle). Selections persist per `appWidgetId` in
  `WidgetConfig.kt`, including a fallback queue for launchers (e.g. MIUI) that
  hand the configure Activity a different id than the one the widget binds with.
- **Immediate refresh on config/server change**: `modules/evcc-widget` (a small
  local Expo native module) exposes `refresh()`, called from
  `utils/widgetRefresh.ts` after `widgetSync.ts` writes the file — no need to
  wait for the periodic `updatePeriodMillis` tick.
- `kotlin/Theme.kt` — brand colors / text styles.
- `scripts/androidWidget/withAndroidWidget.ts` — Expo config plugin: injects the
  Kotlin, the `res/xml` widget info, the manifest `<receiver>`/`<activity>`
  entries, and the Glance/Compose gradle wiring. Registered in `app.config.ts`.

Not done yet (follow-ups for parity with iOS):

- Localization (`.xcstrings` → Android string resources) — widget text is
  currently hardcoded English in the Kotlin.
- Size variants, full visual parity with the iOS widgets.

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
