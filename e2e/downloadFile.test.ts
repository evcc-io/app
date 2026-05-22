import "detox";
import { byWebCss, waitForWebview } from "./helper";

/**
 * evcc exposes CSV exports as `<a download>` links; the app intercepts those
 * clicks and downloads the file natively. Add and click one directly so the
 * test exercises that path without depending on evcc's web UI. The download
 * fails (no marker appears) unless the file is fetched successfully, so on a
 * basic-auth server this also proves the credentials are forwarded.
 */
async function triggerWebviewDownload() {
  await byWebCss("body").runScript(`(body) => {
    var link = document.createElement("a");
    link.href = "/api/sessions?format=csv";
    link.setAttribute("download", "sessions.csv");
    link.textContent = "download";
    body.appendChild(link);
    link.click();
  }`);

  // MainScreen renders this marker once shareFileFromUrl has stored a file
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
    // File.downloadFileAsync rejects on a 401, so the marker only appears if
    // the Authorization header was attached to the download request.
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7080&title=Local%20Auth&username=admin&password=secret",
      resetAppState: true,
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await triggerWebviewDownload();
  });
});
