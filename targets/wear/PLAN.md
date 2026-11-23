# Wear OS companion app

Branch: `feat/wear-os-companion-app` (off `main`).

Goal: the Android counterpart of the iOS Apple Watch companion app
(evcc-io/app#349, fixes evcc-io/app#348) - site overview plus one page per
charging point with charge level, power, status and the charge mode switch,
on the wrist, synced from the phone app instead of configured separately.

## Delivery: standalone companion app + tile

- **App** (Compose for Wear OS) - the primary surface. A swipeable pager:
  site overview, then one page per loadpoint (connected first), with a
  server switcher when more than one server is synced. Polls every 10s while
  in the foreground; mode switches are optimistic (haptic, reverts on
  failure). Mirrors `targets/watch/*.swift` (WatchApp, Pages, SiteModel,
  ServerList) from the iOS PR.
- **Tile** (`androidx.wear.tiles` + `androidx.wear.protolayout`) - a
  glanceable, swipe-from-watch-face surface for one loadpoint. Closest Wear
  OS equivalent of the iOS complications, but simpler: v1 shows the phone's
  default server and its first connected loadpoint, and tapping it opens the
  app rather than acting on the tile directly (see "Cut from v1" below).
- **Phone -> watch sync**: a new Expo module (`modules/watch-sync`, Android
  only for now) hands the server list to the watch via the Wearable Data
  Layer (`DataClient.putDataItem`, urgent + persisted - same delivery
  guarantee as the iOS side's `WCSession.updateApplicationContext`),
  triggered from the existing `utils/widgetSync.ts` call site. A
  `WearableListenerService` on the watch stores it in a `DataStore`
  (`ServerStore.kt`).

## What's shared with the Android widget (#255)

`ApiClient.kt`, `Format.kt`, `Loadpoint.kt` and the pure view-model helpers
(`status()` / `metric()` / `modes()` / `smartModeServer()`) are ported
verbatim from `targets/android-widget/kotlin/`, same as planned in the first
version of this doc - including the 401/429 login backoff (more important
here than for the widget, which polls every 30 min against this app's 10s).
Disabled loadpoints (bare placeholders in the API, evcc-io/app#349) are
filtered out the same way the iOS watch app's `.active` does, both for the
pager's page list and the tile's loadpoint pick. `Theme.kt`'s ARGB tokens are
reused for both the tile
(protolayout) and the Compose app (wrapped in `Color(...)`). Mode/status
string keys (`widget_mode_*`, `widget_lpstatus_*`, `widget_lpheat_*`,
`widget_loadpoint_name`, `widget_unreachable_*`, `widget_noData_*`,
`widget_config_*`) are reused from the widget's `Localizable.xcstrings`
catalog, so no new translation work was needed for those. The new `wear.*`
strings are compiled into that same catalog by `scripts/build-widget-strings.mts`
(`npm run widget:strings`), same mechanism and sourcing the Apple Watch app
uses for its `watch.*` keys: energy-flow labels (`wear.flow.*`) reuse the evcc
daemon's own translations (`../evcc/i18n`, `main.energyflow.*`) instead of
being re-translated here, so they're already in every locale evcc supports;
only the truly app-only strings (`wear.empty.*`, `wear.modeFailed`) are
authored by hand in `i18n/en.json` / `de.json` (then Weblate for the rest).
`scripts/wearModule/withWearModule.ts`'s `loadTranslations()` just reads all
of it straight out of the catalog, like the widget plugin does.

## Deliberate differences from the iOS watch app

- **No `.local` hostname fallback resolution.** iOS resolves a discovered
  `evcc.local` to an IP on the phone and syncs both, because watchOS can't
  resolve Bonjour names. The Android widget (#255) this is ported from
  doesn't carry a fallback URL either, and `SyncedServer` has no field for
  one; `ApiClient.kt` just uses the synced URL as-is, matching that
  precedent. Revisit together if this turns out to be a real pain point in
  practice.
- **"Mode change failed" auto-dismisses instead of requiring a tap.** iOS
  shows a blocking `.alert` the user has to dismiss. Wear Compose's
  `Alert`/`Dialog` API couldn't be verified against a real build here, so
  `WearApp.kt` uses a plain `Chip` banner that both auto-dismisses after
  2.5s and can be tapped away - safer to get right without a device, at
  the cost of matching iOS's exact interaction.
- **Server list (incl. basic-auth password) is in plain DataStore, not an
  encrypted store.** iOS keeps it in the Keychain specifically because the
  phone app, widget extension and watch app are three separate OS sandboxes
  that need a shared access group to pass secrets between them. On Android,
  the widget's own precedent (`SharedStore.kt`, `#255`) already relies on
  plain per-app storage because widget and phone app share one process/UID;
  `:wear` is a separate package on a separate device, so that exact rationale
  doesn't carry over, but nothing beyond Android's normal per-app sandboxing
  protects the synced password at rest. Worth an `androidx.security.crypto`
  pass if this bothers you more than the equivalent gap already accepted for
  the widget.
- **Tile has no stale-data fallback.** The iOS complication caches the last
  loadpoint fetch and shows it with a `stale` flag on failure. The tile here
  just returns `Unreachable` on any fetch failure - no local cache for the
  tile's own (non-polled, on-demand) fetch path. Would need a small
  DataStore-backed cache mirroring `SiteCache` if this turns out to matter in
  practice (the tile only refreshes every 15 min, so a single bad fetch is
  more visible than it would be for the 10s-polled app).
- **Tile is not configurable per instance.** The iOS complications offer one
  per server x loadpoint via `recommendations()`. Wear Tiles don't have a
  direct equivalent system entry point, and building one (per-tile-instance
  config activity, keyed by tile ID) needs on-device verification this
  environment can't do. v1 ships a single tile showing the phone's default
  server and its first connected loadpoint; tapping it opens the app. Real
  per-instance config is a natural v2.
- **Tile taps don't change modes.** Same reasoning as above: Tiles can
  react to taps via a `LoadAction` callback into `onTileRequest`, but
  getting that exact state-passing right without a device to test against
  was judged too risky for v1. Mode switching happens in the app, which uses
  plain Compose state and is easier to reason about statically.
- **v1 is a separate installable APK, not embedded in the phone app's Play
  listing.** The iOS watch app ships inside the same App Store product
  (an embedded watchOS target). The Android equivalent - an embedded Wear
  APK inside the phone app's AAB, auto-installed onto a paired watch by Play
  - needs Gradle task wiring between the `:app` and `:wear` modules _and_
    Play Console configuration, neither of which can be verified here. `:wear`
    builds as its own module in the same Gradle project
    (`./gradlew :wear:assembleRelease`) and would ship the same way the phone
    app's direct APK already does (GitHub Releases) until embedding lands.

## Module layout (created by the config plugin at prebuild)

```
:wear                       new Gradle module, com.android.application, standalone
  AndroidManifest.xml       MainActivity, LoadpointTileService, WatchSyncListenerService
  src/main/java/io/evcc/wear/
    ApiClient.kt            ported from targets/android-widget/kotlin (copied at prebuild)
    Format.kt
    Loadpoint.kt
    SiteState.kt
    ServerStore.kt          multi-server DataStore, populated by WatchSyncListenerService
    WatchSyncListenerService.kt
    SiteViewModel.kt        polling + optimistic mode switch + haptics
    Theme.kt / WearTheme.kt
    Components.kt / OverviewScreen.kt / LoadpointScreen.kt / ServerPickerScreen.kt
    WearApp.kt / MainActivity.kt
    LoadpointTileService.kt / LoadpointTileLayout.kt
    WearApplication.kt
  src/main/res/values*/strings.xml   generated from the widget's xcstrings + i18n/*.json "wear" keys
  src/main/res/mipmap-*/ic_launcher*.png   copied from targets/wear/icon/ (prebuilt from assets/adaptive-icon.png)
```

## Open TODOs

- [ ] Build and run on a real Wear OS device or emulator (API 34+, Wear
      image) - nothing in this PR has been verified against an actual
      Gradle build; the Wear Compose / Tiles APIs used (pager, `Alert`-free
      failure banner, protolayout builders) are written against current
      library signatures from memory, not compiled.
- [ ] Verify the Data Layer sync round-trip against a real paired phone +
      watch (emulator pairing works for this).
- [ ] Tile preview artwork (still a plain navy rectangle placeholder;
      launcher icon is done - `targets/wear/icon/`, resized from the same
      `assets/icon-light.png` the rest of the app uses).
- [ ] Per-instance tile configuration (server + loadpoint picker), and a
      direct mode-switch action on the tile itself (see "Cut from v1").
- [ ] Embed `:wear` into the phone app's AAB so Play installs it onto a
      paired watch automatically, instead of shipping a separate APK.
- [ ] Non-English/German locale strings come from Weblate once this merges,
      same as the rest of the app's translations.
