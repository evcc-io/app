import "detox";
import { byWebDataTestId, waitForWebview } from "./helper";

describe("Download file", () => {
  beforeEach(async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070",
      resetAppState: true,
    });
  });

  // TODO: add assertion for file download
  it.skip("sessions file", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("topnavigation-button").tap();
    await byWebDataTestId("topnavigation-sessions").tap();
    await byWebDataTestId("sessions-download").tap();
  });

  // TODO: add assertion for file download
  it.skip("backup file", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("topnavigation-button").tap();
    await byWebDataTestId("topnavigation-config").tap();
    await byWebDataTestId("backup-restore").tap();
    await byWebDataTestId("backup-restore-open-confirm-modal").tap();
  });
});
