import "detox";
import {
  byWebCss,
  byWebDataTestId,
  tapAfterWaitFor,
  tapWebAfterWaitFor,
  waitForWebview,
} from "./helper";
import { expect } from "detox";

describe("Add Server", () => {
  beforeEach(async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070&title=Local",
      resetAppState: true,
    });
  });

  it("two servers: add and switch", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
    await expect(byWebDataTestId("header")).toHaveText("");

    await tapWebAfterWaitFor(byWebDataTestId("tab-more"));
    await tapWebAfterWaitFor(byWebDataTestId("tab-more-app"));
    await tapAfterWaitFor(element(by.id("addServerIcon")));
    await element(by.id("@serverFormTitle/input")).typeText("Demo");
    await element(by.id("@serverFormUrl/input")).typeText("demo.evcc.io");
    await tapAfterWaitFor(element(by.id("serverFormCheckAndSave")));

    await tapAfterWaitFor(element(by.id("selectServer1")));
    await waitForWebview();
    await expect(byWebCss("[data-testid=header] h1")).toHaveText("DEMO MODE");
  });

  it("three servers: use add button", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
    await tapWebAfterWaitFor(byWebDataTestId("tab-more"));
    await tapWebAfterWaitFor(byWebDataTestId("tab-more-app"));

    // without basic auth
    await tapAfterWaitFor(element(by.id("addServerIcon")));

    await element(by.id("@serverFormTitle/input")).typeText("Demo");
    await element(by.id("@serverFormUrl/input")).typeText("demo.evcc.io");
    await tapAfterWaitFor(element(by.id("serverFormCheckAndSave")));

    await tapAfterWaitFor(element(by.id("selectServer1")));

    await waitForWebview();
    await tapWebAfterWaitFor(byWebDataTestId("tab-more"));
    await tapWebAfterWaitFor(byWebDataTestId("tab-more-app"));

    // with basic auth
    await tapAfterWaitFor(element(by.id("addServerIcon")));

    await element(by.id("@serverFormTitle/input")).typeText("Local Auth");
    await element(by.id("@serverFormUrl/input")).typeText("localhost:7080");

    await tapAfterWaitFor(element(by.id("serverFormAuth")));
    await element(by.id("@serverFormAuthUser/input")).typeText("admin");
    await element(by.id("@serverFormAuthPassword/input")).typeText("secret");

    await tapAfterWaitFor(element(by.id("serverFormCheckAndSave")));

    // verify the 3rd server was added
    await waitFor(element(by.id("server2")))
      .toExist()
      .withTimeout(20000);
  });
});
