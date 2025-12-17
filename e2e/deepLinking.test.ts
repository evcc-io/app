import "detox";
import { expect } from "detox";
import { switchCheck, waitForWebview } from "./helper";
import { ServerManualScreen } from "./elements";

describe("Deep Linking", () => {
  it("open server", async () => {
    await device.launchApp({
      newInstance: true,
      url: "evcc://server?url=10.0.2.2:7070",
    });

    await expect(ServerManualScreen.urlInput).toHaveText("10.0.2.2:7070");
    await switchCheck(ServerManualScreen.checkboxInput, false);
    await expect(ServerManualScreen.userInput).not.toExist();
    await expect(ServerManualScreen.passwordInput).not.toExist();
    await ServerManualScreen.saveButton.tap();

    await waitForWebview();
  });

  it("open server with basic auth", async () => {
    await device.launchApp({
      newInstance: true,
      url: "evcc://server?url=http://10.0.2.2:7080&username=admin&password=secret",
    });

    await expect(ServerManualScreen.urlInput).toHaveText(
      "http://10.0.2.2:7080",
    );
    await switchCheck(ServerManualScreen.checkboxInput, true);
    await expect(ServerManualScreen.userInput).toHaveText("admin");
    await expect(ServerManualScreen.passwordInput).toHaveText("secret");
    await ServerManualScreen.saveButton.tap();

    await waitForWebview();
  });
});
