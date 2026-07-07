# Auth proxy support — research & plan

Working notes for [#100](https://github.com/evcc-io/app/issues/100) (Cloudflare Access / custom headers) and [#35](https://github.com/evcc-io/app/issues/35) (reverse proxy with SSO login). Status: **parked, no approach fully compelling yet**. Research done 2026-07-06/07 (deep-research run, claims adversarially verified against primary sources).

## Verified: custom headers on every request are impossible

Do not reattempt PR #105-style solutions. Hard platform facts (current as of react-native-webview v15, androidx.webkit 1.15):

- `source={{ headers }}` applies to the **first document load only** (documented in react-native-webview Guide.md). The re-render workarounds cover top-level navigations only — never assets, XHR/fetch, or WebSocket.
- react-native-webview has **no request interception API** and none planned: PR #181 died on token-leak objections (2019–2020), issue #3783 (expose `shouldInterceptRequest`) stale-closed 2025 with zero maintainer engagement.
- Android `shouldInterceptRequest` cannot read POST bodies (Google issuetracker #119844519, open since 2018) and never sees WebSocket upgrades.
- iOS WKWebView has no subresource interception at all. iOS 17 `proxyConfigurations` is a CONNECT tunnel — sees only TLS bytes, useless for header injection.
- **The browser WebSocket API cannot set custom headers, period** (whatwg/websockets#16, open since 2017). evcc's UI lives on a WebSocket → this alone kills every header-based design, even perfect fetch/XHR monkeypatching.
- Immich is not a precedent: Flutter app with native UI, headers go on its own HTTP client. No webview involved.
- Home Assistant companion apps confirm: no custom-header support either (iOS #439 closed unimplemented, Android #2650 closed with workarounds only — mTLS, path exclusions, community cookie scripting).

Consequence: any solution must be **cookie-based** — a session cookie in the WebView cookie store rides all traffic automatically, including the WebSocket upgrade.

## Approach 1: Cloudflare Access service token → cookie (IMPLEMENTED, uncommitted)

A request carrying valid `CF-Access-Client-Id`/`CF-Access-Client-Secret` headers makes Access mint a `CF_Authorization` session cookie ([CF docs](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)). So: send the header pair on the WebView's **first document load** (the one place headers work) and on all native requests; the minted cookie carries everything else. Cookie expiry → WS dies → existing offline-remount loop re-sends headers → fresh cookie. Home Assistant community scripts this exact exchange in production (HA-Cloudflare-Access-Recovery).

Implementation (in working tree, lint-clean, Caddy emulation curl-verified):

- `types.ts` — `Server.serviceToken { clientId, clientSecret, required }`
- `utils/server.ts` — `serviceTokenHeaders()`; verification sends token + `X-Requested-With: XMLHttpRequest` (forces 401/403 instead of login-redirect HTML); 403 mapped to auth error
- `MainScreen.tsx` — headers on `source` first load + downloads
- `ServerForm.tsx` — checkbox + Client ID/Secret inputs; deep link/QR params `serviceTokenId`/`serviceTokenSecret`
- Widgets: token synced via App Group, `ApiClient.swift` sends headers (stateless — widgets never depend on cookie state)
- e2e: Caddyfile `:7082` emulates Access (valid header pair mints `CF_Authorization`, cookie-only requests pass, else 403); `e2e/serviceToken.test.ts`; port reversed in `.detoxrc.js`

Setup requirements (docs-critical):

- Access application needs **≥1 Allow-action policy including the service token**. Service-Auth-only policies never mint the cookie → broken. Expected #1 support issue.
- Session duration: default 24 h, max 1 month. Binding Cookie setting must stay off.
- Service tokens themselves expire (default 1 year) → manual rotation.

Limits: Cloudflare-only. Doesn't help oauth2-proxy/Authentik/Authelia (#35). Generic "custom header" framing must be avoided — stateless header-checking proxies can't work (see above).

Open item: 30-min hands-on spike against a real CF Access instance to confirm Android `loadUrl(url, headers)` first-load behavior on current RN-webview.

## Approach 2: interactive login sheet + shared cookie jar (DESIGN ONLY)

Covers #35 (oauth2-proxy, Authentik, Authelia, CF interactive login). All these layers end their login flow with a first-party HttpOnly `Set-Cookie` on the evcc hostname.

Design:

1. Detection: server verification hits a redirect/login page instead of evcc → offer "Log in".
2. Bottom-sheet browser = second `react-native-webview`. **No cookie harvest/reinject needed for the main WebView** — iOS WKWebViews share the default `WKWebsiteDataStore` per app, Android `CookieManager` is process-global. Cookie lands in the shared jar during login; remount main WebView after.
3. The sheet must allow cross-origin navigation (IdP domains) — unlike the main WebView, which opens cross-origin in the system browser.
4. Success detection: poll `${url}/api/state` natively until evcc JSON. Native fetch must attach cookies from `CookieManager.get()` on iOS (RN fetch doesn't share the WKWebView jar there; Android does automatically). More robust than watching for known cookie names.
5. Expiry: main WebView silently shows a login page → looks like "offline" forever. Detect (off-origin redirect in `onShouldStartLoadWithRequest`, or failed probe) → re-prompt login sheet.
6. Widgets: separate process, no cookie store access. Export **all cookies for the host** (not an allowlist — oauth2-proxy chunks sessions into `_oauth2_proxy_0…N`, Authentik uses per-provider names) to the App Group, preferably shared Keychain (bearer credential). Re-sync on app foreground. HttpOnly readable natively — download path (PR #153) proves it.

Known blockers:

- **Google as IdP blocks embedded webviews** (`Error 403: disallowed_useragent`, longstanding policy; Microsoft sometimes similar). Self-hosted login UIs (Authentik/Authelia/Keycloak forms, passcode/TOTP, CF email-OTP) work fine. CF+Google users → use approach 1 instead.
- Third-party cookie behavior during the IdP redirect dance (e.g. `<team>.cloudflareaccess.com`) needs a WKWebView spike; final cookie is first-party, so exposure is limited.
- Widget copies go stale under sliding refresh (oauth2-proxy `cookie-refresh`).

Session cookie lifetimes (verified against docs):

| Layer | Cookie | Default | Notes |
|---|---|---|---|
| Cloudflare Access | `CF_Authorization` | 24 h | configurable 15 min–1 month |
| oauth2-proxy | `_oauth2_proxy[_N]` | 7 days, persistent | `cookie-expire=0` → browser-session; optional sliding refresh |
| Authelia | `authelia_session` | 1 h, 5 min inactivity kill | remember-me → 1 month |
| Authentik | per-provider | **browser-close** | unusable default for this feature; users must configure a duration + remember-me |

Widget-reuse viability: good for CF/oauth2-proxy, poor for Authelia/Authentik defaults.

## Decision matrix

| | Approach 1 (service token) | Approach 2 (login sheet) |
|---|---|---|
| Covers | Cloudflare Access only | CF interactive, oauth2-proxy, Authentik, Authelia, … |
| Login UX | none (paste credentials once) | real login incl. 2FA, repeated on expiry |
| Google IdP | ✅ (bypasses IdP) | ❌ blocked in webview |
| Widgets | ✅ stateless | ⚠️ cookie export, staleness, short lifetimes |
| Effort | done (uncommitted) | medium (sheet, detection, probe, widget sync, expiry UX) |
| Server-side asks | Allow policy + token rotation | sane session durations |

They compose: 1 is the reliable/stateless path for CF, 2 is the general path. Neither blocks the other.

## Rejected alternatives

- Any header injection scheme (see verified facts above).
- mTLS client certs: react-native-webview support broken/unreliable (issue #3574), Cloudflare mTLS possible but heavy UX.
- Cloudflare WARP client on the phone: works, zero code, but per-device setup outside the app — documentation answer, not a feature.
- Access bypass policies / unprotected `auth/authorize` paths: security downgrade, HA community uses it as last resort.

## Full sources

Deep-research run 2026-07-06 (104 agents, 3-vote adversarial verification): key sources — react-native-webview Guide.md + PR #181 + issue #3783, whatwg/websockets#16, Google issuetracker #119844519, CF service-token & authorization-cookie & session-management docs, oauth2-proxy config docs, Authelia session docs, Authentik user-login stage docs, HA iOS #439 / Android #2650.
