import "detox";
import { expect } from "detox";
import {
  byWebDataTestId,
  tapAfterWaitFor,
  tapWebAfterWaitFor,
  waitForWebview,
} from "./helper";

const TIMEOUT = 20000;

// Seeds three servers the way releases before server ids stored them:
// Local (position 0), Local Auth (1, the active one), Demo (2).
async function launchWithServersWithoutId() {
  await device.launchApp({
    resetAppState: true,
    launchArgs: { testServersWithoutId: true },
  });
}

async function openServerList() {
  await waitForWebview();
  await tapWebAfterWaitFor(byWebDataTestId("tab-more"));
  await tapWebAfterWaitFor(byWebDataTestId("tab-more-app"));
}

// the list entry showing this title (or url, if untitled) carries the id
async function expectServerId(title: string, id: number) {
  await waitFor(element(by.text(title).withAncestor(by.id(`serverId${id}`))))
    .toExist()
    .withTimeout(TIMEOUT);
}

async function expectActiveServerId(id: number) {
  await waitFor(
    element(by.id("activeServer").withAncestor(by.id(`serverId${id}`))),
  )
    .toExist()
    .withTimeout(TIMEOUT);
}

async function removeServer(position: number) {
  await tapAfterWaitFor(element(by.id(`editServer${position}Icon`)));
  await element(by.id("setingsScreenRemoveServer")).tap();
  await element(by.text("Remove")).tap();
}

describe("Migrations", () => {
  it("legacy single server storage", async () => {
    await device.launchApp({
      resetAppState: true,
      launchArgs: {
        testLegacyServerConfig: true,
      },
    });

    await openServerList();
    await expectServerId("http://localhost:7080", 0);
    await expectActiveServerId(0);
  });

  it("servers without id: position becomes id", async () => {
    await launchWithServersWithoutId();

    await openServerList();
    await expectServerId("Local", 0);
    await expectServerId("Local Auth", 1);
    await expectServerId("Demo", 2);
    // still the stored active server, not the first one
    await expectActiveServerId(1);
  });

  it("ids survive removing a server and a restart", async () => {
    await launchWithServersWithoutId();

    await openServerList();
    await removeServer(0);
    await expect(element(by.text("Local"))).not.toExist();
    await expectServerId("Local Auth", 1);
    await expectServerId("Demo", 2);
    await expectActiveServerId(1);

    // not seeded again: the migration must not renumber what it finds
    await device.launchApp({ newInstance: true });
    await openServerList();
    await expectServerId("Local Auth", 1);
    await expectServerId("Demo", 2);
    await expectActiveServerId(1);
  });

  it("new server continues numbering", async () => {
    await launchWithServersWithoutId();

    await openServerList();
    // remove the highest id, then add a server: 2 must not be handed out again
    await removeServer(2);
    await expectServerId("Local Auth", 1);
    await expect(element(by.text("Demo"))).not.toExist();

    await tapAfterWaitFor(element(by.id("addServerIcon")));
    await element(by.id("serverFormTitle")).replaceText("Demo");
    await element(by.id("serverFormUrl")).replaceText("demo.evcc.io");
    await tapAfterWaitFor(element(by.id("serverFormCheckAndSave")));

    await expectServerId("Demo", 3);
    await expectActiveServerId(3);
  });

  it("widget deep link resolves by id", async () => {
    await launchWithServersWithoutId();

    await openServerList();
    // shift the positions: Demo (id 2) is now at position 1
    await removeServer(0);
    await expectServerId("Demo", 2);
    await expectActiveServerId(1);

    await device.openURL({ url: "evcc://loadpoint?server=2" });
    await expectActiveServerId(2);
  });
});
