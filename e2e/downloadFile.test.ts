import "detox";
import { byWebTestId, waitForWebview } from "./helper";
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

    await byWebTestId("topNavigatonDropdown").tap();
    await byWebTestId("topNavigatonDropdown").tap();
    await byWebTestId("topNavigationSessions").tap();
    await byWebTestId("sessionsDownload").tap();

    // works only on ios
    await expect(system.element(by.system.label("Save to Files"))).toExist();
  });

  // TODO: add test for android
  // TODO: unskip and assert file download
  it.skip("backup file", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebTestId("topNavigatonDropdown").tap();
    await byWebTestId("backupRestoreButton").tap();
    await byWebTestId("backuprestoreDownloadButton").tap();
  });
});
