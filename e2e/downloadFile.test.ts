import "detox";
import { byWebCss, waitForWebview } from "./helper";

/**
 * evcc core emits `{type: "download", url}` over the message bridge when the
 * user clicks a CSV export link; the app re-runs that fetch inside the
 * webview so its auth cookies and basic-auth credentials ride along, then
 * persists the response. Dispatch the event directly so the test exercises
 * the contract without depending on evcc's web UI. The downloadCompleted
 * marker only renders once the bytes have been stored — so a 401 (missing
 * auth) silently fails the assertion.
 */
async function triggerWebviewDownload(path = "/api/sessions?format=csv") {
  const pathJson = JSON.stringify(path);
  await byWebCss("body").runScript(`() => {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "download",
      url: new URL(${pathJson}, window.location.href).toString(),
    }));
  }`);

  await waitFor(element(by.id("downloadCompleted")))
    .toExist()
    .withTimeout(20000);
}

describe("Download file", () => {
  it("downloads a file triggered from the webview", async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070&title=Local",
      resetAppState: true,
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await triggerWebviewDownload();
  });

  it("downloads a file from a server protected with basic auth", async () => {
    // localhost:7080 is the Caddy basic-auth reverse proxy (admin/secret).
    // The in-webview fetch only completes if the webview's basicAuthCredential
    // was attached to the auth challenge, so the marker is real proof.
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7080&title=siteTitle&username=admin&password=secret",
      resetAppState: true,
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await triggerWebviewDownload();
  });

  it("downloads a file protected by an HttpOnly cookie", async () => {
    // localhost:7081 reverse-proxies evcc and sets `testauth=letmein` as an
    // HttpOnly cookie on every non-cookietest response, so the webview picks
    // it up on first load. /cookietest/file.csv returns 401 unless that
    // cookie comes back — the marker is real proof the webview's cookies
    // (which an external download manager couldn't see) followed the fetch.
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7081&title=Local%20Cookie",
      resetAppState: true,
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await triggerWebviewDownload("/cookietest/file.csv");
  });

  it("downloads via POST with a body", async () => {
    // mirrors how BackupRestoreModal triggers the backup download — the
    // event carries method=POST + body, and the in-webview fetch carries
    // both the body and the auth cookie. /cookietest/post.csv 405s on GET
    // and 401s without the cookie, so the marker is dual proof.
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7081&title=Local%20Cookie",
      resetAppState: true,
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebCss("body").runScript(`() => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "download",
        url: new URL("/cookietest/post.csv", window.location.href).toString(),
        method: "POST",
        body: { hello: "world" },
      }));
    }`);
    await waitFor(element(by.id("downloadCompleted")))
      .toExist()
      .withTimeout(20000);
  });
});
