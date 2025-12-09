import "detox";
import { waitForWebview } from "./helper";

describe("Deep Linking", () => {
  it("open server", async () => {
    await device.launchApp({
      newInstance: true,
      url: "evcc://server?url=http://evcc.local:7070",
    });

    await waitForWebview();
  });
});
