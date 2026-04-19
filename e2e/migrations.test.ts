import "detox";
import { waitForWebview } from "./helper";

describe("Migrations", () => {
  it("legacy single connection storage", async () => {
    await device.launchApp({
      resetAppState: true,
      launchArgs: {
        migrateFromLegacySingleConnectionStorage: true,
      },
    });

    await waitForWebview();
  });
});
