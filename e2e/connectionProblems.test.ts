import "detox";
import http from "http";
import net from "net";
import { expect } from "detox";
import { expect as jestExpect } from "@jest/globals";
import { launchWithDeepLink, tapAfterWaitFor, waitForWebview } from "./helper";

// Stands in for evcc.cloud: proxies to the local evcc, or fails the way the
// cloud proxy and the evcc tunnel do.
const failures: Record<string, [number, string]> = {
  remoteOffline: [502, "instance offline"],
  rateLimited: [429, "Too many failed login attempts. Try again in 1 minute."],
  auth: [401, "Unauthorized"],
  httpError: [500, "Internal Server Error"],
};

const PORT = 7082;
const UPSTREAM = 7070;
let mode = "proxy"; // or a failures key, "unreachable", "timeout", "websocket"
let requests = 0;
const sockets = new Set<net.Socket>();

const mock = http.createServer((req, res) => {
  requests++;
  if (mode === "timeout") return; // never answer
  const failure = failures[mode];
  if (failure) {
    res.writeHead(failure[0], { "WWW-Authenticate": 'Basic realm="evcc"' });
    res.end(failure[1]);
    return;
  }
  const upstream = http.request(
    {
      port: UPSTREAM,
      path: req.url,
      method: req.method,
      headers: req.headers,
      agent: false,
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", () => res.destroy());
  req.pipe(upstream);
});

mock.on("connection", (socket) => {
  if (mode === "unreachable") {
    socket.destroy();
    return;
  }
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});

mock.on("upgrade", (req, socket, head) => {
  if (mode !== "proxy") {
    socket.destroy();
    return;
  }
  const up = net.connect(UPSTREAM, "localhost", () => {
    const headers = req.rawHeaders
      .map((v, i) => (i % 2 ? `${v}\r\n` : `${v}: `))
      .join("");
    up.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n`);
    up.write(head);
    socket.pipe(up).pipe(socket);
  });
  sockets.add(up);
  up.on("close", () => sockets.delete(up));
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

// drops open connections so the web UI notices right away
function setMode(m: string) {
  mode = m;
  sockets.forEach((s) => s.destroy());
}

async function expectProblem(type: string) {
  await waitFor(element(by.id(`connectionProblem-${type}`)))
    .toExist()
    .withTimeout(30000);
  // retrying early doesn't lift a rate limit, so no retry link there
  if (type === "rateLimited") return;
  await waitFor(element(by.id("connectionRetry")))
    .toExist()
    .withTimeout(30000);
}

async function expectNoRequestsFor(ms: number) {
  const before = requests;
  await new Promise((res) => setTimeout(res, ms));
  jestExpect(requests).toBe(before);
}

async function expectRecovery(type: string, timeout = 30000) {
  setMode("proxy");
  if (type === "auth") {
    await tapAfterWaitFor(element(by.id("connectionRetry")));
  } else {
    await waitFor(element(by.id(`connectionProblem-${type}`)))
      .not.toExist()
      .withTimeout(timeout);
  }
  await waitForWebview();
}

describe("Connection problems", () => {
  beforeAll(() => new Promise<void>((res) => mock.listen(PORT, res)));
  afterAll(() => {
    sockets.forEach((s) => s.destroy()); // lets jest exit
    return new Promise<void>((res) => mock.close(() => res()));
  });

  beforeEach(async () => {
    setMode("proxy");
    await launchWithDeepLink(`evcc://server?url=localhost:${PORT}&title=Mock`);
    await element(by.id("serverFormCheckAndSave")).tap();
    await waitForWebview();
  });

  it("evcc offline at app start", async () => {
    setMode("remoteOffline");
    await device.launchApp({ newInstance: true });
    await expectProblem("remoteOffline");
    await expectRecovery("remoteOffline");
  });

  it("login failed: no automatic retries", async () => {
    setMode("auth");
    await expectProblem("auth");
    await expectNoRequestsFor(20000);
    await expectRecovery("auth");
  });

  it("rate limited: waits a minute", async () => {
    setMode("rateLimited");
    await expectProblem("rateLimited");
    await expectNoRequestsFor(20000);
    await expect(element(by.id("connectionRetry"))).not.toExist();
    await expectRecovery("rateLimited", 90000);
  }, 180000);

  it("server unreachable", async () => {
    setMode("unreachable");
    await expectProblem("unreachable");
    await expectRecovery("unreachable");
  });

  it("server not responding", async () => {
    setMode("timeout");
    await expectProblem("timeout");
    await expectRecovery("timeout");
  });

  it("unexpected http error", async () => {
    setMode("httpError");
    await expectProblem("httpError");
    await expectRecovery("httpError");
  });

  it("page loads, websocket doesn't", async () => {
    setMode("websocket");
    await expectProblem("websocket");
    await expectRecovery("websocket");
  });
});
