import "detox";
import { waitForWebview } from "./helper";

describe("server discovery (mdns)", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it("search and connect", async () => {
    await element(by.id("serverSearchButton")).tap();

    // fullscreen search shows the found instance with a connect CTA
    await waitFor(element(by.id("searchConnect")))
      .toExist()
      .withTimeout(10000);
    await element(by.id("searchConnect")).tap();

    await waitForWebview();
  });

  // no cancel test: discovery can resolve instantly (instance on the local
  // network), racing the Searching screen away before the tap lands
});
