import "detox";
import { expect } from "detox";

/**
 * Detox marks the WebView as ready before its content has fully loaded.
 * This method compensates for that timing issue by ensuring the inner
 * WebView element is actually available before the test continues.
 */
export async function waitForWebview(
  webviewId: string = "topNavigatonDropdown",
) {
  const timeout = 30000; // thirty seconds
  const app = web.element(by.web.id(webviewId));
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      await expect(app).toExist();
      return;
    } catch {
      await sleep(100);
    }
  }

  throw new Error(`WebView element with id ${webviewId} didn't load`);
}

export const HOST_IP =
  device.getPlatform() === "android" ? "10.0.2.2" : "localhost";
