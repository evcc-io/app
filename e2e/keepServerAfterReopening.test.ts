import "detox";
import { waitForWebview, launchWithDeepLink } from "./helper";

async function testKeepingServer() {
  // bring from foreground to background to foreground
  await device.launchApp();
  await waitForWebview();

  // close completely and open a new instance
  await device.launchApp({ newInstance: true });
  await waitForWebview();
}

describe("Keep server after reopening", () => {
  it("demo server", async () => {
    await device.launchApp({ resetAppState: true });
    await element(by.id("useDemo")).tap();
    await waitForWebview();

    await testKeepingServer();
  });

  it("manual: url only", async () => {
    await launchWithDeepLink("evcc://server?url=localhost:7070&title=Local");
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await testKeepingServer();
  });

  it("manual: with basic auth", async () => {
    await launchWithDeepLink(
      "evcc://server?url=http://localhost:7080&title=Local%20Auth&username=admin&password=secret",
    );
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await testKeepingServer();
  });
});
