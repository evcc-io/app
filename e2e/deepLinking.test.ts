import "detox";
import { expect } from "detox";
import { switchCheck, waitForWebview } from "./helper";

describe("Deep Linking", () => {
  it("open server", async () => {
    await device.launchApp({
      newInstance: true,
      url: "evcc://server?url=localhost:7070",
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "localhost:7070",
    );

    await switchCheck(element(by.id("serverFormAuth")), false);
    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });

  it("open server with basic auth", async () => {
    await device.launchApp({
      newInstance: true,
      url: "evcc://server?url=https://localhost:7080&username=admin&password=secret",
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "https://localhost:7080",
    );

    await switchCheck(element(by.id("serverFormAuth")), true);
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
