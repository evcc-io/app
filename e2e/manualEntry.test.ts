import "detox";
import { expect } from "detox";
import { tapAfterScrollTo, tapAfterWaitFor, waitForWebview } from "./helper";

describe("Manual entry", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it("url only", async () => {
    await element(by.id("manualEntry")).tap();

    // replaceText, not typeText: the CI emulator's IME suggestions mangle typed input
    await element(by.id("@serverFormTitle/input")).replaceText("Local");
    await element(by.id("@serverFormUrl/input")).replaceText("localhost:7070");

    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });

  it("with basic auth", async () => {
    await element(by.id("manualEntry")).tap();

    await element(by.id("@serverFormTitle/input")).replaceText("Local Auth");
    await element(by.id("@serverFormUrl/input")).replaceText("localhost:7080");

    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await tapAfterWaitFor(element(by.id("serverFormAuth")));

    await element(by.id("@serverFormAuthUser/input")).replaceText("admin");
    await element(by.id("@serverFormAuthPassword/input")).replaceText("secret");

    await tapAfterScrollTo(element(by.id("serverFormCheckAndSave")));

    await waitForWebview();
  });
});
