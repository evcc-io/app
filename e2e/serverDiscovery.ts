import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("server discovery (mdns)", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("search", async () => {
    await element(by.id("serverSearchButton")).tap();
    await expect(element(by.id("serverSearchList"))).toHaveText("");

    await waitForWebview();
  });
});
