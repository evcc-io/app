# Android widgets (Jetpack Glance)

Android counterpart of the iOS WidgetKit widgets in `targets/widget/`. Home-screen
widgets are native on both platforms — no code is shared with the Swift widgets;
this is a Kotlin/Glance reimplementation of the same contracts.

## Status

One interactive home-screen widget, end-to-end, with per-instance
configuration and instant refresh: **Loadpoint**. Verified with `expo prebuild`
+ a real local Android build (`./gradlew assembleDebug` / `assembleRelease`).

**Scope note**: this PR was originally built with five widgets (Loadpoint plus
forecast widgets for Solar/Price/CO₂/Feed-in). Per naltatis's review
(evcc-io/app#255#issuecomment-5327087002), the forecast widgets are split out
to a separate follow-up PR/branch (`feat/android-widgets-forecast`) — Android
has no first-party charting API comparable to iOS's Swift Charts (not even for
regular in-app Compose UI, and third-party Compose chart libraries generally
can't render inside a Glance widget's `RemoteViews` surface at all), so those
widgets carry real hand-rolled-canvas risk this PR doesn't need to also
resolve. This PR now covers the loadpoint widget only; the forecast branch
still has the from-scratch four-widget implementation (`ForecastWidget.kt`,
`ChartRenderer.kt`, `ForecastWidgetConfigActivity.kt`) for whenever that's
picked back up.

Done:

- `utils/widgetSync.ts` — writes the server list to a JSON file the widget reads
  (Android has no App Group; the widget is in the same package, so a file in the
  app's `filesDir` works).
- `kotlin/SharedStore.kt` — reads that file (mirrors `SharedStore.swift`).
- `kotlin/ApiClient.kt` — GET `/api/state?jq=…` + basic auth + POST actions, plus
  the `Loadpoint` model (mirrors `ApiClient.swift` / `Loadpoint.swift`).
- `kotlin/LoadpointWidget.kt` — Glance widget + interactive mode buttons.
- **Per-instance config**: `LoadpointWidgetConfigActivity.kt` (pick server, then
  loadpoint). Selections persist per `appWidgetId` in `WidgetConfig.kt`,
  including a fallback queue for launchers (e.g. MIUI) that hand the configure
  Activity a different id than the one the widget binds with.
- **Immediate refresh on config/server change**: `modules/evcc-widget` (a small
  local Expo native module) exposes `refresh()`, called from
  `utils/widgetRefresh.ts` after `widgetSync.ts` writes the file — no need to
  wait for the periodic `updatePeriodMillis` tick.
- `kotlin/Theme.kt` — day/night colors (mirrors iOS's `scheme == .dark`
  branches) and typography scale.
- `scripts/androidWidget/withAndroidWidget.ts` — Expo config plugin: injects the
  Kotlin, the `res/xml` widget info, the manifest `<receiver>`/`<activity>`
  entries, and the Glance/Compose gradle wiring. Registered in `app.config.ts`.
- **Visual parity with iOS** (mirrors `LoadpointViews.swift`): status dot +
  color-coded status text, a rounded/striped progress bar
  (`ProgressBarRenderer.kt`, since Glance has no fractional-width layout
  modifier), chip-style mode buttons with a selected-state fill, full
  heating/finished/waitForVehicle status + kWh-fallback metric logic ported
  from `LoadpointVM.build`, and light/dark card backgrounds throughout.
- **Live preview when configuring**: `LoadpointWidgetConfigActivity` fetches
  real data for the tapped server/loadpoint and renders an actual preview of
  the widget (`WidgetPreview.kt`) before committing via a new "Use this
  loadpoint" button - previously the pick-a-row tap committed immediately with
  no preview. Built with plain Views (reusing `ProgressBarRenderer` bitmaps)
  rather than a live Glance render, since embedding real Glance content in a
  classic-Views Activity needs the full Compose UI stack plus an
  unpublished/experimental Google API - see the "Live preview" discussion this
  was scoped from for the trade-off.
- **Localization**: `scripts/build-widget-strings.mts` also generates Android
  string resources (`res/values(-b+<locale>)/strings.xml`) alongside the iOS
  `.xcstrings` catalog, from the same evcc-daemon + this-app Weblate
  translations. Every widget/config-Activity string reads from `R.string.*`
  now - none are hardcoded. The config Activity's picker/live-preview flow has
  no iOS equivalent, so those strings are new additions to this app's own
  `i18n/en.json`/`de.json` (`widget.androidConfig.*`) rather than reuses. (The
  script's `KEYS` table still includes forecast-widget-only entries -
  untouched here since the same script also feeds iOS's already-shipped
  forecast widgets.)
- **Size variants**: `LoadpointWidget` declares
  `SizeMode.Responsive(setOf(SMALL_SIZE, WIDE_SIZE))` and reads `LocalSize`
  to branch layout - compact stays the inline mode-chip row below the metric
  (deliberately kept interactive, unlike iOS's compact size which drops to a
  plain-text mode label instead of buttons), wide adds a vertical
  mode-selector column alongside, mirroring `LoadpointCard`'s
  `HStack { left; modeSelector }`.
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
  mirroring iOS's `ReloadIntent`. The widget is tappable end-to-end and opens
  the app to the right loadpoint (`evcc://loadpoint?server=…&lp=…`,
  `evcc://server` when unconfigured), mirroring `widgetURL` in
  `LoadpointViews.swift` via `deepLinkAction()` (`actionStartActivity` +
  `ACTION_VIEW`). The card-wide clickable sits under the mode chips/reload
  button's own clickable regions, which take priority within their bounds -
  same layering iOS gets for free from SwiftUI's region-based hit testing.
  `loadpoint_widget_info.xml`'s resize bounds are now pinned exactly to
  `SizeMode.Responsive`'s two declared breakpoints
  (`minResizeWidth`/`maxResizeWidth` 180-340dp, height locked at 110dp,
  `resizeMode="horizontal"` only) instead of the previous open-ended
  `horizontal|vertical` - closing the gap where a launcher could hand the
  widget a real container bigger than any size Glance was told to lay content
  out for, leaving blank space the Composable had no way to fill. Likely the
  cause behind the "strange spacing" Maschga's screenshot showed, though this
  still needs on-device confirmation (tracked as a live-device follow-up,
  along with the mode-button highlight bug and the widget-reconfigure check
  from the same review).

Not done yet (follow-ups for parity with iOS): none currently tracked for the
loadpoint widget - remaining gaps are documented as deliberate simplifications
above, not open TODOs. The forecast widgets are out of scope for this PR (see
"Scope note" above).

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
