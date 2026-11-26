package io.evcc.wear

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import org.json.JSONArray

/**
 * One evcc server as synced from the phone app (Wearable Data Layer, see
 * [WatchSyncListenerService]). Same shape as SharedStore.kt's StoredServer
 * (widget #255) / targets/_shared/ApiClient.swift's StoredServer (iOS watch).
 */
data class SyncedServer(
    val id: String,
    val title: String?,
    val url: String,
    val username: String?,
    val password: String?,
    val authRequired: Boolean,
) {
    val displayTitle: String get() = title?.takeIf { it.isNotBlank() } ?: url
}

private val Context.wearDataStore: DataStore<Preferences> by preferencesDataStore(name = "evcc_wear")

/**
 * Multi-server config, written by [WatchSyncListenerService] whenever the phone
 * pushes a new server list, read by the app UI and the tile. Unlike the old
 * single-server standalone design (targets/wear/PLAN.md v1), the watch never
 * asks the user to type a URL - it mirrors what's already configured in the
 * phone app, same as the Apple Watch app (evcc-io/app#349).
 */
object ServerStore {
    private val SERVERS_JSON = stringPreferencesKey("serversJson")
    private val ACTIVE_SERVER_ID = stringPreferencesKey("activeServerId")
    private val SELECTED_SERVER_ID = stringPreferencesKey("selectedServerId")

    private fun parseServers(json: String?): List<SyncedServer> {
        if (json.isNullOrEmpty()) return emptyList()
        return runCatching {
            val arr = JSONArray(json)
            (0 until arr.length()).mapNotNull { i ->
                val o = arr.optJSONObject(i) ?: return@mapNotNull null
                SyncedServer(
                    id = o.optString("id"),
                    title = o.optString("title").takeIf { it.isNotEmpty() },
                    url = o.optString("url"),
                    username = o.optString("username").takeIf { it.isNotEmpty() },
                    password = o.optString("password").takeIf { it.isNotEmpty() },
                    authRequired = o.optBoolean("authRequired", false),
                )
            }
        }.getOrDefault(emptyList())
    }

    data class State(
        val servers: List<SyncedServer>,
        val activeServerId: String?,
        val selectedServerId: String?,
    ) {
        /** Explicit on-watch pick, else the phone's active server, else the first one. */
        val selected: SyncedServer?
            get() = servers.firstOrNull { it.id == selectedServerId }
                ?: servers.firstOrNull { it.id == activeServerId }
                ?: servers.firstOrNull()
    }

    fun flow(context: Context): Flow<State> = context.wearDataStore.data.map { p ->
        State(
            servers = parseServers(p[SERVERS_JSON]),
            activeServerId = p[ACTIVE_SERVER_ID],
            selectedServerId = p[SELECTED_SERVER_ID],
        )
    }

    suspend fun current(context: Context): State = flow(context).first()

    /** Called by [WatchSyncListenerService] with the raw JSON payload from the phone. */
    suspend fun applySync(context: Context, serversJson: String, activeServerId: String?) {
        context.wearDataStore.edit { p ->
            p[SERVERS_JSON] = serversJson
            if (activeServerId.isNullOrEmpty()) p.remove(ACTIVE_SERVER_ID) else p[ACTIVE_SERVER_ID] = activeServerId
        }
    }

    suspend fun select(context: Context, serverId: String?) {
        context.wearDataStore.edit { p ->
            if (serverId.isNullOrEmpty()) p.remove(SELECTED_SERVER_ID) else p[SELECTED_SERVER_ID] = serverId
        }
    }
}
