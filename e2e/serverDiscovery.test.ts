import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("server discovery (mdns)", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it.each([1, 2, 5])("search", async (n) => {
    for (let i = 0; i < n; i++) {
      await element(by.id("serverSearchButton")).tap();
    }

    await expect(element(by.id("serverSearchListItem0"))).toExist();
    await element(by.id("serverSearchListItem0Button")).tap();

    await waitForWebview();
  });
});
