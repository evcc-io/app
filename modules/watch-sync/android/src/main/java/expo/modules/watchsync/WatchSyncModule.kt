package expo.modules.watchsync

import android.util.Log
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val TAG = "WatchSync"

/**
 * Sends the server list to the paired Wear OS watch (Android counterpart of
 * evcc-io/app#349's WatchSyncModule.swift). Uses a persisted DataItem
 * ("urgent" put), so the watch's [io.evcc.wear.WatchSyncListenerService]
 * receives the latest list even if it wasn't reachable when it changed - same
 * delivery guarantee as WatchConnectivity's `updateApplicationContext`.
 */
class WatchSyncModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("WatchSync")

        Function("setServers") { servers: String, activeServerId: String? ->
            val context = appContext.reactContext ?: run {
                Log.w(TAG, "setServers called with no reactContext, dropping")
                return@Function
            }
            val request = PutDataMapRequest.create(SERVERS_PATH).apply {
                dataMap.putString("servers", servers)
                dataMap.putString("activeServerId", activeServerId ?: "")
                dataMap.putLong("updatedAt", System.currentTimeMillis())
            }.asPutDataRequest().setUrgent()
            Wearable.getDataClient(context).putDataItem(request)
                .addOnSuccessListener { Log.d(TAG, "putDataItem ok: ${it.uri}") }
                .addOnFailureListener { Log.w(TAG, "putDataItem failed", it) }
        }
    }

    companion object {
        private const val SERVERS_PATH = "/evcc/servers"
    }
}
