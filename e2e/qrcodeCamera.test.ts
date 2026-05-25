import "detox";
import { waitForWebview } from "./helper";
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

describe("QRCode (onboarding)", () => {
  it("open and close", async () => {
    await device.launchApp({ resetAppState: true });

    await element(by.id("manualEntry")).tap();
    await element(by.id("scanQrcodeButtonAddserverform")).tap();
    await element(by.id("headerCloseIconCamera")).tap();
    await element(by.id("headerCloseIcon")).tap();
    await expect(element(by.id("serverScreenTitle"))).toExist();
  });

  it("add server by qrcode button", async () => {
    await device.launchApp({ resetAppState: true });

    await element(by.id("manualEntry")).tap();
    await element(by.id("scanQrcodeButtonAddserverform")).tap();
    await element(by.id("testQrCodeDetected")).tap();

    await expectServerForm();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("add server by serverform button", async () => {
    await device.launchApp({ resetAppState: true });

    await element(by.id("scanQrcodeButtonOnboarding")).tap();
    await element(by.id("testQrCodeDetected")).tap();

    await expectServerForm();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });
});
