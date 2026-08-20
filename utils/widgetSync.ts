import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import { Server } from "types";
import { refreshWidgets } from "./widgetRefresh";

const APP_GROUP = "group.io.evcc.app";

// Android: the Glance widget is part of the same app package, so it can read a
// plain JSON file from the app's document directory directly (no App Group /
// native module needed). Keep this filename in sync with SharedStore.kt.
const ANDROID_SERVERS_FILE = "evcc-widget-servers.json";

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
  const activeIndex = activeServer
    ? servers.findIndex((s) => s.url === activeServer.url)
    : -1;
  const activeServerId = activeIndex >= 0 ? widgetServerId(activeIndex) : undefined;

  if (Platform.OS === "android") {
    syncAndroidWidgetServers(servers, activeServerId);
    return;
  }
  syncIosWidgetServers(servers, activeServerId);
}

function syncIosWidgetServers(servers: Server[], activeServerId?: string): void {
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

/**
 * Android: write the server list to a JSON file the Glance widget reads, then
 * ask the widgets to redraw immediately (via the local evcc-widget module) so a
 * changed server list shows up without waiting for the periodic WorkManager tick.
 */
function syncAndroidWidgetServers(servers: Server[], activeServerId?: string): void {
  try {
    const payload = {
      [WidgetStorageKeys.SERVERS]: servers.map(toWidgetServer),
      [WidgetStorageKeys.ACTIVE_SERVER_ID]: activeServerId ?? null,
    };
    const file = new File(Paths.document, ANDROID_SERVERS_FILE);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(payload));
    refreshWidgets();
  } catch {
    // widget sync is non-critical
  }
}
