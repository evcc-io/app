package io.evcc.wear

import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.guava.future
import kotlinx.coroutines.withContext

/**
 * Wear OS tile for one evcc loadpoint - the glanceable, swipe-from-watch-face
 * surface, closest Wear OS equivalent of the iOS watch app's complications
 * (evcc-io/app#349's LoadpointComplication.swift). Shows the phone's default
 * server (its active server, or the first synced one) and its first connected
 * loadpoint, falling back to loadpoint 0. Tapping it opens the app, where the
 * mode can actually be changed (v1 doesn't act on tile taps - see
 * targets/wear/PLAN.md for the planned v2 scope: per-instance tile config and
 * a direct mode-switch action on the tile itself).
 */
class LoadpointTileService : TileService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onTileRequest(
        requestParams: RequestBuilders.TileRequest,
    ): ListenableFuture<TileBuilders.Tile> = scope.future {
        val state = loadState()
        val layout = LoadpointTileLayout.build(this@LoadpointTileService, state)
        TileBuilders.Tile.Builder()
            .setResourcesVersion(RESOURCES_VERSION)
            .setFreshnessIntervalMillis(REFRESH_INTERVAL_MS)
            .setTileTimeline(
                TimelineBuilders.Timeline.Builder()
                    .addTimelineEntry(
                        TimelineBuilders.TimelineEntry.Builder().setLayout(
                            LayoutElementBuilders.Layout.Builder().setRoot(layout).build(),
                        ).build(),
                    )
                    .build(),
            )
            .build()
    }

    override fun onTileResourcesRequest(
        requestParams: RequestBuilders.ResourcesRequest,
    ): ListenableFuture<ResourceBuilders.Resources> = scope.future {
        ResourceBuilders.Resources.Builder().setVersion(RESOURCES_VERSION).build()
    }

    private suspend fun loadState(): TileState {
        val server = ServerStore.current(this@LoadpointTileService).selected ?: return TileState.NotConfigured
        val out = withContext(Dispatchers.IO) { ApiClient.site(server) }
        val loadpoints = (out as? FetchOutcome.Success)?.json?.let { SiteState.parse(it)?.loadpoints }
            ?.filterNot { it.disabled }
        if (loadpoints.isNullOrEmpty()) {
            return if (out is FetchOutcome.Success) TileState.NoData else TileState.Unreachable
        }
        val index = loadpoints.indexOfFirst { it.connected }.let { if (it < 0) 0 else it }
        return TileState.Data(loadpoints[index])
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.coroutineContext[Job]?.cancel()
    }

    companion object {
        private const val RESOURCES_VERSION = "1"
        private const val REFRESH_INTERVAL_MS = 15L * 60 * 1000 // 15 min
    }
}

/** Mirrors LoadpointWidget.kt's private LoadpointState (widget #255). */
sealed interface TileState {
    data class Data(val lp: Loadpoint) : TileState
    object NoData : TileState
    object Unreachable : TileState
    object NotConfigured : TileState
}
