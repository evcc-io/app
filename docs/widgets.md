# Widgets

Decisions behind the home-screen widgets (iOS: forecast + loadpoint, Android: loadpoint). Each entry records what was decided and why, so it is not "fixed" by accident. Implementation details live in the code and in `targets/android-widget/README.md`.

Status: accepted, shipped.

## 1. Widgets are native code, not React Native

Widgets are written in SwiftUI/WidgetKit (`targets/widget/`) and Kotlin/Jetpack Glance (`targets/android-widget/`). The Swift target is wired in by `@bacons/apple-targets`, the Kotlin sources by our own config plugin (`scripts/androidWidget/`).

Why: the app is a thin WebView host and widgets cannot render a WebView. Configurable widgets, custom charts and interactive buttons need the native widget APIs directly; the RN widget libraries (`expo-widgets`, `react-native-android-widget`) did not cover that. Both platforms keep the same file split (`ApiClient`, `Format`, `Loadpoint`, `SharedStore`, `Theme`) so a change can be ported one-to-one.

## 2. Widgets fetch from evcc themselves

The app only mirrors its server list to the widget (`utils/widgetSync.ts`): into the App Group on iOS, into a JSON file on Android. Each widget then calls `/api/state` on its own, with a `jq` filter for just its slice.

Why: widgets must refresh while the app is not running, and the RN runtime is not available in a widget process. Consequence: the server list including basic-auth credentials is stored outside the app's own storage, and the iOS extension needs its own cleartext (ATS) exception.

## 3. Widgets are not live

Widgets refetch on a system-scheduled timeline (loadpoint 30 min, forecast 60 min), plus a short burst of reloads after a mode change made from the widget. On failure they show the last successful value marked as stale.

Why: both platforms budget widget refreshes; polling is not possible. Designs must prefer slow-moving values and always have a stale state.

## 4. One widget per data type

Solar, price, CO₂ and feed-in are separate widgets sharing one implementation. Per-instance configuration is limited to what the user must choose: server, and loadpoint for the loadpoint widget.

Why: a single forecast widget with a "data type" parameter did not switch reliably on iOS. Separate kinds are also easier to find in the widget gallery.

## 5. Configuration uses plain values, not entities

On iOS the server picker is a `String` parameter with a dynamic options provider, not an `AppEntity`. The loadpoint picker depends on the selected server and is fetched live. Without a selection, a widget follows the app's active server.

Why: `AppEntity` identifiers failed to resolve inside the widget extension and broke selection.

## 6. Servers are identified by list position (known debt)

A widget stores the server's index in the app's list. Loadpoints are addressed by their 1-based index, as in the evcc API.

Why: servers had no id when widgets were built. Reordering or deleting servers can point a widget at a different server. To be replaced by a stable per-server id, see [watch.md](watch.md) decision 4.

## 7. Wording and formatting come from evcc

Widget strings are generated (`npm run widget:strings`) into one string catalog from the main repo's translations wherever a term already exists there, and from this app's `i18n/` only for widget-specific strings. The Android plugin derives its resources from the same catalog. Number, power and price formatting is a hand-ported subset of the web UI's `formatter.ts`.

Why: widgets must use the same terms and units as the web UI in every language without separate translation work. Consequence: the generated catalog is committed (CI has no `../evcc`), and formatter changes in the main repo need to be re-ported.

## 8. Actions stay minimal, everything else opens the app

The only action a widget performs is changing the charge mode. A tap anywhere else deep-links into the app (`evcc://loadpoint`, `evcc://forecast`), which switches server and navigates the WebView.

Why: the web UI is the product; widgets are a glance plus the one action people want without opening the app.
