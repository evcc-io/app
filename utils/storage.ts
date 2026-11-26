import AsyncStorage from "@react-native-async-storage/async-storage";
import { BasicAuth, type NewServer, type Server } from "types";

export enum StorageKeys {
  SERVER_URL = "serverUrl", // legacy
  BASIC_AUTH = "basicAuth", // legacy
  SERVERS = "servers",
  ACTIVE_SERVER = "activeServer",
  NEXT_SERVER_ID = "nextServerId",
}

async function loadLegacyStorage(): Promise<NewServer> {
  const url = (await AsyncStorage.getItem(StorageKeys.SERVER_URL)) || "";
  const basicAuthJson = await AsyncStorage.getItem(StorageKeys.BASIC_AUTH);

  const basicAuth = basicAuthJson
    ? (JSON.parse(basicAuthJson) as BasicAuth)
    : { required: false };

  return { url, basicAuth };
}

async function migrate() {
  const keys = await AsyncStorage.getAllKeys();
  if (!keys.includes(StorageKeys.SERVER_URL)) return;
  if (keys.includes(StorageKeys.SERVERS)) {
    // stale legacy leftovers next to an existing config: current config wins
    await AsyncStorage.removeMany([
      StorageKeys.SERVER_URL,
      StorageKeys.BASIC_AUTH,
    ]);
  } else {
    await migrateStorage();
  }
}

async function migrateStorage() {
  const server = { ...(await loadLegacyStorage()), id: "0" };
  await storeActiveServer(server);
  await storeServers([server]);
  await storeNextServerId(1);
  await AsyncStorage.removeMany([
    StorageKeys.SERVER_URL,
    StorageKeys.BASIC_AUTH,
  ]);
}

export async function loadActiveServer(): Promise<Server | undefined> {
  await migrate();
  const activeServerJson = await AsyncStorage.getItem(
    StorageKeys.ACTIVE_SERVER,
  );
  return activeServerJson ? JSON.parse(activeServerJson) : undefined;
}

export async function loadServers(): Promise<Server[]> {
  await migrate();
  const serversJson = await AsyncStorage.getItem(StorageKeys.SERVERS);
  const servers: Server[] = serversJson ? JSON.parse(serversJson) : [];
  // Saved before servers had ids: widgets reference these by list position,
  // so that position becomes the permanent id.
  if (servers.some((s) => s.id === undefined)) {
    servers.forEach((s, index) => (s.id ??= String(index)));
    await storeServers(servers);
    await storeNextServerId(servers.length);
  }
  return servers;
}

export async function storeActiveServer(server?: Server) {
  if (server !== undefined) {
    await AsyncStorage.setItem(
      StorageKeys.ACTIVE_SERVER,
      JSON.stringify(server),
    );
  } else {
    await AsyncStorage.removeItem(StorageKeys.ACTIVE_SERVER);
  }
}

async function storeServers(servers: Server[]) {
  await AsyncStorage.setItem(StorageKeys.SERVERS, JSON.stringify(servers));
}

async function storeNextServerId(id: number) {
  await AsyncStorage.setItem(StorageKeys.NEXT_SERVER_ID, String(id));
}

// Ids count up and are never handed out twice, so a widget pinned to a removed
// server can't end up showing a newer one.
async function takeServerId(servers: Server[]): Promise<string> {
  const stored = Number(await AsyncStorage.getItem(StorageKeys.NEXT_SERVER_ID));
  const id = Math.max(stored || 0, ...servers.map((s) => Number(s.id) + 1));
  await storeNextServerId(id + 1);
  return String(id);
}

export async function addServer(server: NewServer): Promise<Server> {
  const servers = await loadServers();
  const added = { ...server, id: await takeServerId(servers) };
  servers.push(added);
  await storeServers(servers);
  return added;
}

export async function updateServer(
  server: NewServer,
  index: number,
): Promise<Server> {
  const servers = await loadServers();
  const updated = { ...server, id: servers[index].id };
  servers[index] = updated;
  await storeServers(servers);
  return updated;
}

export async function removeServer(index: number): Promise<Server> {
  const servers = await loadServers();
  const server = servers.splice(index, 1);
  await storeServers(servers);
  return server[0];
}
