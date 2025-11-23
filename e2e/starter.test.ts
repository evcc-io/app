import "detox";

describe("Example", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("open and leave demo server", async () => {
    await element(by.id("useDemo")).tap();

    await web.element(by.web.id("topNavigatonDropdown")).tap();
    // await web.element(by.web.value("Change Server")).tap(); // TODO: use testID
  });
});
