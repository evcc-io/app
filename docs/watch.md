# Watch Apps

Decisions for the Apple Watch and Wear OS apps. Each entry records what was decided and why. Background and user feedback: [#348](https://github.com/evcc-io/app/issues/348); technical spikes: [#349](https://github.com/evcc-io/app/pull/349) (watchOS), [#362](https://github.com/evcc-io/app/pull/362) (Wear OS).

Status: accepted, not implemented yet.

## 1. Focused, not a port of the web UI

v1 covers: current energy flow (solar, home, grid, battery), loadpoints with status, changing the charge mode, the forecast (solar, price, CO₂, as in the forecast widgets), and complications. The forecast is both a page in the app and a glanceable surface outside it (Smart Stack widget on watchOS, tile on Wear OS). Everything else (plans, limits, vehicle selection, sessions, configuration) stays in the phone app.

Why: a watch is for a glance and one quick action. Watches have no WebView, so every feature is native code on two platforms that has to follow the web UI by hand.

## 2. Native per platform, built on the widget code

The watchOS app is SwiftUI, the Wear OS app is Kotlin with Compose for Wear OS. Both reuse the widget layer of their platform (API client, loadpoint model, formatting, colors, strings), see [widgets.md](widgets.md). Shared Swift moves to `targets/_shared`.

Why: React Native does not run on either watch. Reusing the widget layer keeps status logic, wording and formatting identical across widget, complication and app.

## 3. Set up on the phone, fetch on the watch

Servers are added in the phone app only and synced to the watch (WatchConnectivity on iOS, Wearable Data Layer on Android). The watch then talks to evcc directly and works without the phone nearby.

Considered:

- Relaying requests through the phone app: the RN app is not running in the background.
- Setup on the watch: entering URLs and credentials on a watch is not reasonable.

Consequences: credentials are stored on the watch. A watch away from the home network reaches only servers with a remote URL, same as the phone. watchOS cannot resolve `.local` names, so the phone resolves them and syncs the IP as fallback.

## 4. Servers get a stable id

Every server gets a persistent unique id, used by widgets, complications, sync and deep links. This replaces the position-based id from [widgets.md](widgets.md) decision 6 and is a prerequisite for the watch work.

Why: with complications there are four surfaces holding a server reference. A reorder on the phone must not silently repoint them.

## 5. Complications are configured per instance, with automatic defaults

Each complication has a server and, where relevant, a loadpoint setting. Both default to "Automatic": the phone's active server, and the first loadpoint that is charging, otherwise connected, otherwise the first. Inside the app, a server switcher appears only when more than one server is synced.

Why: most users have one server and one or two loadpoints and should never see a picker. Users with several can pin a complication to a specific server and loadpoint using the platform's own configuration UI (watch face editor on watchOS, configuration activity on Wear OS).

## 6. One complication per data point

Loadpoint, home battery, solar, grid and energy flow are separate complications rather than one with a "value" setting. Same reasoning as [widgets.md](widgets.md) decision 4.

Complications are not live, see [widgets.md](widgets.md) decision 3. They lead with slow-moving values (charge level, status) and always have a stale state.

## 7. Wear OS ships through Google Play only

The Wear OS app is a separate artifact under the same package name and store listing as the phone app, released on Play's dedicated Wear OS track. The phone-side sync dependency is excluded from F-Droid builds.

Why: phone-to-watch sync needs Google Play services and matching signing keys, neither of which the F-Droid build has. Other watch platforms (Garmin, Fitbit, Amazfit, Huawei) are out of scope; each would be a separate app on its own SDK.

## 8. watchOS 26 is the minimum

The watchOS app and its complications require watchOS 26.

Why: from watchOS 26 on, complications are configured in the watch face editor like iOS widgets, so the configuration from decision 5 works with the same code as the iOS widgets. Older versions have no such editor and would need a second path with pre-built presets per server and loadpoint. Consequence: watches that cannot run watchOS 26 are not supported.

## 9. One design, then watchOS first

Screens, flows and states are designed once for both platforms before implementation. watchOS is built first, Wear OS second. The spikes are reworked to match the design and split into reviewable steps (stable ids, shared code, sync, app, complications).

Why: the spikes showed the plumbing works, but were built without agreeing on what people need from evcc on the wrist. Building one platform first settles the open details before they are ported.

## 10. Wear OS tiles are for the forecast only

Wear OS gets forecast tiles that follow the phone's active server. There is no loadpoint tile; loadpoints are covered by the complication and the app.

Why: the public Tiles API has no per-instance configuration (each tile can be added once, without settings; only an undocumented manifest flag exists), so a tile cannot be pinned to a server or loadpoint the way a complication can. The forecast needs neither a loadpoint nor, for most users, a server choice, and a complication cannot show a chart. Tiles also use their own UI toolkit, so each one is extra code rather than a reused app screen.
