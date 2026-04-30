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

export async function verifyEvccServer(server: Server) {
  if (server.basicAuth) {
    const { username, password } = server.basicAuth;
    if (username && password) {
      AXIOS_OPTIONS.auth = { username, password };
    }
  }

  let response;
  try {
    response = await axios.get(server.url, AXIOS_OPTIONS);
  } catch (error) {
    console.log(error);
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
