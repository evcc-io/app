# Agent Rules for evcc Companion App

Guidance for AI coding agents working in this repository.

Related agent files in sibling repos:

- [evcc-io/evcc AGENTS.md](https://github.com/evcc-io/evcc/blob/main/AGENTS.md) — main evcc daemon (Go + Vue web UI)
- [evcc-io/docs AGENTS.md](https://github.com/evcc-io/docs/blob/main/AGENTS.md) — documentation site

## Project Overview

- Native mobile app wrapper around the evcc web UI, built with [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/).
- The app is intentionally thin: a `WebView` renders the actual evcc UI served by a user's local evcc instance. Native code only handles onboarding, server discovery, server management, deep links, downloads, haptics, and online/offline detection.
- Design system: [UI Kitten](https://akveo.github.io/react-native-ui-kitten/) with `@eva-design/eva`. Custom theme tokens live in `themes.json` / `style.json`.
- Ships on App Store, Mac App Store, Google Play, F-Droid, and as a direct APK on GitHub Releases.

## Essential Commands

- `npm install` — install dependencies
- `npm run start` — Expo dev mode (interactive)
- `npm run ios` / `npm run android` / `npm run web` — start a platform target directly
- `npm run lint` — `tsc --noEmit && eslint .` (TypeScript types + ESLint)
- `npm run format` — Prettier on the whole repo
- `npm run translations` — regenerate `i18n/index.ts` from the JSON files in `i18n/` (run after adding a locale)
- `npm run test:ios` / `test:android:emulator` / `test:android:attached` — Detox e2e (requires a local `evcc --demo` on `:7070` and `caddy run` on `:7080` — see `README.md`)
- `caddy run` — reverse proxy with basic auth (`admin:secret`) on `:7080` → `:7070`, used for auth-flow tests and manual basic-auth dev

## Project Layout

Most folders are self-explanatory (`screens/`, `components/`, `utils/`, `i18n/`, `e2e/`, …). Non-obvious bits:

- `app.config.ts` — Expo config (replaces `app.json`). Bundle IDs, plugins, native permissions.
- `i18n/index.ts` — **generated**, do not edit. See [i18n](#i18n).
- `android/`, `ios/` — output of `expo prebuild`. Do not hand-edit; changes get blown away on regen. Inject native config via an Expo config plugin under `scripts/` instead.
- `scripts/detox/`, `scripts/fdroid/` — Expo config plugins (Detox wiring, F-Droid reproducibility).
- `Caddyfile` — local basic-auth proxy for dev/testing.
- `ressources/` — marketing assets. Note the misspelling, kept for history.
- `tsconfig.json` sets `baseUrl: "."`, so imports are root-relative (`import { Server } from "types"`, not `"../../types"`). Prefer this style.

## Architecture Notes

### Server state

- Users can save multiple evcc servers and switch between them. Persisted in `AsyncStorage`.
- All server reads/writes go through `AppContext`; screens use `useAppContext()` rather than touching storage directly.
- A legacy single-server schema is migrated on first load — keep that migration path working (covered by a Detox test).

### Server verification

- Before saving a server, the app checks that the response identifies as an app-compatible evcc instance. Older evcc versions report a dedicated "not yet app-compatible" error. Don't loosen this check.

### WebView bridge

- `MainScreen` hosts the `WebView` that renders the evcc UI. It injects safe-area CSS variables so the web UI respects notches, and polyfills `navigator.vibrate` to forward to native haptics.
- The web UI talks back via `window.ReactNativeWebView.postMessage(JSON.stringify({ type, ... }))`. Add new message types to the `switch` in `handleMessage`.
- Cross-origin navigations open in the system browser, not in the WebView.
- Online/offline state drives a periodic WebView remount for reconnection plus a crossfade to a loading overlay. Don't replace with hard navigations — it flickers.

### Onboarding / discovery

- mDNS discovery for evcc services on the local network. iOS requires matching `NSBonjourServices` entries in `app.config.ts`.
- Manual entry and QR code scanning are the alternatives.
- `evcc://server?url=…&title=…&username=…&password=…` deep link prefills the add-server form.

### i18n

- `i18n/index.ts` is **generated** by `scripts/load-translations.mts`. Edit per-locale JSON (`en.json`, `de.json`, …), then run `npm run translations`.
- Translations are managed via [Weblate](https://hosted.weblate.org/projects/evcc/app/) — translation PRs come in automatically. Only edit `en.json` (source) and `de.json` (maintained in-house) manually; other locales come from Weblate.
- Use `useTranslation()` / `t()` for user-facing strings. Keys are nested by screen/section (e.g. `servers.manually.checkAndSave`).

## Coding Conventions

- **TypeScript everywhere**, `strict: true`. The lint script fails on type errors, so type things properly rather than `any`-casting.
- React function components with hooks. Use `useCallback` / `useMemo` for handlers and JSX passed to children (see `MainScreen.tsx` for the established pattern).
- UI Kitten primitives (`Layout`, `Text`, `Button`, …) over raw RN components when an equivalent exists, so theming stays consistent.
- Theming is automatic light/dark via `useColorScheme()` — there is no in-app theme toggle. Don't add one.
- Product name is **"evcc"** (always lowercase, even sentence-initial), matching the docs style guide.
- Keep native code surface minimal — prefer doing things in the web UI (main evcc repo) when possible. The app's job is to host the UI and bridge the few things only native can do.
- Comments: concise, not excessive. Don't describe what the code already says. No issue/PR links by default — `git blame` covers history. Only add a link when the extra context is required to understand the code.

## Testing (Detox)

- Tests live in `e2e/*.test.ts`, Jest config in `e2e/jest.config.ts` (`maxWorkers: 1`, 60 s timeout).
- Local prerequisites:
  - `evcc --demo` running on `:7070`
  - `caddy run` on `:7080` (basic-auth wrapper for the auth tests)
- Selectors: prefer `by.id("…")` matching `testID` props you set in components (e.g. `serverFormCheckAndSave`, `@serverFormUrl/input`). For elements inside the WebView, use `byWebDataTestId` / `byWebCss` from `e2e/helper.ts`.
- The WebView is "ready" before its content has loaded — always gate WebView assertions with `waitForWebview()`.
- WebView taps can fail with "view not hittable" mid-layout; use `tapWebAfterWaitFor` / `tapAfterWaitFor` instead of bare `.tap()` for flaky-prone interactions.
- Never use fixed `sleep`s as a substitute for these helpers.
- Launch args (Detox) are read in `helper/launchArguments.ts`; add new flags there rather than scattering `process.env` checks.

## Native Builds

- `android/` and `ios/` are produced by `npx expo prebuild --platform <ios|android> --clean`. They are checked in but should be regenerated rather than hand-edited — local changes get blown away by the next prebuild. To inject native-level config, write or extend an Expo config plugin under `scripts/` and register it in `app.config.ts`.
- F-Droid is a reproducible-build target. The plugins in `scripts/fdroid/` strip non-reproducible bits (DK build IDs, dependency metadata). The README documents the exact F-Droid recipe (`npx expo prebuild` → `sed` out `signingConfig` → `./gradlew :app:assembleRelease`); keep it working.
- Bumping `version` in `package.json` should also bump `ios.buildNumber` and `android.versionCode` in `app.config.ts` (kept in sync, currently both `38`). `USER_AGENT` / `APP_VERSION` / `GITHUB_RELEASES_URL` in `utils/constants.ts` derive from `package.json#version` automatically.
- `app.config.ts` sets `NSAllowsArbitraryLoads: true` and Android `usesCleartextTraffic: true` on purpose — users run evcc on plain-HTTP local IPs. Don't tighten these without a migration plan.

## CI

`.github/workflows/ci.yaml` runs on push/PR to `main`:

- `lint` — `npm run lint`
- `fastlane-validate` — store metadata sanity-checks
- `ios-detox` — full iOS prebuild + Detox run on `depot-macos-26`
- `android-build` → `android-test` — Android prebuild, then Detox on an emulator (API 34)

Both Detox jobs install evcc + Caddy in CI before running. If you add a test that needs more services, mirror that setup in both jobs.

## Pull Request Descriptions

Structure PR descriptions in this order. No headlines. Be concise.

1. **References first line**: link related issues or PRs (`fixes #1123`, `replaces #222`, `pairs with evcc-io/evcc#345`). PRs should almost always reference an issue or related PR — only skip in rare exceptions (e.g. trivial typo fixes).
2. **Intro**: one or a few concise sentences framing what the PR does and why it was created this way. The full problem description belongs in the linked issue, not here.
3. **Bullet list**: most significant changes or user-facing implications. Lead with the most significant.
4. **TODO section** (only if open points remain):

   ```
   **TODO**
   - [ ] item a
   - [ ] item b
   ```

Avoid file paths, line numbers, or code listings reproduced from the diff. Include a code snippet only when it conveys the contract (event shape, API signature) more clearly than prose. No testing checklists, no co-author footers, no generator footers.

## Git Workflow

- Main branch: `main`
- Conventional-ish prefixes are common in history: `feat:`, `fix:`, `chore:`, `test(e2e):`, `chore(deps):`. Keep messages short.
