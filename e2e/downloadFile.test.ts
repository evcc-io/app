import "detox";
import { waitForWebview } from "./helper";
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

    await web.element(by.web.id("topNavigatonDropdown")).tap();
    await web.element(by.web.id("topNavigatonDropdown")).tap();
    await web.element(by.web.id("topNavigationSessions")).tap();
    await web.element(by.web.id("sessionsDownload")).tap();

    // works only on ios
    await expect(system.element(by.system.label("Save to Files"))).toExist();
  });

  // TODO: add test for android
  // TODO: unskip and assert file download
  it.skip("backup file", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await web.element(by.web.id("topNavigatonDropdown")).tap();
    await web.element(by.web.id("backupRestoreButton")).tap();
    await web.element(by.web.id("backuprestoreDownloadButton")).tap();
  });
});
