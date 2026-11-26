import "detox";
import {
  byWebDataTestId,
  tapAfterWaitFor,
  tapWebAfterWaitFor,
  waitForWebview,
} from "./helper";

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

  it("keeps a widget link on its original server after deleting an earlier server", async () => {
    await device.launchApp({
      resetAppState: true,
      launchArgs: { testIndexedServerConfig: true },
    });
    await waitForWebview();
    await tapWebAfterWaitFor(byWebDataTestId("tab-more"));
    await tapWebAfterWaitFor(byWebDataTestId("tab-more-app"));
    await tapAfterWaitFor(element(by.id("editServer0Icon")));
    await element(by.id("setingsScreenRemoveServer")).tap();
    await element(by.text("Remove")).tap();
    await tapAfterWaitFor(element(by.id("selectServer1")));
    const authError = element(by.id("connectionProblem-auth"));
    await waitFor(authError).toExist().withTimeout(20000);

    // Server "1" is now at position 0 and connects without credentials.
    await device.openURL({ url: "evcc://loadpoint?serverId=1&lp=1" });
    await waitForWebview();

    // Old positional links still select by the current list position.
    await device.openURL({ url: "evcc://loadpoint?server=1&lp=1" });
    await waitFor(authError).toExist().withTimeout(20000);
  });
});
