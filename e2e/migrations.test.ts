import "detox";
import { waitForWebview } from "./helper";

describe("Migrations", () => {
  it("legacy single server storage", async () => {
    await device.launchApp({
      resetAppState: true,
      launchArgs: {
        testLegacyServerConfig: true,
      },
    });

    await waitForWebview();
  });
});
