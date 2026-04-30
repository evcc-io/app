import AsyncStorage from "@react-native-async-storage/async-storage";
import { BasicAuth, type Server } from "types";

export enum StorageKeys {
  SERVER_URL = "serverurl", // legacy
  BASIC_AUTH = "basicAuth", // legacy
  SERVERS = "servers",
  ACTIVE_SERVER = "activeServer",
}

async function loadLegacyStorage(): Promise<Server> {
  const url = (await AsyncStorage.getItem(StorageKeys.SERVER_URL)) || "";
  const basicAuthJson = await AsyncStorage.getItem(StorageKeys.BASIC_AUTH);

  const basicAuth = basicAuthJson
    ? (JSON.parse(basicAuthJson) as BasicAuth)
    : { required: false };

  return { url, basicAuth };
}

async function migrate() {
  const keys = await AsyncStorage.getAllKeys();
  if (keys.includes(StorageKeys.SERVER_URL)) {
    await migrateStorage();
  }
}

async function migrateStorage() {
  const server = await loadLegacyStorage();
  await storeActiveServer(server);
  await storeServers([server]);
  await AsyncStorage.multiRemove([
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
  return serversJson ? JSON.parse(serversJson) : [];
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

export async function addServer(server: Server) {
  const servers = await loadServers();
  servers.push(server);
  await storeServers(servers);
}

export async function updateServer(server: Server, index: number) {
  const servers = await loadServers();
  servers[index] = server;
  await storeServers(servers);
  return index;
}

export async function removeServer(index: number): Promise<Server> {
  const servers = await loadServers();
  const server = servers.splice(index, 1);
  await storeServers(servers);
  return server[0];
}
