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

export function byWebCss(selector: string) {
  return web.element(by.web.cssSelector(selector));
}

/**
 * Some data (such as the list of saved servers) is not immediately passed to the components,
 * but with a short delay. This method handles that delay.
 */
export async function tapAfterWaitFor(element: NativeElement) {
  await waitFor(element).toExist().withTimeout(TIMEOUT);
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < TIMEOUT) {
    try {
      await element.tap();
      return;
    } catch (e) {
      lastError = e;
      await sleep(200);
    }
  }
  throw lastError;
}

/**
 * Detox web matchers do not support `toBeVisible`; tapping a web element may fail
 * with "view not hittable" while the WebView is still laying out. Retries the tap
 * until it succeeds or the timeout is reached.
 */
export async function tapWebAfterWaitFor(
  el: ReturnType<typeof byWebDataTestId>,
) {
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < TIMEOUT) {
    try {
      await el.tap();
      return;
    } catch (e) {
      lastError = e;
      await sleep(200);
    }
  }
  throw lastError;
}
