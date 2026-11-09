import "detox";
import { expect } from "detox";
import {
  byWebCss,
  byWebDataTestId,
  tapWebAfterWaitFor,
  waitForWebview,
  launchWithDeepLink,
} from "./helper";

describe("External links", () => {
  it("opens the evcc homepage from the version dialog in the in-app browser", async () => {
    await launchWithDeepLink("evcc://server?url=localhost:7070&title=Local");
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();

    const ios = device.getPlatform() === "ios";
    if (ios) await expect(element(by.type("SFSafariView"))).not.toExist();

    await tapWebAfterWaitFor(byWebDataTestId("tab-more"));
    await tapWebAfterWaitFor(byWebCss(".more-menu .dropdown-item.d-flex"));
    await tapWebAfterWaitFor(byWebCss('#aboutModal a[href="https://evcc.io/"]'));

    if (ios) {
      await waitFor(element(by.type("SFSafariView")))
        .toExist()
        .withTimeout(10000);
    } else {
      // Custom Tabs run in the browser's activity, out of Detox's reach;
      // closing it must return to the untouched evcc UI
      await device.pressBack();
    }
    await waitForWebview();
  });
});
