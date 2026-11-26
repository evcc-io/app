import { requireOptionalNativeModule } from "expo";

interface WatchSyncModule {
  setServers(servers: string, activeServerId: string | null): void;
}

const WatchSync = requireOptionalNativeModule<WatchSyncModule>("WatchSync");
if (!WatchSync) {
  console.warn("WatchSync native module not found - watch sync disabled");
}

/**
 * Hands the server list (JSON, same shape as the widget's) to the paired Wear
 * OS watch via the Wearable Data Layer. No-op without a paired watch, without
 * the watch app installed, or on platforms without the module (iOS has its
 * own watch-sync path, see evcc-io/app#349, once it lands in this fork).
 */
export function syncWatchServers(
  serversJson: string,
  activeServerId?: string,
): void {
  WatchSync?.setServers(serversJson, activeServerId ?? null);
}
