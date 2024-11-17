import axios, { AxiosError } from "axios";

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
    const options = { timeout: 10000 };
    if (authOptions) {
      const { username, password } = authOptions;
      options.auth = { username, password };
    }

    const response = await axios.get(url, options);
    const finalUrl = response.request.responseURL;

    const { data } = response;
    if (!data.includes("evcc-app-compatible")) {
      if (data.includes("evcc")) {
        throw new Error(
          "Die evcc Instanz ist noch nicht App-kompatibel. Aktualisiere deine Installation.",
        );
      } else {
        throw new Error(
          "Der Server scheint keine evcc Instanz zu sein. Bitte prüfe die Adresse.",
        );
      }
    }
    return finalUrl;
  } catch (error) {
    if (error instanceof AxiosError) {
      var resp = error.response;
      if (resp) {
        if (resp.status === 401) {
          throw new Error("Missing Authentication");
        }
      }
    }
    console.log(error);
    throw new Error("Server nicht erreichbar. Bitte prüfe die Adresse.");
  }
}
