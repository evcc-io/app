package io.evcc.android.widget

import android.util.Base64
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

sealed interface FetchOutcome {
    data class Success(val json: String) : FetchOutcome
    object NoData : FetchOutcome   // reachable, but the jq slice is null / empty
    object Failure : FetchOutcome  // network or auth error
}

/**
 * Minimal evcc API client: GET jq slices of /api/state and POST actions, with
 * optional basic auth. Android counterpart of ApiClient.swift. Runs on a
 * background thread (call from a coroutine / worker).
 */
object ApiClient {
    private const val TIMEOUT_MS = 15_000

    private fun base(server: StoredServer): String = server.url.trimEnd('/')

    private fun authorize(conn: HttpURLConnection, server: StoredServer) {
        if (server.authRequired && !server.username.isNullOrEmpty() && server.password != null) {
            val token = Base64.encodeToString(
                "${server.username}:${server.password}".toByteArray(),
                Base64.NO_WRAP,
            )
            conn.setRequestProperty("Authorization", "Basic $token")
        }
    }

    /** GET /api/state?jq=<jq>. Returns the raw response body on success. */
    fun fetch(server: StoredServer, jq: String): FetchOutcome {
        val url = "${base(server)}/api/state?jq=" + URLEncoder.encode(jq, "UTF-8")
        return runCatching {
            val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                requestMethod = "GET"
                authorize(this, server)
            }
            try {
                if (conn.responseCode !in 200..299) return FetchOutcome.Failure
                val body = conn.inputStream.bufferedReader().use { it.readText() }.trim()
                if (body.isEmpty() || body == "null" || body == "[]" || body == "{}") {
                    FetchOutcome.NoData
                } else {
                    FetchOutcome.Success(body)
                }
            } finally {
                conn.disconnect()
            }
        }.getOrDefault(FetchOutcome.Failure)
    }

    /** Loadpoint titles for the widget config picker, index-aligned to .loadpoints[]. */
    fun loadpointTitles(server: StoredServer): List<String> {
        val out = fetch(server, "[.loadpoints[].title]")
        if (out !is FetchOutcome.Success) return emptyList()
        return runCatching {
            val arr = org.json.JSONArray(out.json)
            (0 until arr.length()).map { i ->
                arr.optString(i).takeIf { it.isNotEmpty() && it != "null" } ?: "Loadpoint ${i + 1}"
            }
        }.getOrDefault(emptyList())
    }

    /** POST to an API path, e.g. "/api/loadpoints/1/mode/pv". Returns success. */
    fun post(server: StoredServer, path: String): Boolean {
        val p = if (path.startsWith("/")) path else "/$path"
        return runCatching {
            val conn = (URL(base(server) + p).openConnection() as HttpURLConnection).apply {
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                requestMethod = "POST"
                authorize(this, server)
            }
            try {
                conn.responseCode in 200..299
            } finally {
                conn.disconnect()
            }
        }.getOrDefault(false)
    }
}

/** Subset of /api/state .loadpoints[] used by the widget (see Loadpoint.swift). */
data class Loadpoint(
    val title: String?,
    val vehicleTitle: String?,
    val vehicleSoc: Double?,
    val effectiveLimitSoc: Double?,
    val chargePower: Double?,
    val mode: String?,
    val charging: Boolean,
    val connected: Boolean,
    val enabled: Boolean,
) {
    companion object {
        fun parse(json: String): Loadpoint? = runCatching {
            val o = JSONObject(json)
            fun d(k: String) = if (o.has(k) && !o.isNull(k)) o.optDouble(k) else null
            Loadpoint(
                title = o.optString("title").takeIf { it.isNotEmpty() },
                vehicleTitle = o.optString("vehicleTitle").takeIf { it.isNotEmpty() },
                vehicleSoc = d("vehicleSoc"),
                effectiveLimitSoc = d("effectiveLimitSoc"),
                chargePower = d("chargePower"),
                mode = o.optString("mode").takeIf { it.isNotEmpty() },
                charging = o.optBoolean("charging", false),
                connected = o.optBoolean("connected", false),
                enabled = o.optBoolean("enabled", false),
            )
        }.getOrNull()
    }
}
