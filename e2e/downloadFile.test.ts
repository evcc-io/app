import "detox";
import { byWebCss, waitForWebview } from "./helper";

describe("Download file", () => {
  beforeEach(async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070&title=Local",
      resetAppState: true,
    });
  });

  it("downloads a file triggered from the webview", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    // evcc exposes CSV exports as `<a download>` links; the app intercepts
    // those clicks and downloads the file natively. Add and click one directly
    // so the test exercises that path without depending on evcc's web UI.
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
  });
});
