# Watch Apps

Decisions for the Apple Watch and Wear OS apps. Each entry records what was decided and why. Background and user feedback: [#348](https://github.com/evcc-io/app/issues/348); technical spikes: [#349](https://github.com/evcc-io/app/pull/349) (watchOS), [#362](https://github.com/evcc-io/app/pull/362) (Wear OS); design draft: [evcc Watch Concept](https://claude.ai/artifact/Y6p66wCVXsHwcmFu347Ai3#page-dcb81aee8d83).

Status: accepted, not implemented yet. Undecided points are listed under [Open](#open).

## 1. Focused, not a port of the web UI

v1 covers: current energy flow (solar, home, grid, battery), loadpoints with status, changing the charge mode including always charge, the forecast (solar, price, CO₂, as in the forecast widgets), and complications. The forecast is both a page in the app and a glanceable surface outside it (Smart Stack widget on watchOS, tile on Wear OS). Everything else (plans, limits, vehicle selection, sessions, configuration) stays in the phone app.

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

Every server gets a persistent unique id, used by widgets, complications, sync and deep links. This replaces the position-based id the widgets started with ([widgets.md](widgets.md) decision 6) and is a prerequisite for the watch work. Implemented.

Ids are consecutive numbers, assigned when a server is added and never reused, also not after the server was removed. Servers that existed before keep their former list position as id.

Why: with complications there are four surfaces holding a server reference. A change to the server list on the phone must not silently repoint them. Continuing the position numbering keeps existing widgets working without a migration on the widget side; not reusing ids keeps a surface that still points at a removed server from showing a newer one.

## 5. Complications are configured per instance, with automatic defaults

Each complication has a server and, where relevant, a loadpoint setting. Both default to "Automatic": the phone's active server, and the first loadpoint that is charging, otherwise connected, otherwise the first. Inside the app, a server switcher appears only when more than one server is synced.

Why: most users have one server and one or two loadpoints and should never see a picker. Users with several can pin a complication to a specific server and loadpoint using the platform's own configuration UI (watch face editor on watchOS, configuration activity on Wear OS).

## 6. One complication per data point

Loadpoint, home battery, solar and grid are separate complications rather than one with a "value" setting. Same reasoning as [widgets.md](widgets.md) decision 4. There is no energy flow complication: several values plus a bar are too much for one slot, the app's overview covers it.

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

## 11. The overview is the energy flow bar plus rows

The overview shows the energy flow bar from the web UI on top, then one row per value in a fixed order: production, battery, grid, consumption, chargers, heaters. Each row is icon, name and power, with the power right-aligned; the battery row shows the charge level before its power. Chargers and heaters are always one summed row each, also with a single device, and always show power rather than a status. Rows for things the site does not have are left out, rows at 0 W turn grey.

Why: the bar is what makes the screen recognisable as evcc. Rows keep every value next to its name and survive long translations, which a grid of values did not. Summed rows match the web UI's energy flow and keep the overview the same height however many loadpoints exist; the individual loadpoints follow as their own pages.

## 12. One vertical list of pages

The app is a single vertical sequence: overview, one page per loadpoint (connected first), forecast. It is moved with the crown or by swiping. The forecast types (solar, price, CO₂) sit side by side within the forecast page. With more than one server, a list button beside the overview title opens the server list, and picking a server returns to its overview. There is no swipe gesture for switching servers.

Why: one axis driven by the crown is what both platforms expect. Switching servers is rare, and a sideways swipe for it would collide with the forecast paging and the system's back gesture, and could change the house being shown by accident.

## 13. The loadpoint page fits without scrolling

A loadpoint page shows status, charge level, power and vehicle on the left and the mode switch on the right, on one screen. Tapping the already selected Smart mode toggles always charge, shown as ∞ on the button. Devices without always charge ignore the second tap.

Why: testers of the spike had to scroll to reach the modes and asked for exactly this split. Always charge belongs to Smart since the mode redesign, so it gets no control of its own.

## 14. Only the current charge modes

The watch offers off, smart and fast, with the device-specific names (on, normal, boost). The legacy modes of servers before the mode redesign are not supported.

Why: supporting both sets doubles the mode switch for a shrinking group of servers. The widgets keep their legacy support, see [widgets.md](widgets.md).

## 15. Units per value, direction as an arrow

Each power value picks its own unit: W below 1000 W, kW from there. Direction is an arrow attached to the power, never a sign: on the battery ↑ charging and ↓ discharging, on the grid ↓ export and ↑ import. The grid is always labelled "Grid", not "Grid import" or "Grid export".

Why: there is no room for a second label or a legend, a minus sign is easy to miss at this size, and tinted watch faces remove the colours that carry direction in the web UI. Per-value units differ from the web UI's energy flow, which uses one unit for all rows; on the watch a small value next to a large one would otherwise read as "0.3 kW".

## 16. Text gives way, numbers do not

Where space is tight, names, labels and status text shorten with an ellipsis. Numbers, units, arrows and the ∞ are never cut, wrapped or pushed out of place. Mode names shrink to fit their button before they are cut.

Why: translations and user-chosen names vary in length and cannot be designed for one by one. A shortened label is still understood from its icon and position; a clipped or shifted value is wrong.

## Open

- **Servers with legacy modes**: what the watch shows for a server that still reports the old modes (read-only, or not supported at all).
- **Mode switch on Wear OS**: three modes side by side do not fit longer translations. Stacking them as on watchOS is the likely answer.
