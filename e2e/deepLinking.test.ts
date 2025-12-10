import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("Deep Linking", () => {
  it("open server", async () => {
    await device.launchApp({
      newInstance: true,
      url: "evcc://server?url=http://evcc.local",
    });

    await expect(element(by.id("serverFormUrl"))).toHaveText(
      "http://evcc.local",
    );
    await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(false);
    await expect(element(by.id("serverFormAuthUser"))).toHaveText("");
    await expect(element(by.id("serverFormAuthPassword"))).toHaveText("");
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });

  it("open server with basic auth", async () => {
    await device.launchApp({
      newInstance: true,
      url: "evcc://server?url=https://localhost:7080&username=admin&password=secret",
    });

    await expect(element(by.id("serverFormUrl"))).toHaveText(
      "http://localhost:7080",
    );
    await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(true);
    await expect(element(by.id("serverFormAuthUser"))).toHaveText("admin");
    await expect(element(by.id("serverFormAuthPassword"))).toHaveText("secret");
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
  });
});
