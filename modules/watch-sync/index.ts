import { requireOptionalNativeModule } from "expo";

interface WatchSyncModule {
  setServers(servers: string, activeServerId: string | null): void;
}

const WatchSync = requireOptionalNativeModule<WatchSyncModule>("WatchSync");

// Hands the server list (JSON, same shape as the widget's) to the Apple Watch
// app. No-op without a paired watch or on platforms without the module.
export function syncWatchServers(
  serversJson: string,
  activeServerId?: string,
): void {
  WatchSync?.setServers(serversJson, activeServerId ?? null);
}
