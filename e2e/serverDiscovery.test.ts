import "detox";
import { waitForWebview } from "./helper";

describe("server discovery (mdns)", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it.each([1, 2, 5])("search with %i tap(s)", async (n) => {
    for (let i = 0; i < n; i++) {
      await element(by.id("serverSearchButton")).tap();
    }

    await waitFor(element(by.id("serverSearchListItem0")))
      .toExist()
      .withTimeout(5000);
    await element(by.id("serverSearchListItem0Button")).tap();

    await waitForWebview();
  });
});
