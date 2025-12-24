import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";
import { getHostIp } from "helper/launchArguments";

describe("Deep Linking", () => {
  it("open server", async () => {
    await device.launchApp({
      url: `evcc://server?url=${getHostIp()}:7070`,
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      `${getHostIp()}:7070`,
    );

    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(false);
    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });

  it("open server with basic auth", async () => {
    await device.launchApp({
      url: `evcc://server?url=http://${getHostIp()}:7080&username=admin&password=secret`,
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      `http://${getHostIp()}:7080`,
    );

    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(true);
    await expect(element(by.id("@serverFormAuthUser/input"))).toHaveText(
      "admin",
    );
    await expect(element(by.id("@serverFormAuthPassword/input"))).toHaveText(
      "secret",
    );
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });
});
