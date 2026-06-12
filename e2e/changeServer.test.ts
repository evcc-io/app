import "detox";
import {
  byWebCss,
  byWebDataTestId,
  tapAfterWaitFor,
  waitForWebview,
} from "./helper";
import { expect } from "detox";

describe("Change Server", () => {
  beforeEach(async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070&title=Local",
      resetAppState: true,
    });
  });

  it("one server: add and remove", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("tab-more").tap();
    await byWebDataTestId("tab-more-app").tap();

    await tapAfterWaitFor(element(by.id("editServer0Icon")));
    await element(by.id("setingsScreenRemoveServer")).tap();

    await expect(element(by.id("serverScreenTitle"))).toExist();
  });

  it("one server: change server url", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
    await expect(byWebDataTestId("header")).toHaveText("");
    await byWebDataTestId("tab-more").tap();
    await byWebDataTestId("tab-more-app").tap();

    await tapAfterWaitFor(element(by.id("editServer0Icon")));

    const url = element(by.id("@serverFormUrl/input"));
    await url.clearText();
    await url.typeText("demo.evcc.io");
    await element(by.id("serverFormCheckAndSave")).tap();

    await tapAfterWaitFor(element(by.id("selectServer0")));

    await waitForWebview();
    await expect(byWebCss("[data-testid=header] h1")).toHaveText("DEMO MODE");
  });

  it("two servers: remove active server", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    await byWebDataTestId("tab-more").tap();
    await byWebDataTestId("tab-more-app").tap();
    await element(by.id("addServerIcon")).tap();
    await element(by.id("@serverFormTitle/input")).typeText("Demo");
    await element(by.id("@serverFormUrl/input")).typeText("demo.evcc.io");
    await element(by.id("serverFormCheckAndSave")).tap();

    // remove active server (server0 = local); first remaining (demo) is auto-activated
    await tapAfterWaitFor(element(by.id("editServer0Icon")));
    await element(by.id("setingsScreenRemoveServer")).tap();

    // close switch modal by tapping the now-only server, then verify demo is active
    await tapAfterWaitFor(element(by.id("selectServer0")));
    await waitForWebview();
    await expect(byWebCss("[data-testid=header] h1")).toHaveText("DEMO MODE");
  });
});
