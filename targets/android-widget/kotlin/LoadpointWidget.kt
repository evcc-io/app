package io.evcc.android.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.ActionParameters
import androidx.glance.action.actionParametersOf
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.updateAll
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.text.Text
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Loadpoint home-screen widget (Android counterpart of LoadpointWidget.swift).
 *
 * Spike scope: uses the default server and the first loadpoint. Per-instance
 * configuration (server + loadpoint picker) is a follow-up via a widget
 * configuration Activity — see targets/android-widget/README.md.
 */
private sealed interface LoadpointState {
    data class Data(val lp: Loadpoint, val serverId: String, val lpIndex: Int) : LoadpointState
    object NoData : LoadpointState
    object Unreachable : LoadpointState
    object NotConfigured : LoadpointState
}

class LoadpointWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        // per-instance config (server + loadpoint) written by LoadpointWidgetConfigActivity,
        // keyed by the appWidgetId this glanceId maps to.
        val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
        val resolved = WidgetConfig.resolve(context, appWidgetId)
        val state = if (resolved == null) {
            LoadpointState.NotConfigured
        } else {
            val (serverId, lpIndex) = resolved
            load(context, serverId, lpIndex)
        }
        provideContent { Content(state) }
    }

    private suspend fun load(context: Context, serverId: String?, lpIndex: Int): LoadpointState = withContext(Dispatchers.IO) {
        val server = SharedStore.server(context, serverId) ?: return@withContext LoadpointState.NotConfigured
        when (val out = ApiClient.fetch(server, ".loadpoints[$lpIndex]")) {
            is FetchOutcome.Success ->
                Loadpoint.parse(out.json)?.let { LoadpointState.Data(it, server.id, lpIndex) }
                    ?: LoadpointState.NoData
            FetchOutcome.NoData -> LoadpointState.NoData
            FetchOutcome.Failure -> LoadpointState.Unreachable
        }
    }

    @Composable
    private fun Content(state: LoadpointState) {
        Column(
            modifier = GlanceModifier.fillMaxSize().padding(12.dp),
            verticalAlignment = Alignment.Vertical.Top,
        ) {
            when (state) {
                is LoadpointState.Data -> LoadpointBody(state)
                LoadpointState.NoData -> Text("No data", style = subtle)
                LoadpointState.Unreachable -> Text("Unreachable", style = subtle)
                LoadpointState.NotConfigured -> Text("Open the app to set up", style = subtle)
            }
        }
    }

    @Composable
    private fun LoadpointBody(state: LoadpointState.Data) {
        val lp = state.lp
        Text(lp.title ?: lp.vehicleTitle ?: "Loadpoint", style = titleStyle)
        val soc = lp.vehicleSoc?.let { "${it.toInt()}%" }
        val power = lp.chargePower?.let { formatPower(it) }
        Text(listOfNotNull(statusLabel(lp), soc).joinToString(" · "), style = subtle)
        if (power != null) Text(power, style = titleStyle)

        // interactive mode buttons (charging control), like the iOS widget
        Row(modifier = GlanceModifier.padding(top = 8.dp)) {
            for (mode in listOf("off", "pv", "minpv", "now")) {
                ModeButton(mode = mode, current = lp.mode, serverId = state.serverId, lpIndex = state.lpIndex)
            }
        }
    }

    @Composable
    private fun ModeButton(mode: String, current: String?, serverId: String, lpIndex: Int) {
        val selected = mode == current
        Text(
            text = mode,
            style = if (selected) titleStyle else subtle,
            modifier = GlanceModifier
                .padding(horizontal = 6.dp, vertical = 4.dp)
                .clickable(
                    actionRunCallback<ModeAction>(
                        actionParametersOf(
                            ModeAction.serverKey to serverId,
                            ModeAction.lpKey to (lpIndex + 1), // API is 1-based
                            ModeAction.modeKey to mode,
                        ),
                    ),
                ),
        )
    }

    private fun statusLabel(lp: Loadpoint): String = when {
        lp.charging -> "Charging"
        lp.connected -> "Connected"
        else -> "Disconnected"
    }

    private fun formatPower(w: Double): String =
        if (w >= 1000) String.format("%.1f kW", w / 1000) else "${w.toInt()} W"
}

/** Applies a charge mode from a widget button, then refreshes the widget. */
class ModeAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val serverId = parameters[serverKey]
        val lp = parameters[lpKey] ?: return
        val mode = parameters[modeKey] ?: return
        val server = SharedStore.server(context, serverId) ?: return
        withContext(Dispatchers.IO) {
            ApiClient.post(server, "/api/loadpoints/$lp/mode/$mode")
        }
        LoadpointWidget().updateAll(context)
    }

    companion object {
        val serverKey = ActionParameters.Key<String>("serverId")
        val lpKey = ActionParameters.Key<Int>("lp")
        val modeKey = ActionParameters.Key<String>("mode")
    }
}

class EvccLoadpointWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = LoadpointWidget()
}
