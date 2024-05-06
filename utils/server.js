import axios from "axios";

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

export async function verifyEvccServer(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
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
  } catch (error) {
    console.log(error);
    throw new Error("Server nicht erreichbar. Bitte prüfe die Adresse.");
  }
}
