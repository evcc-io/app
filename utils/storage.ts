import AsyncStorage from "@react-native-async-storage/async-storage";
import { BasicAuth, type Connection } from "types";

enum StorageKeys {
  SERVER_URL = "serverurl", // legacy
  BASIC_AUTH = "basicAuth", // legacy
  CONNECTIONS = "connections",
}

async function loadLegacyStorage(): Promise<Connection> {
  const url = (await AsyncStorage.getItem(StorageKeys.SERVER_URL)) || "";
  const basicAuthJson = await AsyncStorage.getItem(StorageKeys.BASIC_AUTH);

  const basicAuth = basicAuthJson
    ? (JSON.parse(basicAuthJson) as BasicAuth)
    : { required: false };

  return { url, basicAuth };
}

async function migrateStorage() {
  const connection = await loadLegacyStorage();
  await AsyncStorage.setItem(
    StorageKeys.CONNECTIONS,
    JSON.stringify([connection]),
  );
  await AsyncStorage.multiRemove([
    StorageKeys.SERVER_URL,
    StorageKeys.BASIC_AUTH,
  ]);
}

export async function loadConnections(): Promise<Connection[]> {
  const keys = await AsyncStorage.getAllKeys();

  if (
    keys.includes(StorageKeys.SERVER_URL) ||
    keys.includes(StorageKeys.BASIC_AUTH)
  ) {
    await migrateStorage();
  }

  const connections =
    (await AsyncStorage.getItem(StorageKeys.CONNECTIONS)) || "";
  return JSON.parse(connections);
}

async function storeConnections(connections: Connection[]) {
  await AsyncStorage.setItem(
    StorageKeys.CONNECTIONS,
    JSON.stringify(connections),
  );
}

export async function addOrUpdateConnection(
  index: number,
  connection: Connection,
) {
  const connections = await loadConnections();
  if (index < connections.length) {
    connections[index] = connection;
  } else {
    connections.push(connection);
    index = connections.length - 1;
  }

  await storeConnections(connections);
  return index;
}

export async function deleteConnection(index: number) {
  const connections = await loadConnections();
  delete connections[index];
  await storeConnections(connections);
}
