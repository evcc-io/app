import "detox";
import { expect } from "detox";
import { tapAfterWaitFor, waitForWebview } from "./helper";

describe("Manual entry", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it("url only", async () => {
    await element(by.id("manualEntry")).tap();

    // replaceText, not typeText: the CI emulator's IME suggestions mangle typed input
    await element(by.id("serverFormTitle")).replaceText("Local");
    await element(by.id("serverFormUrl")).replaceText("localhost:7070");

    await expect(element(by.id("serverFormAuthUser"))).not.toExist();
    await expect(element(by.id("serverFormAuthPassword"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });

  it("with basic auth", async () => {
    await element(by.id("manualEntry")).tap();

    await element(by.id("serverFormTitle")).replaceText("Local Auth");
    await element(by.id("serverFormUrl")).replaceText("localhost:7080");

    await expect(element(by.id("serverFormAuthUser"))).not.toExist();
    await expect(element(by.id("serverFormAuthPassword"))).not.toExist();

    // the server asks for a login, so the form reveals the fields
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitFor(element(by.id("serverFormAuthUser")))
      .toExist()
      .withTimeout(10000);

    await element(by.id("serverFormAuthUser")).replaceText("admin");
    await element(by.id("serverFormAuthPassword")).replaceText("secret");

    await tapAfterWaitFor(element(by.id("serverFormCheckAndSave")));

    await waitForWebview();
  });
});
