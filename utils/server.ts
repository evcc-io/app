import axios, { AxiosRequestConfig } from "axios";
import { t } from "i18next";
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

// Headers for a server protected by Cloudflare Access. Empty when not configured.
export function serviceTokenHeaders(server?: Server): Record<string, string> {
  const { required, clientId, clientSecret } = server?.serviceToken || {};
  if (!required || !clientId || !clientSecret) return {};
  return {
    "CF-Access-Client-Id": clientId,
    "CF-Access-Client-Secret": clientSecret,
  };
}

export async function verifyEvccServer(server: Server) {
  const options: AxiosRequestConfig = { ...AXIOS_OPTIONS };
  if (server.basicAuth) {
    const { username, password } = server.basicAuth;
    if (username && password) {
      options.auth = { username, password };
    }
  }
  const tokenHeaders = serviceTokenHeaders(server);
  options.headers = { ...options.headers, ...tokenHeaders };
  if (Object.keys(tokenHeaders).length > 0) {
    // makes Cloudflare Access answer an invalid token with 401/403 instead of
    // a redirect to its login page (which would read as "not an evcc server")
    options.headers["X-Requested-With"] = "XMLHttpRequest";
  }

  let response;
  try {
    response = await axios.get(server.url, options);
  } catch (error) {
    console.log(error);
    // 401: basic auth, 403: Cloudflare Access rejecting a missing/invalid token
    const status = axios.isAxiosError(error) ? error.response?.status : 0;
    if (status === 401 || status === 403) {
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
    const resp = await axios.get(`${server.url}/api/state?jq=.siteTitle`, {
      ...AXIOS_OPTIONS,
      headers: { ...AXIOS_OPTIONS.headers, ...serviceTokenHeaders(server) },
    });

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
