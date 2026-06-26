import { Platform } from "react-native";
import { Server } from "types";

const APP_GROUP = "group.io.evcc.ios";

enum WidgetStorageKeys {
  SERVERS = "servers",
  ACTIVE_SERVER_ID = "activeServerId",
}

// Position-based id. Not stable across reorder/delete — revisit with a uuid.
export function widgetServerId(index: number): string {
  return String(index);
}

interface WidgetServer {
  id: string;
  title: string;
  url: string;
  username: string;
  password: string;
  authRequired: boolean;
}

function toWidgetServer(server: Server, index: number): WidgetServer {
  const required = !!server.basicAuth?.required;
  return {
    id: widgetServerId(index),
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
export function syncWidgetServers(servers: Server[], activeServer?: Server): void {
  const mod = getExtensionStorage();
  if (!mod) return;
  try {
    const storage = new mod.ExtensionStorage(APP_GROUP);
    storage.set(
      WidgetStorageKeys.SERVERS,
      JSON.stringify(servers.map(toWidgetServer)),
    );
    const activeIndex = activeServer
      ? servers.findIndex((s) => s.url === activeServer.url)
      : -1;
    if (activeIndex >= 0) {
      storage.set(WidgetStorageKeys.ACTIVE_SERVER_ID, widgetServerId(activeIndex));
    } else {
      storage.remove(WidgetStorageKeys.ACTIVE_SERVER_ID);
    }
    mod.ExtensionStorage.reloadWidget();
  } catch {
    // widget sync is non-critical
  }
}
