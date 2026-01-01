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

  // TODO: add id topnavigation-app
  it.skip("change server", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("topnavigation-app").tap();

    const url = element(by.id("@serverFormUrl/input"));
    await expect(url).toHaveText("localhost:7070");
    await url.typeText("demo.evcc.io");

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  // TODO: add id topnavigation-app
  it.skip("remove server", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("topnavigation-app").tap();
    await element(by.id("setingsScreenRemoveServer")).tap();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });
});
