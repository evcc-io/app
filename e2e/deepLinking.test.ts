import "detox";
import { expect } from "detox";
import { waitForWebview } from "./helper";

describe("Deep Linking", () => {
  it("open server", async () => {
    await device.launchApp({
      url: "evcc://server?url=localhost:7070",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "localhost:7070",
    );
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(false);
    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("open server with basic auth", async () => {
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7080&username=admin&password=secret",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "http://localhost:7080",
    );
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(true);
    await expect(element(by.id("@serverFormAuthUser/input"))).toHaveText(
      "admin",
    );
    await expect(element(by.id("@serverFormAuthPassword/input"))).toHaveText(
      "secret",
    );
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(false);
    await expect(element(by.id("@serverFormHeaderName/input"))).not.toExist();
    await expect(element(by.id("@serverFormHeaderValue/input"))).not.toExist();

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("open server with proxy header", async () => {
    await device.launchApp({
      url: "evcc://server?url=http://localhost:7090&headerName=X-App-Token&headerValue=super-secret-value",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "http://localhost:7090",
    );
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(false);
    await expect(element(by.id("@serverFormAuthUser/input"))).not.toExist();
    await expect(element(by.id("@serverFormAuthPassword/input"))).not.toExist();
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormHeader"))).toHaveToggleValue(true);
    await expect(element(by.id("@serverFormHeaderName/input"))).toHaveText(
      "X-App-Token",
    );
    await expect(element(by.id("@serverFormHeaderValue/input"))).toHaveText(
      "super-secret-value",
    );

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("open server with basic auth and proxy header", async () => {
    await device.launchApp({
      url: "evcc://server?url=http://localhost:8000&username=admin&password=secret&headerName=X-App-Token&headerValue=super-secret-value",
      resetAppState: true,
    });

    await expect(element(by.id("@serverFormUrl/input"))).toHaveText(
      "http://localhost:8000",
    );
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormAuth"))).toHaveToggleValue(true);
    await expect(element(by.id("@serverFormAuthUser/input"))).toHaveText(
      "admin",
    );
    await expect(element(by.id("@serverFormAuthPassword/input"))).toHaveText(
      "secret",
    );
    // TODO: see https://github.com/wix/Detox/issues/4884
    // await expect(element(by.id("serverFormHeader"))).toHaveToggleValue(true);
    await expect(element(by.id("@serverFormHeaderName/input"))).toHaveText(
      "X-App-Token",
    );
    await expect(element(by.id("@serverFormHeaderValue/input"))).toHaveText(
      "super-secret-value",
    );

    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });
});
