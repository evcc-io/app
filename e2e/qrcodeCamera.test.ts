import "detox";
import { byWebDataTestId, waitForWebview } from "./helper";
import { expect } from "detox";

async function expectServerForm() {
  await expect(element(by.id("@serverFormTitle/input"))).toHaveText(
    "Local Auth",
  );
  await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
    "http://localhost:7080",
  );
  await expect(element(by.id("@serverFormAuthUser/input"))).toHaveText("admin");
  await expect(element(by.id("@serverFormAuthPassword/input"))).toHaveText(
    "secret",
  );
}

describe("QRCode", () => {
  it("onboarding: open and close", async () => {
    await device.launchApp({ resetAppState: true });

    await element(by.id("manualEntry")).tap();
    await element(by.id("scanQrcodeButtonAddserverform")).tap();
    await element(by.id("headerCloseIconCamera")).tap();
    await element(by.id("headerCloseIcon")).tap();
    await expect(element(by.id("serverScreenTitle"))).toExist();
  });

  it("onboarding: add server by qrcode button", async () => {
    await device.launchApp({ resetAppState: true });

    await element(by.id("manualEntry")).tap();
    await element(by.id("scanQrcodeButtonAddserverform")).tap();
    await element(by.id("testQrCodeDetected")).tap();

    await expectServerForm();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("onboarding: add server by serverform button", async () => {
    await device.launchApp({ resetAppState: true });

    await element(by.id("scanQrcodeButtonOnboarding")).tap();
    await element(by.id("testQrCodeDetected")).tap();

    await expectServerForm();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("switchserver: open and close", async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070&title=siteTitle",
      resetAppState: true,
    });

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("tab-more").tap();
    await byWebDataTestId("tab-more-app").tap();

    await element(by.id("addServerIcon")).tap();
    await element(by.id("scanQrcodeButtonAddserverform")).tap();
    await element(by.id("headerCloseIconCamera")).tap();
    await element(by.id("headerBackIcon")).tap();

    await waitFor(element(by.id("server0")))
      .toExist()
      .withTimeout(20000);
    await expect(element(by.id("server1"))).not.toExist();
  });

  it("switchserver: add server by serverform button", async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070&title=siteTitle",
      resetAppState: true,
    });

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("tab-more").tap();
    await byWebDataTestId("tab-more-app").tap();

    await element(by.id("addServerIcon")).tap();
    await element(by.id("scanQrcodeButtonAddserverform")).tap();
    await element(by.id("testQrCodeDetected")).tap();

    await expectServerForm();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitFor(element(by.id("server1")))
      .toExist()
      .withTimeout(20000);
  });
});
