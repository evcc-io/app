import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("server discovery (mdns)", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("search", async () => {
    await element(by.id("serverSearchButton")).tap();
    await expect(element(by.id("serverSearchListItem0"))).toExist();

    const button = element(by.id("serverSearchListItem0Button"));
    await expect(button).toExist();
    await button.tap();

    await waitForWebview();
  });
});
