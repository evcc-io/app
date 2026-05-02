import "detox";
import { expect } from "detox";
import { NativeElement } from "detox/detox";

const TIMEOUT = 20000; // twenty seconds

/**
 * Detox marks the WebView as ready before its content has fully loaded.
 * This method compensates for that timing issue by ensuring the inner
 * WebView element is actually available before the test continues.
 */
export async function waitForWebview() {
  const dataTestID = "header";
  const app = byWebDataTestId(dataTestID);
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const start = Date.now();

  while (Date.now() - start < TIMEOUT) {
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

/**
 * Some data (such as the list of saved servers) is not immediately passed to the components,
 * but with a short delay. This method handles that delay.
 */
export async function tapAfterWaitFor(element: NativeElement) {
  await waitFor(element).toExist().withTimeout(TIMEOUT);
  await element.tap();
}
