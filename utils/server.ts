import axios, { AxiosRequestConfig } from "axios";
import { t } from "i18next";
import { USER_AGENT } from "./constants";
import { BasicAuth, ProxyHeader } from "types";

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

export async function verifyEvccServer(
  url: string,
  authOptions: BasicAuth,
  proxyHeaderOptions: ProxyHeader,
) {
  const options: AxiosRequestConfig = {
    timeout: 10000,
    headers: { "User-Agent": USER_AGENT },
  };
  if (authOptions) {
    const { username, password } = authOptions;
    if (username && password) {
      options.auth = { username, password };
    }
  }
  if (proxyHeaderOptions) {
    const { headerName, headerValue } = proxyHeaderOptions;
    if (headerName && headerValue) {
      options.headers = options.headers || {};
      options.headers[headerName] = headerValue;
    }
  }

  let response;
  try {
    response = await axios.get(url, options);
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
