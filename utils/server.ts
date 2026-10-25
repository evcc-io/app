import axios, { AxiosRequestConfig } from "axios";
import { t } from "i18next";
import { getNetworkStateAsync } from "expo-network";
import { USER_AGENT } from "./constants";
import { Server } from "types";

const AXIOS_OPTIONS: AxiosRequestConfig = {
  timeout: 10000,
  headers: { "User-Agent": USER_AGENT },
};

export function cleanServerUrl(url: string) {
  let result = url.trim();
  if (!result.startsWith("http://") && !result.startsWith("https://")) {
    result = `http://${result}`;
  }
  if (!result.endsWith("/")) {
    result += "/";
  }
  return result;
}

function requestOptions(server: Server): AxiosRequestConfig {
  const options: AxiosRequestConfig = { ...AXIOS_OPTIONS };
  if (server.basicAuth) {
    const { username, password } = server.basicAuth;
    if (username && password) {
      options.auth = { username, password };
    }
  }
  return options;
}

export type ConnectionProblem =
  | {
      type:
        | "offline" // device has no network at all
        | "unreachable"
        | "timeout"
        | "auth"
        | "rateLimited"
        | "remoteOffline"
        | "websocket"; // page loads, live connection doesn't
    }
  | { type: "httpError"; status: number };

// Single request to explain why the web UI can't connect. Basic auth is sent
// upfront, so a wrong password costs one failed login, not a WebView retry loop.
export async function probeServer(
  server: Server,
): Promise<ConnectionProblem | undefined> {
  if ((await getNetworkStateAsync()).isConnected === false) {
    return { type: "offline" };
  }
  const start = Date.now();
  let response;
  try {
    response = await axios.get<string>(server.url, {
      ...requestOptions(server),
      validateStatus: () => true,
    });
  } catch {
    // Android reports timeouts as generic network errors, so measure instead
    const timeout = Date.now() - start >= 0.9 * AXIOS_OPTIONS.timeout!;
    return { type: timeout ? "timeout" : "unreachable" };
  }

  const { status, data } = response;
  if (status < 400) return undefined;
  if (status === 401) return { type: "auth" };
  if (status === 429) return { type: "rateLimited" };
  // evcc.cloud: no tunnel from the evcc instance
  if (status === 502 && String(data).includes("instance offline")) {
    return { type: "remoteOffline" };
  }
  return { type: "httpError", status };
}

// undefined: don't retry automatically, wait for the user
export function retryDelay(
  problem: ConnectionProblem | undefined,
  attempt: number,
): number | undefined {
  if (problem?.type === "auth") return undefined;
  // evcc blocks remote logins for a minute after too many failures
  const min = problem?.type === "rateLimited" ? 60_000 : 5_000;
  const delay = Math.max(min, Math.min(5_000 * 2 ** attempt, 60_000));
  return delay * (0.8 + Math.random() * 0.4); // jitter, avoid synchronized retries
}

export async function verifyEvccServer(server: Server) {
  const options = requestOptions(server);

  let response;
  try {
    response = await axios.get(server.url, options);
  } catch (error) {
    console.log(String(error));
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error(t("servers.manually.missingOrWrongAuthentication"));
    }
    throw new Error(t("servers.manually.serverNotAvailable"));
  }

  // check if response is from evcc
  const finalUrl = response.request.responseURL;
  const { data } = response;
  if (!data.includes("evcc-app-compatible")) {
    if (data.includes("evcc")) {
      throw new Error(t("servers.manually.serverIncompatible"));
    } else {
      throw new Error(t("servers.manually.checkAdress"));
    }
  }
  return finalUrl;
}

export function getTitle(server: Server): string {
  const url = new URL(server.url);
  let host = url.host;
  for (const s of [`:${url.port}`, ".local.", ".fritz.box"]) {
    if (host.endsWith(s)) {
      host = host.slice(0, -1 * s.length);
    }
  }

  return host;
}

export async function fetchTitle(server: Server) {
  try {
    const resp = await axios.get(
      `${server.url}/api/state?jq=.siteTitle`,
      AXIOS_OPTIONS,
    );

    return await resp.data;
  } catch {}
}

export async function fetchOrGetTitle(server: Server) {
  const title = await fetchTitle(server);
  return title ? title : getTitle(server);
}

export function sameServer(s1?: Server, s2?: Server) {
  return s1 && s2 && s1.url === s2.url;
}
