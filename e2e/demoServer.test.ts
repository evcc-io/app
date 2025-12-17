import "detox";
import { waitForWebview } from "./helper";
import { ServerScreen, Webview } from "./elements";

describe("demo server", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("open and leave demo server", async () => {
    await ServerScreen.useDemoButton.tap();

    await waitForWebview();

    await Webview.changeServerButton.tap();
    // await web.element(by.web.value("Change Server")).tap(); // TODO: use testID
    // TODO: leave server
  });
});
