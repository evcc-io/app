import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BasicAuth, SavedServer, Server } from "types";

export interface ServerConfig {
  servers: SavedServer[];
  activeServer?: SavedServer;
}

export async function storeServerConfig({
  servers,
  activeServer,
}: ServerConfig) {
  await AsyncStorage.setMany({
    servers: JSON.stringify(servers),
    activeServer: JSON.stringify(activeServer ?? null),
  });
}

export async function loadServerConfig(): Promise<ServerConfig> {
  const {
    servers: serversJson,
    activeServer: activeJson,
    serverUrl,
    basicAuth: authJson,
  } = await AsyncStorage.getMany([
    "servers",
    "activeServer",
    "serverUrl",
    "basicAuth",
  ]);

  // Before multi-server support the URL and credentials had separate keys.
  let entries: (Server & { id?: string })[] = [];
  if (serversJson) {
    entries = JSON.parse(serversJson);
  } else if (serverUrl != null) {
    const basicAuth: BasicAuth = authJson
      ? JSON.parse(authJson)
      : { required: false };
    entries = [{ url: serverUrl, basicAuth }];
  }

  // Keep the IDs already embedded in widget configurations and mode actions.
  // New servers get UUIDs, so these numeric IDs can never be reused.
  const servers = entries.map((server, index) => ({
    ...server,
    id: server.id ?? String(index),
  }));
  const previousActive: (Server & { id?: string }) | null = activeJson
    ? JSON.parse(activeJson)
    : null;
  const activeServer =
    servers.find((s) =>
      previousActive?.id !== undefined
        ? s.id === previousActive.id
        : s.url === previousActive?.url,
    ) ?? servers[0];
  const config = { servers, activeServer };

  if (entries.some((server) => server.id === undefined)) {
    await storeServerConfig(config);
  }
  if (serverUrl != null) {
    await AsyncStorage.removeMany(["serverUrl", "basicAuth"]);
  }
  return config;
}
