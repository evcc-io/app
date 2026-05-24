import "detox";
import { byWebCss, waitForWebview } from "./helper";

async function triggerWebviewDownload() {
  await byWebCss("body").runScript(`() => {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "download",
      url: new URL("/api/sessions?format=csv", window.location.href).toString(),
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
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7080&title=siteTitle&username=admin&password=secret",
      resetAppState: true,
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await triggerWebviewDownload();
  });
});
