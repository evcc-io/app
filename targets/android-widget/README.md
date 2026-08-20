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
- `kotlin/Theme.kt` — day/night colors (mirrors iOS's `scheme == .dark`
  branches), full typography scale, per-forecast-type palette (mirrors
  `Theme.swift`'s `Palette.make`).
- `scripts/androidWidget/withAndroidWidget.ts` — Expo config plugin: injects the
  Kotlin, the `res/xml` widget info, the manifest `<receiver>`/`<activity>`
  entries, and the Glance/Compose gradle wiring. Registered in `app.config.ts`.
- **Visual parity with iOS** (mirrors `LoadpointViews.swift`/`Views.swift`):
  status dot + color-coded status text, a rounded/striped progress bar
  (`ProgressBarRenderer.kt`, since Glance has no fractional-width layout
  modifier), chip-style mode buttons with a selected-state fill, full
  heating/finished/waitForVehicle status + kWh-fallback metric logic ported
  from `LoadpointVM.build`, a two-column forecast header, a Y-axis +
  step-vs-area chart modes + per-type color in `ChartRenderer.kt` (previously
  always a flat green area line regardless of data type), bold/colored footer
  stats, and light/dark card backgrounds throughout. Deliberately not ported:
  the reload button, deep links, and Swift Charts' `.monotone` spline
  smoothing (straight line segments instead).
- **Live preview when configuring**: both config Activities now fetch real
  data for the tapped server/loadpoint/toggle and render an actual preview of
  the widget (`WidgetPreview.kt`) before committing via a new "Use this"
  button - previously the pick-a-row tap committed immediately with no
  preview. Built with plain Views (reusing `ChartRenderer`/`ProgressBarRenderer`
  bitmaps) rather than a live Glance render, since embedding real Glance
  content in a classic-Views Activity needs the full Compose UI stack plus an
  unpublished/experimental Google API - see the "Live preview" discussion this
  was scoped from for the trade-off.
- **Localization**: `scripts/build-widget-strings.mts` now also generates
  Android string resources (`res/values(-b+<locale>)/strings.xml`) alongside
  the iOS `.xcstrings` catalog, from the same evcc-daemon + this-app Weblate
  translations. Every widget/config-Activity string reads from `R.string.*`
  now - none are hardcoded. The config Activities' picker/live-preview flow
  has no iOS equivalent, so those strings are new additions to this app's own
  `i18n/en.json`/`de.json` (`widget.androidConfig.*`) rather than reuses.
- **Size variants**: `LoadpointWidget` now declares
  `SizeMode.Responsive(setOf(SMALL_SIZE, WIDE_SIZE))` and reads `LocalSize`
  to branch layout - compact stays the inline mode-chip row below the metric
  (deliberately kept interactive, unlike iOS's compact size which drops to a
  plain-text mode label instead of buttons), wide adds a vertical
  mode-selector column alongside, mirroring `LoadpointCard`'s
  `HStack { left; modeSelector }`. No manifest change needed - the widget was
  already resizable (`resizeMode="horizontal|vertical"`); this just makes the
  wider layout actually render something different once resized. The forecast
  widgets don't have an iOS size-variant precedent, so they stay single-size.
- **Smart mode redesign** (mirrors iOS's `Loadpoint.swift`/#246): `Loadpoint`
  gained `alwaysCharge`/`chargerFeatureContinuous`. Its presence detects
  smart-mode servers (`off/smart/now`, with per-device-class labels - e.g.
  continuous heat pumps get Normal/Boost, switchable devices get On) vs. old
  servers (`off/pv/minpv/now`, unchanged). `modeChipLabel()` appends a
  read-only "∞" to the Smart chip when Always charge is on/once - no toggle in
  the widget, matching iOS. `widget.mode.pv`/`widget.mode.minpv` stay in the
  strings script as frozen (non-Weblate) translations since evcc removed them
  from its own i18n once the redesign shipped.
- **Reload button + deep link + fixed resize bounds**, from Maschga's PR #255
  review (evcc-io/app#255#issuecomment-5317470240): `LoadpointWidget`'s title
  row now has a reload icon (`res/drawable/ic_reload.xml`, a Material "refresh"
  glyph tinted via Glance's `ColorFilter.tint()`) wired to a new `ReloadAction`,
  mirroring iOS's `ReloadIntent`. Both widget families are tappable end-to-end
  and open the app to the right place (`evcc://loadpoint?server=…&lp=…` /
  `evcc://forecast?server=…`, `evcc://server` when unconfigured), mirroring
  `widgetURL` in `LoadpointViews.swift`/`Views.swift` via a shared
  `deepLinkAction()` (`actionStartActivity` + `ACTION_VIEW`). The card-wide
  clickable sits under the mode chips/reload button's own clickable regions,
  which take priority within their bounds - same layering iOS gets for free
  from SwiftUI's region-based hit testing.
  `loadpoint_widget_info.xml`'s resize bounds are now pinned exactly to
  `SizeMode.Responsive`'s two declared breakpoints
  (`minResizeWidth`/`maxResizeWidth` 180-340dp, height locked at 110dp,
  `resizeMode="horizontal"` only) instead of the previous open-ended
  `horizontal|vertical`; `forecast_widget_info.xml` dropped `resizeMode`
  entirely since those widgets have no size-variant layout to grow into. Both
  changes close the gap where a launcher could hand the widget a real
  container bigger than any size Glance was told to lay content out for,
  leaving blank space the Composable had no way to fill - the likely cause
  behind the "strange spacing" Maschga's screenshot showed, though this still
  needs on-device confirmation (tracked as a live-device follow-up, along with
  the mode-button highlight bug and the widget-reconfigure check from the same
  review).

Not done yet (follow-ups for parity with iOS): none currently tracked -
remaining gaps (reload button, deep links, spline chart smoothing) are
documented as deliberate simplifications above, not open TODOs.

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
