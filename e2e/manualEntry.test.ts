import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";
import { ServerManualScreen, ServerScreen } from "./elements";

describe("Manual entry", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("without basic auth", async () => {
    await ServerScreen.manualEntryButton.tap();

    await ServerManualScreen.urlInput.typeText("10.0.2.2:7070");

    await expect(ServerManualScreen.userInput).not.toExist();
    await expect(ServerManualScreen.passwordInput).not.toExist();

    await ServerManualScreen.saveButton.tap();

    await waitForWebview();
  });

  it("with basic auth", async () => {
    await ServerScreen.manualEntryButton.tap();

    await ServerManualScreen.urlInput.typeText("10.0.2.2:7080");

    await expect(ServerManualScreen.userInput).not.toExist();
    await expect(ServerManualScreen.passwordInput).not.toExist();

    await ServerManualScreen.checkboxInput.tap();

    await ServerManualScreen.userInput.typeText("admin");
    await ServerManualScreen.passwordInput.typeText("secret");

    await ServerManualScreen.saveButton.tap();

    await waitForWebview();
  });
});
