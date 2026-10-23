import "detox";
import { byWebDataTestId, tapWebAfterWaitFor, waitForWebview } from "./helper";

/**
 * localhost:7090 is a Caddy stand-in for an auth proxy (oauth2-proxy,
 * Authentik, …): without a session cookie it redirects to a fake identity
 * provider on localhost:7091 — a different origin, like a real SSO login.
 * Logging in there sets the cookie and bounces back to evcc.
 */
describe("External auth", () => {
  it("logs in through the proxy inside the webview", async () => {
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7090&title=Proxy",
      resetAppState: true,
    });

    await element(by.id("serverFormExternalAuth")).tap();
    await element(by.id("serverFormCheckAndSave")).tap();

    // login page from the other origin rendered in the webview, not the browser
    await tapWebAfterWaitFor(byWebDataTestId("fakeLogin"));

    await waitForWebview();
  });
});
