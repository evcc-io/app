import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";
import { ServerScreen } from "./elements";

describe("server discovery (mdns)", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("search", async () => {
    await ServerScreen.serverSearchButton.tap();
    await expect(ServerScreen.serverSearchItem(0)).toExist();

    const button = ServerScreen.serverSearchItemButton(0);
    await expect(button).toExist();
    await button.tap();

    await waitForWebview();
  });
});
