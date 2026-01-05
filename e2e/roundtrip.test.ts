import "detox";
import { byWebDataTestId, waitForWebview } from "./helper";
import { expect } from "detox";

describe("Roundtrip", () => {
  beforeEach(async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070",
      resetAppState: true,
    });
  });

  // TODO: wait for next evcc release
  it.skip("change server", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("topnavigation-button").tap();
    await byWebDataTestId("topnavigation-app").tap();

    const url = element(by.id("@serverFormUrl/input"));
    await expect(url).toHaveText("localhost:7070");
    await url.typeText("demo.evcc.io");
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
    await expect(byWebDataTestId("header")).toHaveText("Demo Mode");
  });

  // TODO: wait for next evcc release
  it.skip("remove server", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("topnavigation-button").tap();
    await byWebDataTestId("topnavigation-app").tap();

    await element(by.id("setingsScreenRemoveServer")).tap();

    await expect(element(by.id("serverScreenTitle"))).toExist();
  });
});
