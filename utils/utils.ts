import { Server } from "types";

export default async function getTitle(server: Server): Promise<string> {
  const url = new URL(server.url);
  let host = url.host;

  try {
    const resp = await fetch(
      `${url.protocol}//${host}/api/state?jq=.siteTitle`,
    );
    const siteTitle = await resp.json();
    if (siteTitle) return siteTitle;
  } catch {}

  for (const s of [".local.", ".fritz.box"]) {
    if (host.endsWith(s)) {
      host = host.slice(0, -1 * s.length);
      break;
    }
  }

  return host;
}
