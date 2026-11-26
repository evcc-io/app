package io.evcc.wear

import android.util.Log
import androidx.wear.tiles.TileService
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import kotlinx.coroutines.runBlocking

private const val TAG = "WatchSync"

/**
 * Receives the server list from the phone app (`modules/watch-sync`, Android
 * counterpart of the iOS watch app's WatchSyncModule.swift / ServerList.swift,
 * evcc-io/app#349) via the Wearable Data Layer and stores it in [ServerStore].
 *
 * The phone writes a persisted DataItem (not a one-off message), so the latest
 * server list is delivered even if the watch wasn't reachable when it changed -
 * same guarantee as WatchConnectivity's `updateApplicationContext`.
 */
class WatchSyncListenerService : WearableListenerService() {
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        Log.d(TAG, "onDataChanged: ${dataEvents.count} event(s)")
        dataEvents.use { events ->
            for (event in events) {
                Log.d(TAG, "event type=${event.type} path=${event.dataItem.uri.path}")
                if (event.type != DataEvent.TYPE_CHANGED) continue
                if (event.dataItem.uri.path != SERVERS_PATH) continue
                val map = DataMapItem.fromDataItem(event.dataItem).dataMap
                val serversJson = map.getString("servers") ?: continue
                val activeServerId = map.getString("activeServerId")?.takeIf { it.isNotEmpty() }
                Log.d(TAG, "applying sync, ${serversJson.length} chars")
                runBlocking { ServerStore.applySync(applicationContext, serversJson, activeServerId) }
            }
        }
        TileService.getUpdater(applicationContext).requestUpdate(LoadpointTileService::class.java)
    }

    companion object {
        const val SERVERS_PATH = "/evcc/servers"
    }
}
