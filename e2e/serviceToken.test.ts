import "detox";
import { expect } from "detox";
import { tapAfterWaitFor, waitForWebview } from "./helper";

// Server behind the Cloudflare Access emulation on :7082 (see Caddyfile):
// the form's verification request and the webview's first document load carry
// the service token headers; everything after runs on the minted
// CF_Authorization cookie.
describe("Cloudflare Access service token", () => {
  beforeEach(async () => {
    await device.launchApp({ resetAppState: true });
  });

  it("with service token", async () => {
    await element(by.id("manualEntry")).tap();

    await element(by.id("@serverFormTitle/input")).replaceText("Local Access");
    await element(by.id("@serverFormUrl/input")).replaceText("localhost:7082");

    await expect(
      element(by.id("@serverFormServiceTokenId/input")),
    ).not.toExist();
    await expect(
      element(by.id("@serverFormServiceTokenSecret/input")),
    ).not.toExist();

    await tapAfterWaitFor(element(by.id("serverFormServiceToken")));

    await element(by.id("@serverFormServiceTokenId/input")).replaceText(
      "test-id.access",
    );
    await element(by.id("@serverFormServiceTokenSecret/input")).replaceText(
      "test-secret",
    );

    await tapAfterWaitFor(element(by.id("serverFormCheckAndSave")));

    await waitForWebview();
  });

  it("rejects a wrong token", async () => {
    await element(by.id("manualEntry")).tap();

    await element(by.id("@serverFormTitle/input")).replaceText("Local Access");
    await element(by.id("@serverFormUrl/input")).replaceText("localhost:7082");

    await tapAfterWaitFor(element(by.id("serverFormServiceToken")));

    await element(by.id("@serverFormServiceTokenId/input")).replaceText(
      "test-id.access",
    );
    await element(by.id("@serverFormServiceTokenSecret/input")).replaceText(
      "wrong-secret",
    );

    await tapAfterWaitFor(element(by.id("serverFormCheckAndSave")));

    await waitFor(element(by.id("serverFormError")))
      .toExist()
      .withTimeout(20000);
  });
});
