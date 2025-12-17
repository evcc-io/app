import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("Deep Linking", () => {
  it("open server", async () => {
    await device.launchApp({
      url: "evcc://server?url=10.0.2.2:7070",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "10.0.2.2:7070",
    );

    await expect(element(by.id("serverFormAuth"))).toHaveValue(0);
    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });

  it("open server with basic auth", async () => {
    await device.launchApp({
      url: "evcc://server?url=http://10.0.2.2:7080&username=admin&password=secret",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "http://10.0.2.2:7080",
    );

    await expect(element(by.id("serverFormAuth"))).toHaveValue(1);
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
