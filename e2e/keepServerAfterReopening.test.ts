import "detox";
import { waitForWebview } from "./helper";

async function testKeepingServer() {
  // bring from foreground to background to foreground
  await device.launchApp();
  await waitForWebview();

  // close completely and open a new instance
  await device.launchApp({ newInstance: true });
  await waitForWebview();
}

describe("Keep server after reopening", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it("demo server (using demo.evcc.io)", async () => {
    await element(by.id("useDemo")).tap();
    await waitForWebview();

    await testKeepingServer();
  });

  it("manual: url only (using localhost)", async () => {
    await element(by.id("manualEntry")).tap();
    await element(by.id("@serverFormUrl/input")).typeText("localhost:7070");
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await testKeepingServer();
  });

  it("manual: url only (using evcc.local)", async () => {
    await element(by.id("manualEntry")).tap();
    await element(by.id("@serverFormUrl/input")).typeText("evcc.local:7070");
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await testKeepingServer();
  });

  it("manual: with basic auth (using localhost)", async () => {
    await element(by.id("manualEntry")).tap();
    await element(by.id("@serverFormUrl/input")).typeText("localhost:7080");
    await element(by.id("serverFormAuth")).tap();
    await element(by.id("@serverFormAuthUser/input")).typeText("admin");
    await element(by.id("@serverFormAuthPassword/input")).typeText("secret");
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await testKeepingServer();
  });
});
