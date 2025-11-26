import "detox";
import { expect } from "detox";

/**
 * Detox marks the WebView as ready before its content has fully loaded.
 * This method compensates for that timing issue by ensuring the inner
 * WebView element is actually available before the test continues.
 */
export async function waitForWebview() {
  const timeout = 2000; // two seconds
  const app = web.element(by.web.id("topNavigatonDropdown"));
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      await expect(app).toExist();
      await new Promise((res) => setTimeout(res, 1000));
      return;
    } catch {
      await new Promise((res) => setTimeout(res, 100));
    }
  }

  throw new Error(`WebView didn't load`);
}
