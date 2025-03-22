import axios from "axios";
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
  const options = {
    timeout: 10000,
    headers: { "User-Agent": USER_AGENT },
  };
  if (authOptions) {
    const { username, password } = authOptions;
    options.auth = { username, password };
  }

  let response;
  try {
    response = await axios.get(url, options);
  } catch (error) {
    console.log(error);
    if (error.response?.status === 401) {
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
