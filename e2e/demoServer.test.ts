import "detox";
import { byWebDataTestId, waitForWebview } from "./helper";
import { expect } from "detox";

describe("Demo server", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it("open demo server", async () => {
    await element(by.id("useDemo")).tap();
    await waitForWebview();
    await expect(byWebDataTestId("header")).toHaveText("DEMO MODE");
  });
});
