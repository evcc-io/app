import "detox";
import {
  byWebCss,
  byWebDataTestId,
  tapAfterWaitFor,
  tapWebAfterWaitFor,
  waitForWebview,
} from "./helper";
import { expect } from "detox";

// Adding-a-server scenarios — split out of changeServer.test.ts to even out
// per-suite wall-clock when Detox runs tests across parallel sim workers.
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

    await byWebDataTestId("tab-more").tap();
    await byWebDataTestId("tab-more-app").tap();
    await element(by.id("addServerIcon")).tap();
    await element(by.id("@serverFormTitle/input")).typeText("Demo");
    await element(by.id("@serverFormUrl/input")).typeText("demo.evcc.io");
    await element(by.id("serverFormCheckAndSave")).tap();

    await tapAfterWaitFor(element(by.id("server1")));
    await waitForWebview();
    await expect(byWebCss("[data-testid=header] h1")).toHaveText("DEMO MODE");
  });

  it("three servers: use add button", async () => {
    await element(by.id("serverFormCheckAndSave")).tap();

    await waitForWebview();
    await byWebDataTestId("tab-more").tap();
    await byWebDataTestId("tab-more-app").tap();

    // without basic auth
    await element(by.id("addServerIcon")).tap();

    await element(by.id("@serverFormTitle/input")).typeText("Demo");
    await element(by.id("@serverFormUrl/input")).typeText("demo.evcc.io");
    await element(by.id("serverFormCheckAndSave")).tap();

    await tapAfterWaitFor(element(by.id("server1")));

    await waitForWebview();
    await tapWebAfterWaitFor(byWebDataTestId("tab-more"));
    await tapWebAfterWaitFor(byWebDataTestId("tab-more-app"));

    // with basic auth
    await element(by.id("addServerIcon")).tap();

    await element(by.id("@serverFormTitle/input")).typeText("Local Auth");
    await element(by.id("@serverFormUrl/input")).typeText("localhost:7080");

    await element(by.id("serverFormAuth")).tap();
    await element(by.id("serverFormAuth")).swipe("up");
    await element(by.id("@serverFormAuthUser/input")).typeText("admin");
    await element(by.id("@serverFormAuthPassword/input")).typeText("secret");

    await element(by.id("serverFormCheckAndSave")).tap();

    // verify the 3rd server was added; switching is covered in
    // "two servers: add and switch"
    await waitFor(element(by.id("server2")))
      .toExist()
      .withTimeout(20000);
  });
});
