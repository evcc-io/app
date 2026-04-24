import { Server } from "types";

export async function getTitle(server: Server): Promise<string> {
  const url = new URL(server.url);
  let host = url.host;

  console.log(host);
  console.log(url);

  try {
    const resp = await fetch(
      `${url.protocol}//${host}/api/state?jq=.siteTitle`,
    );
    console.log(resp);

    const siteTitle = await resp.json();
    console.log(siteTitle);

    if (siteTitle) return siteTitle;
  } catch {}

  for (const s of [`:${url.port}`, ".local.", ".fritz.box"]) {
    if (host.endsWith(s)) {
      host = host.slice(0, -1 * s.length);
    }
  }

  return host;
}

export function sameServer(s1?: Server, s2?: Server) {
  return s1 && s2 && s1.url === s2.url;
}
