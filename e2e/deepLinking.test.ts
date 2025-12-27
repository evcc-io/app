import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("Deep Linking", () => {
  it("open server (using localhost)", async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "localhost:7070",
    );
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(false);
    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("open server (using evcc.local)", async () => {
    await device.launchApp({
      url: "evcc://server?url=evcc.local:7070",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "evcc.local:7070",
    );
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(false);
    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("open server with basic auth (using localhost)", async () => {
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7080&username=admin&password=secret",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "http://localhost:7080",
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
