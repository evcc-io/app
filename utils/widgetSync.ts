import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import { Server } from "types";

const APP_GROUP = "group.io.evcc.app";

// Android: the Glance widget runs in the app process, so a plain JSON file in
// the document directory is enough. Keep the name in sync with SharedStore.kt.
const ANDROID_SERVERS_FILE = "evcc-widget-servers.json";

enum WidgetStorageKeys {
  SERVERS = "servers",
  ACTIVE_SERVER_ID = "activeServerId",
}

interface WidgetServer {
  id: string;
  title: string;
  url: string;
  username: string;
  password: string;
  authRequired: boolean;
}

function toWidgetServer(server: Server): WidgetServer {
  const required = !!server.basicAuth?.required;
  return {
    id: server.id,
    title: server.title?.trim() || server.url,
    url: server.url,
    username: required ? (server.basicAuth?.username ?? "") : "",
    password: required ? (server.basicAuth?.password ?? "") : "",
    authRequired: required,
  };
}

// Lazy require so non-iOS builds (and any env without the native module) no-op.
function getExtensionStorage() {
  if (Platform.OS !== "ios") return undefined;
  try {
    return require("@bacons/apple-targets") as typeof import("@bacons/apple-targets");
  } catch {
    return undefined;
  }
}

/**
 * Mirror the server list into the shared App Group so the iOS widget extension
 * can list servers in its config and authenticate its own /api/state fetches,
 * then ask WidgetKit to reload. Best-effort: failures are swallowed.
 */
export function syncWidgetServers(
  servers: Server[],
  activeServer?: Server,
): void {
  if (Platform.OS === "android") {
    syncAndroidWidgetServers(servers, activeServer?.id);
    return;
  }
  syncIosWidgetServers(servers, activeServer?.id);
}

function syncIosWidgetServers(
  servers: Server[],
  activeServerId?: string,
): void {
  const mod = getExtensionStorage();
  if (!mod) return;
  try {
    const storage = new mod.ExtensionStorage(APP_GROUP);
    storage.set(
      WidgetStorageKeys.SERVERS,
      JSON.stringify(servers.map(toWidgetServer)),
    );
    if (activeServerId !== undefined) {
      storage.set(WidgetStorageKeys.ACTIVE_SERVER_ID, activeServerId);
    } else {
      storage.remove(WidgetStorageKeys.ACTIVE_SERVER_ID);
    }
    mod.ExtensionStorage.reloadWidget();
  } catch {
    // widget sync is non-critical
  }
}

// The widget re-reads the file on its next update (periodic, reload button, tap).
function syncAndroidWidgetServers(
  servers: Server[],
  activeServerId?: string,
): void {
  try {
    const payload = {
      [WidgetStorageKeys.SERVERS]: servers.map(toWidgetServer),
      [WidgetStorageKeys.ACTIVE_SERVER_ID]: activeServerId ?? null,
    };
    const file = new File(Paths.document, ANDROID_SERVERS_FILE);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(payload));
  } catch {
    // widget sync is non-critical
  }
}
