import AsyncStorage from "@react-native-async-storage/async-storage";
import { BasicAuth, type Server } from "types";
import getTitle from "./utils";

export enum StorageKeys {
  SERVER_URL = "serverurl", // legacy
  BASIC_AUTH = "basicAuth", // legacy
  SERVERS = "servers",
}

async function loadLegacyStorage(): Promise<Server> {
  const url = (await AsyncStorage.getItem(StorageKeys.SERVER_URL)) || "";
  const basicAuthJson = await AsyncStorage.getItem(StorageKeys.BASIC_AUTH);

  const basicAuth = basicAuthJson
    ? (JSON.parse(basicAuthJson) as BasicAuth)
    : { required: false };

  const title = await getTitle({ url, basicAuth });

  return { url, basicAuth, title };
}

async function migrateStorage() {
  const server = await loadLegacyStorage();
  await storeServers([server]);
  await AsyncStorage.multiRemove([
    StorageKeys.SERVER_URL,
    StorageKeys.BASIC_AUTH,
  ]);
}

export async function loadServers(): Promise<Server[]> {
  const keys = await AsyncStorage.getAllKeys();
  if (keys.includes(StorageKeys.SERVER_URL)) {
    await migrateStorage();
  }

  const serversJson = await AsyncStorage.getItem(StorageKeys.SERVERS);
  return serversJson ? JSON.parse(serversJson) : [];
}

async function storeServers(servers: Server[]) {
  await AsyncStorage.setItem(StorageKeys.SERVERS, JSON.stringify(servers));
}

export async function addOrUpdateServer(index: number, server: Server) {
  const servers = await loadServers();
  if (index < servers.length) {
    servers[index] = server;
  } else {
    servers.push(server);
    index = servers.length - 1;
  }

  await storeServers(servers);
  return index;
}

export async function deleteServers(index: number) {
  const servers = await loadServers();
  servers.splice(index, 1);
  await storeServers(servers);
}
