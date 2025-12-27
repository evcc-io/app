import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("Manual entry", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it("url only (using localhost)", async () => {
    await element(by.id("manualEntry")).tap();

    const formUrl = element(by.id("@serverFormUrl/input"));
    await formUrl.typeText("localhost:7070");

    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();
    await expect(formUrl).toHaveText("http://localhost:7070/");

    await waitForWebview();
  });

  it("url only (using evcc.local)", async () => {
    await element(by.id("manualEntry")).tap();

    const formUrl = element(by.id("@serverFormUrl/input"));
    await formUrl.typeText("evcc.local:7070");

    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();
    await expect(formUrl).toHaveText("http://evcc.local:7070/");

    await waitForWebview();
  });

  it("with basic auth (using localhost)", async () => {
    await element(by.id("manualEntry")).tap();

    const formUrl = element(by.id("@serverFormUrl/input"));
    await formUrl.typeText("localhost:7080");

    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormAuth")).tap();

    await element(by.id("@serverFormAuthUser/input")).typeText("admin");
    await element(by.id("@serverFormAuthPassword/input")).typeText("secret");

    await element(by.id("serverFormCheckAndSave")).tap();
    await expect(formUrl).toHaveText("http://localhost:7080/");

    await waitForWebview();
  });
});
