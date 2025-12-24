import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("Manual entry", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it("url only", async () => {
    await element(by.id("manualEntry")).tap();

    await element(by.id("@serverFormUrl/input")).typeText("10.0.2.2:7070");

    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });

  it("with basic auth", async () => {
    await element(by.id("manualEntry")).tap();

    await element(by.id("@serverFormUrl/input")).typeText("10.0.2.2:7080");

    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormAuth")).tap();

    await element(by.id("@serverFormAuthUser/input")).typeText("admin");
    await element(by.id("@serverFormAuthPassword/input")).typeText("secret");

    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });
});
