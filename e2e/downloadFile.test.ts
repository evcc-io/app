import "detox";
import { byWebCss, waitForWebview } from "./helper";

/**
 * evcc core emits `{type: "download", url, headers}` over the message bridge
 * when the user triggers an export; the app downloads natively, attaching
 * the webview's cookies and basic auth. Dispatch the event directly so the
 * test exercises the contract without depending on evcc's web UI. The
 * downloadCompleted marker renders the stored filename — so a 401 (missing
 * auth) fails the assertion.
 */
async function triggerWebviewDownload(
  path = "/api/sessions?format=csv",
  expectedFilename?: string,
) {
  const pathJson = JSON.stringify(path);
  await byWebCss("body").runScript(`() => {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "download",
      url: new URL(${pathJson}, window.location.href).toString(),
    }));
  }`);

  const marker = waitFor(element(by.id("downloadCompleted")));
  if (expectedFilename) {
    await marker.toHaveText(expectedFilename).withTimeout(20000);
  } else {
    await marker.toExist().withTimeout(20000);
  }
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
    // Completes only if the stored credentials were attached to the request.
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
    // HttpOnly cookie the webview picks up on first load. /cookietest/file.csv
    // 401s without it — proof the cookie was extracted from the webview's
    // cookie store and attached to the native download.
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7081&title=Local%20Cookie",
      resetAppState: true,
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await triggerWebviewDownload("/cookietest/file.csv", "file.csv");
  });
});
