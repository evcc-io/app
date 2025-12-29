import "detox";
import { byWebDataTestId, waitForWebview } from "./helper";
import { expect } from "detox";

describe("Download file", () => {
  beforeEach(async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070",
      resetAppState: true,
    });
  });

  // TODO: add test for android
  it(":ios: sessions file", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("topnavigation-button").tap();
    await web.element(by.web.label("Charging Sessions")).tap();
    await web.element(by.web.cssSelector("a[download]")).tap();

    await expect(system.element(by.system.label("Save to Files"))).toExist();
  });

  // TODO: add test for android
  // TODO: unskip and add assertion for file download
  it.skip("backup file", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await web.element(by.web.label("Configuration")).tap();
    await web.element(by.web.label("Backup & Restore")).tap();
    await web.element(by.web.label("Download backup...")).tap();
  });
});
