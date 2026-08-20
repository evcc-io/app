package io.evcc.android.widget

import android.content.Context
import org.json.JSONObject
import java.io.File

/** One server, mirrored from the React Native app (utils/widgetSync.ts). */
data class StoredServer(
    val id: String,
    val title: String?,
    val url: String,
    val username: String?,
    val password: String?,
    val authRequired: Boolean,
) {
    val displayTitle: String
        get() = title?.takeIf { it.isNotBlank() } ?: url
}

/**
 * Reads the server list the RN app writes to the app's document directory.
 * Android counterpart of the iOS SharedStore.swift (App Group). Same package
 * as the app, so no App Group / native module is needed — a plain file works.
 */
object SharedStore {
    // keep in sync with widgetSync.ts ANDROID_SERVERS_FILE
    private const val FILE_NAME = "evcc-widget-servers.json"

    private fun readJson(context: Context): JSONObject? {
        val f = File(context.filesDir, FILE_NAME)
        if (!f.exists()) return null
        return runCatching { JSONObject(f.readText()) }.getOrNull()
    }

    fun servers(context: Context): List<StoredServer> {
        val arr = readJson(context)?.optJSONArray("servers") ?: return emptyList()
        return (0 until arr.length()).mapNotNull { i ->
            val o = arr.optJSONObject(i) ?: return@mapNotNull null
            StoredServer(
                id = o.optString("id"),
                title = o.optString("title").takeIf { it.isNotEmpty() },
                url = o.optString("url"),
                username = o.optString("username").takeIf { it.isNotEmpty() },
                password = o.optString("password").takeIf { it.isNotEmpty() },
                authRequired = o.optBoolean("authRequired", false),
            )
        }
    }

    private fun activeServerId(context: Context): String? =
        readJson(context)?.optString("activeServerId")?.takeIf { it.isNotEmpty() }

    fun defaultServer(context: Context): StoredServer? {
        val all = servers(context)
        val id = activeServerId(context)
        return all.firstOrNull { it.id == id } ?: all.firstOrNull()
    }

    /** Resolve the server selected in the widget config, else the active one. */
    fun server(context: Context, id: String?): StoredServer? {
        if (id.isNullOrEmpty()) return defaultServer(context)
        return servers(context).firstOrNull { it.id == id } ?: defaultServer(context)
    }
}
