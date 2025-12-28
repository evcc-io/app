import "detox";
import { expect } from "detox";

/**
 * Detox marks the WebView as ready before its content has fully loaded.
 * This method compensates for that timing issue by ensuring the inner
 * WebView element is actually available before the test continues.
 */
export async function waitForWebview(
  dataTestID: string = "topnavigation-button",
) {
  const timeout = 20000; // twenty seconds
  const app = byWebDataTestId(dataTestID);
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

  throw new Error(`WebView element with data-testid ${dataTestID} didn't load`);
}

export function byWebDataTestId(dataTestID: string) {
  return web.element(by.web.cssSelector(`[data-testid=${dataTestID}]`));
}
