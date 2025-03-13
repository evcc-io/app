import axios, { AxiosError } from "axios";
import { t } from "i18next";
import { USER_AGENT } from "./constants";

export function cleanServerUrl(url) {
  let result = url.trim();
  if (!result.startsWith("http://") && !result.startsWith("https://")) {
    result = `http://${result}`;
  }
  if (!result.endsWith("/")) {
    result += "/";
  }
  return result;
}

export async function verifyEvccServer(url, authOptions) {
  try {
    const options = {
      timeout: 10000,
      headers: { "User-Agent": USER_AGENT },
    };
    if (authOptions) {
      const { username, password } = authOptions;
      options.auth = { username, password };
    }

    const response = await axios.get(url, options);
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
  } catch (error) {
    if (error instanceof AxiosError) {
      var resp = error.response;
      if (resp) {
        if (resp.status == 401) {
          throw new Error(t("servers.manually.missingOrWrongAuthentication"));
        }
      }
    }
    console.log(error);
    throw new Error(t("servers.manually.serverNotAvailable"));
  }
}
