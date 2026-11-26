package io.evcc.wear

import android.util.Base64
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.concurrent.ConcurrentHashMap

sealed interface FetchOutcome {
    data class Success(val json: String) : FetchOutcome
    object NoData : FetchOutcome   // reachable, but the jq slice is null / empty
    object Failure : FetchOutcome  // network or auth error
}

/**
 * Minimal evcc API client: GET jq slices of /api/state and POST actions, with
 * optional basic auth. Core logic ported verbatim from
 * targets/android-widget/kotlin/ApiClient.kt (widget #255), operating on the
 * phone-synced [SyncedServer] (see ServerStore.kt).
 * Runs on a background thread (call from a coroutine).
 *
 * Unlike the iOS watch app (targets/_shared/ApiClient.swift upstream), this
 * does not resolve a `.local` hostname to a fallback IP: the Android widget
 * (#255) this is ported from doesn't do it either, and StoredServer/SyncedServer
 * have no fallbackUrl field to carry one. Revisit together if `.local`
 * unreachability turns out to be a real problem on either Android surface.
 */
object ApiClient {
    private const val TIMEOUT_MS = 15_000

    private fun base(server: SyncedServer): String = server.url.trimEnd('/')

    // evcc blocks remote logins after 10 failures per minute: after a 401/429,
    // pause requests to that server for a minute instead of adding to it. Same
    // as targets/android-widget/kotlin/ApiClient.kt (#255) - more important
    // here since the app polls every 10s instead of every 30min.
    private val backoffUntil = ConcurrentHashMap<String, Long>()

    private fun backoffKey(server: SyncedServer) = "${base(server)}|${server.username}"

    private fun backedOff(server: SyncedServer) =
        System.currentTimeMillis() < (backoffUntil[backoffKey(server)] ?: 0L)

    private fun status(conn: HttpURLConnection, server: SyncedServer): Int {
        val code = conn.responseCode
        if (code == 401 || code == 429) {
            backoffUntil[backoffKey(server)] = System.currentTimeMillis() + 60_000
        }
        return code
    }

    private fun authorize(conn: HttpURLConnection, server: SyncedServer) {
        if (server.authRequired && !server.username.isNullOrEmpty() && server.password != null) {
            val token = Base64.encodeToString(
                "${server.username}:${server.password}".toByteArray(),
                Base64.NO_WRAP,
            )
            conn.setRequestProperty("Authorization", "Basic $token")
        }
    }

    /** GET /api/state?jq=<jq>. Returns the raw response body on success. */
    fun fetch(server: SyncedServer, jq: String): FetchOutcome {
        if (backedOff(server)) return FetchOutcome.Failure
        val url = "${base(server)}/api/state?jq=" + URLEncoder.encode(jq, "UTF-8")
        return runCatching {
            val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                requestMethod = "GET"
                authorize(this, server)
            }
            try {
                if (status(conn, server) !in 200..299) return FetchOutcome.Failure
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

    /** GET the site overview (production, consumption, grid, battery, loadpoints). */
    fun site(server: SyncedServer): FetchOutcome = fetch(server, SiteState.JQ)

    /** POST to an API path, e.g. "/api/loadpoints/1/mode/pv". Returns success. */
    fun post(server: SyncedServer, path: String): Boolean {
        if (backedOff(server)) return false
        val p = if (path.startsWith("/")) path else "/$path"
        return runCatching {
            val conn = (URL(base(server) + p).openConnection() as HttpURLConnection).apply {
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                requestMethod = "POST"
                authorize(this, server)
            }
            try {
                status(conn, server) in 200..299
            } finally {
                conn.disconnect()
            }
        }.getOrDefault(false)
    }

    /** POST loadpoint mode. `index` is the 0-based UI index; the API path is 1-based. */
    fun setMode(server: SyncedServer, index: Int, mode: String): Boolean =
        post(server, "/api/loadpoints/${index + 1}/mode/$mode")
}
