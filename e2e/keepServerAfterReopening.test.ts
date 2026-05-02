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

  it("demo server", async () => {
    await element(by.id("useDemo")).tap();
    await waitForWebview();

    await testKeepingServer();
  });

  it("manual: url only", async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070",
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await testKeepingServer();
  });

  it("manual: with basic auth", async () => {
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7080&username=admin&password=secret",
      resetAppState: true,
    });
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await testKeepingServer();
  });
});
