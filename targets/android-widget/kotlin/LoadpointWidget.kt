package io.evcc.android.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.layout.ContentScale
import androidx.glance.ImageProvider
import androidx.glance.action.Action
import androidx.glance.action.ActionParameters
import androidx.glance.action.actionParametersOf
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.LocalSize
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ColumnScope
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import io.evcc.android.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

// not private: ForecastWidget.kt uses the identical helper for its own deep link
fun deepLinkAction(uri: String): Action = actionStartActivity(Intent(Intent.ACTION_VIEW, Uri.parse(uri)))

/**
 * Loadpoint home-screen widget, Android counterpart of LoadpointWidget.swift /
 * LoadpointViews.swift's LoadpointCard. Per-instance server + loadpoint come
 * from LoadpointWidgetConfigActivity.
 *
 * Always one launcher cell high; the width decides how much is shown:
 * 1x1/2x1 SoC + power, 3x1 adds name and status, 4x1 the mode selector
 * docked into the card's right edge. Tapping the
 * card opens the app on the configured loadpoint; the reload icon and the
 * mode buttons have their own clickable regions.
 */
private enum class WidthClass { ONE, TWO, THREE, FOUR }

// launcher cells run ~80-100dp wide; thresholds sit between the n-cell widths
private fun widthClass(width: Dp): WidthClass = when {
    width < 130.dp -> WidthClass.ONE
    width < 220.dp -> WidthClass.TWO
    width < 310.dp -> WidthClass.THREE
    else -> WidthClass.FOUR
}

val DOCK_WIDTH_3 = 96.dp // vertical stack
val DOCK_WIDTH_4 = 150.dp // 2x2 grid, "Min+Solar" must fit
private val STRIP_HEIGHT = 6.dp
val CARD_RADIUS = 20.dp // not private: ForecastWidget.kt's card uses the same radius
val MAX_CARD_HEIGHT = 84.dp

// alwaysCharge exists since the smart-mode redesign; its presence tells
// new servers (off/smart/now) from old ones (off/pv/minpv/now).
// Mirrors Loadpoint.swift's `item()` / `modeList`.
fun smartModeServer(lp: Loadpoint): Boolean = lp.alwaysCharge != null

fun modes(lp: Loadpoint): List<String> = when {
    smartModeServer(lp) -> listOf("off", "smart", "now")
    lp.chargerFeatureSwitchDevice -> listOf("off", "pv", "now")
    else -> listOf("off", "pv", "minpv", "now")
}

// the same raw mode carries a device-class label (off->Normal, now->Boost/On)
// for continuous heat pumps / switchable devices, smart-mode servers only
fun modeLabel(context: Context, lp: Loadpoint, mode: String): String {
    if (smartModeServer(lp)) {
        if (mode == "off" && lp.chargerFeatureContinuous) return context.getString(R.string.widget_mode_normal)
        if (mode == "now") {
            if (lp.chargerFeatureContinuous) return context.getString(R.string.widget_mode_boost)
            if (lp.chargerFeatureSwitchDevice) return context.getString(R.string.widget_mode_on)
        }
    }
    return when (mode) {
        "off" -> context.getString(R.string.widget_mode_off)
        "smart" -> context.getString(R.string.widget_mode_smart)
        "pv" -> context.getString(R.string.widget_mode_pv)
        "minpv" -> context.getString(R.string.widget_mode_minpv)
        "now" -> context.getString(R.string.widget_mode_now)
        else -> mode
    }
}

fun alwaysChargeActive(lp: Loadpoint): Boolean = lp.alwaysCharge == "on" || lp.alwaysCharge == "once"

// label plus a read-only "∞" marker on the Smart chip when Always charge is
// on/once (mirrors the SF Symbol "infinity" shown next to Smart in
// LoadpointViews.swift; no toggle in the widget for now, matches iOS)
fun modeChipLabel(context: Context, lp: Loadpoint, mode: String): String {
    val label = modeLabel(context, lp, mode)
    return if (mode == "smart" && alwaysChargeActive(lp)) "$label ∞" else label
}

enum class LpStatus(val active: Boolean) {
    DISCONNECTED(false), CONNECTED(false), WAIT_FOR_VEHICLE(false), FINISHED(false), CHARGING(true), HEATING(true),
}

data class Metric(val value: String, val unit: String, val fill: Double?)

private sealed interface LoadpointState {
    data class Data(val lp: Loadpoint, val serverId: String, val lpIndex: Int) : LoadpointState
    object NoData : LoadpointState
    object Unreachable : LoadpointState
    object NotConfigured : LoadpointState
}

// mirrors LoadpointVM.build's status derivation in Loadpoint.swift
fun status(lp: Loadpoint): LpStatus {
    val heating = lp.chargerFeatureHeating
    val soc = lp.vehicleSoc ?: 0.0
    val limit = lp.effectiveLimitSoc ?: 0.0
    return when {
        !lp.connected -> LpStatus.DISCONNECTED
        lp.charging -> if (heating) LpStatus.HEATING else LpStatus.CHARGING
        lp.enabled -> if (limit > 0 && soc >= limit) LpStatus.FINISHED else LpStatus.WAIT_FOR_VEHICLE
        else -> LpStatus.CONNECTED
    }
}

// mirrors LoadpointStatus.labelKey(heating:) resolved against evcc's own
// main.vehicleStatus.* / main.heatingStatus.* translations
fun statusLabel(context: Context, s: LpStatus, heating: Boolean): String = context.getString(
    when (s) {
        LpStatus.DISCONNECTED -> R.string.widget_lpstatus_disconnected
        LpStatus.CONNECTED -> if (heating) R.string.widget_lpheat_connected else R.string.widget_lpstatus_connected
        LpStatus.WAIT_FOR_VEHICLE ->
            if (heating) R.string.widget_lpheat_waitForVehicle else R.string.widget_lpstatus_waitForVehicle
        LpStatus.FINISHED -> R.string.widget_lpstatus_finished
        LpStatus.CHARGING -> R.string.widget_lpstatus_charging
        LpStatus.HEATING -> R.string.widget_lpheat_charging
    },
)

// mirrors LoadpointVM.build's metricValue/metricUnit/fill derivation
fun metric(lp: Loadpoint): Metric {
    val heating = lp.chargerFeatureHeating
    val soc = lp.vehicleSoc ?: 0.0
    return when {
        heating -> {
            val minT = lp.ui?.minTemp ?: 0.0
            val maxT = lp.ui?.maxTemp ?: 100.0
            val fill = if (maxT > minT) ((soc - minT) / (maxT - minT)).coerceIn(0.0, 1.0) else null
            Metric(Format.fmtNumber(soc, 1), "°C", fill)
        }
        soc > 0 -> Metric(Format.fmtNumber(soc, 0), "%", (soc / 100).coerceIn(0.0, 1.0))
        else -> {
            val kWh = ((lp.chargedEnergy ?: lp.sessionEnergy ?: 0.0)) / 1000
            Metric(Format.fmtNumber(kWh, 1), "kWh", null)
        }
    }
}

fun title(context: Context, lp: Loadpoint): String {
    val vt = lp.vehicleTitle?.trim().orEmpty()
    return vt.ifEmpty { lp.title ?: context.getString(R.string.widget_loadpoint_name) }
}

// Per-instance Glance state (DataStore, cleared by Glance when the widget is removed).
val SERVER_KEY = stringPreferencesKey("server") // absent = default server
val LP_KEY = intPreferencesKey("lp") // absent = not configured yet
private val REFRESH_KEY = longPreferencesKey("refresh")

class LoadpointWidget : GlanceAppWidget() {
    override val sizeMode = SizeMode.Exact
    override val stateDefinition = PreferencesGlanceStateDefinition

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        // A running Glance session serves update() by recomposing with the new
        // state, not by calling provideGlance again. So: load once up front for
        // the first frame, then reload inside the composition whenever the
        // state (config or refresh nonce) changes.
        val initialPrefs = getAppWidgetState<Preferences>(context, id)
        val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
        val initial = load(context, initialPrefs)
        provideContent {
            val prefs = currentState<Preferences>()
            var state by remember { mutableStateOf(initial) }
            LaunchedEffect(prefs) {
                if (prefs != initialPrefs) state = load(context, prefs)
            }
            Content(context, state, prefs[LP_KEY]?.let { prefs[SERVER_KEY] to it }, appWidgetId)
        }
    }

    private suspend fun load(context: Context, prefs: Preferences): LoadpointState = withContext(Dispatchers.IO) {
        val lpIndex = prefs[LP_KEY] ?: return@withContext LoadpointState.NotConfigured
        val server = SharedStore.server(context, prefs[SERVER_KEY]) ?: return@withContext LoadpointState.NotConfigured
        when (val out = ApiClient.fetch(server, ".loadpoints[$lpIndex]")) {
            is FetchOutcome.Success ->
                Loadpoint.parse(out.json)?.let { LoadpointState.Data(it, server.id, lpIndex) }
                    ?: LoadpointState.NoData
            FetchOutcome.NoData -> LoadpointState.NoData
            FetchOutcome.Failure -> LoadpointState.Unreachable
        }
    }

    companion object {
        /** Re-fetch every placed widget (mirrors iOS's reloadAllTimelines). */
        suspend fun refreshAll(context: Context) {
            val widget = LoadpointWidget()
            for (id in GlanceAppWidgetManager(context).getGlanceIds(LoadpointWidget::class.java)) {
                updateAppWidgetState(context, id) { it[REFRESH_KEY] = System.currentTimeMillis() }
                widget.update(context, id)
            }
        }
    }

    @Composable
    private fun Content(context: Context, state: LoadpointState, resolved: Pair<String?, Int>?, appWidgetId: Int) {
        val notConfigured = state == LoadpointState.NotConfigured
        // mirrors LoadpointView.deepLink in LoadpointViews.swift: always the
        // configured loadpoint (even in noData/unreachable, so the user can go
        // fix things in-app). lp is 1-based like the web UI. A null serverId means the default server, so the
        // query param is omitted. Unconfigured (e.g. the server was deleted in the app) reopens the picker.
        val tap = if (notConfigured) {
            actionStartActivity(
                Intent(context, LoadpointWidgetConfigActivity::class.java)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId),
            )
        } else {
            val (serverId, lpIndex) = resolved!!
            deepLinkAction("evcc://loadpoint?lp=${lpIndex + 1}" + (serverId?.let { "&server=$it" } ?: ""))
        }
        // launcher cells vary in height; cap the card and center it in the cell
        val size = LocalSize.current
        Box(modifier = GlanceModifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Box(
                modifier = GlanceModifier.fillMaxWidth().height(minOf(size.height, MAX_CARD_HEIGHT))
                    .background(if (notConfigured) notConfiguredBackground else cardBackground)
                    .cornerRadius(CARD_RADIUS)
                    .clickable(tap),
            ) {
                val w = widthClass(size.width)
                when (state) {
                    is LoadpointState.Data -> LoadpointBody(context, state, w)
                    LoadpointState.NoData -> MessageBody(
                        context.getString(R.string.widget_noData_title),
                        context.getString(R.string.widget_noData_body),
                        w,
                        reload = true,
                    )
                    LoadpointState.Unreachable -> MessageBody(
                        context.getString(R.string.widget_unreachable_title),
                        context.getString(R.string.widget_unreachable_body),
                        w,
                        reload = true,
                    )
                    LoadpointState.NotConfigured -> MessageBody(
                        context.getString(R.string.widget_setup_title),
                        context.getString(R.string.widget_androidConfig_setupBody),
                        w,
                        notConfigured = true,
                    )
                }
            }
        }
    }

    @Composable
    private fun LoadpointBody(context: Context, state: LoadpointState.Data, w: WidthClass) {
        val lp = state.lp
        Row(modifier = GlanceModifier.fillMaxSize()) {
            Box(modifier = GlanceModifier.defaultWeight().fillMaxHeight()) {
                val pad = if (w == WidthClass.ONE) 6.dp else 12.dp
                // symmetric: content centers on the card, the strip overlays the bottom padding
                Box(modifier = GlanceModifier.fillMaxSize().padding(horizontal = pad, vertical = 6.dp)) {
                    when (w) {
                        WidthClass.ONE -> InfoCompact(lp, small = true)
                        WidthClass.TWO -> InfoCompact(lp, small = false)
                        else -> InfoWide(context, lp)
                    }
                }
                if (w >= WidthClass.THREE) ReloadIcon()
                // progress as a thin strip along the card's bottom edge; on 4x1 it ends at the mode dock
                stripBitmap(lp)?.let { bitmap ->
                    Box(modifier = GlanceModifier.fillMaxSize(), contentAlignment = Alignment.BottomStart) {
                        Spacer(GlanceModifier.fillMaxWidth().height(STRIP_HEIGHT).background(barTrack))
                        Image(
                            provider = ImageProvider(bitmap),
                            contentDescription = null,
                            contentScale = ContentScale.FillBounds,
                            modifier = GlanceModifier.fillMaxWidth().height(STRIP_HEIGHT),
                        )
                    }
                }
            }
            if (w == WidthClass.FOUR) ModeDock(context, state)
        }
    }

    // 1x1 / 2x1: SoC + power only, centered. Too tight for name or status text.
    @Composable
    private fun InfoCompact(lp: Loadpoint, small: Boolean) {
        // Stacked in a Column the value's font padding leaves a big gap above
        // the power. Instead both are centered independently and nudged apart
        // by their padding, so the power sits right under the glyphs.
        val power = lp.chargePower?.takeIf { it > 0 }?.let { Format.fmtW(it) }
        Box(modifier = GlanceModifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Box(modifier = GlanceModifier.padding(bottom = if (power == null) 0.dp else if (small) 18.dp else 22.dp)) {
                MetricText(metric(lp), small = small)
            }
            if (power != null) {
                Text(
                    power,
                    style = if (small) secondaryStyle else powerCompactLargeStyle,
                    maxLines = 1,
                    modifier = GlanceModifier.padding(top = if (small) 18.dp else 32.dp),
                )
            }
        }
    }

    // 3x1 and up: big SoC first, then name + status block. The status line
    // carries the power ("7.1 kW, Charging…", only when non-zero).
    @Composable
    private fun InfoWide(context: Context, lp: Loadpoint) {
        val s = status(lp)
        val heating = lp.chargerFeatureHeating
        val color = statusColor(s.active, heating)
        val power = lp.chargePower?.takeIf { it > 0 }?.let { Format.fmtW(it) }
        val line = listOfNotNull(power, statusLabel(context, s, heating)).joinToString(", ")
        Row(modifier = GlanceModifier.fillMaxSize(), verticalAlignment = Alignment.Vertical.CenterVertically) {
            MetricText(metric(lp))
            Spacer(GlanceModifier.width(14.dp))
            Column(modifier = GlanceModifier.defaultWeight()) {
                // only the title can collide with the reload icon; the status line runs the full width
                Text(title(context, lp), style = titleStyle, maxLines = 1, modifier = GlanceModifier.padding(end = 18.dp))
                Row(modifier = GlanceModifier.padding(top = 2.dp), verticalAlignment = Alignment.Vertical.CenterVertically) {
                    Box(modifier = GlanceModifier.width(7.dp).height(7.dp).background(color).cornerRadius(4.dp)) {}
                    Spacer(GlanceModifier.width(5.dp))
                    Text(line, style = statusStyle.copy(color = color), maxLines = 1)
                }
            }
        }
    }

    // Glance has no baseline alignment: bottom-align and lift the unit by the
    // descent difference (≈0.24em for Roboto) to fake one.
    @Composable
    private fun MetricText(m: Metric, small: Boolean = false) {
        Row(verticalAlignment = Alignment.Vertical.Bottom) {
            Text(m.value, style = if (small) metricSmallStyle else metricLargeStyle, maxLines = 1)
            Text(
                " ${m.unit}",
                style = if (small) metricUnitSmallStyle else metricUnitStyle,
                maxLines = 1,
                modifier = GlanceModifier.padding(bottom = if (small) 3.dp else 6.dp),
            )
        }
    }

    // Mode buttons docked flush into the card's right edge (the card's corner
    // radius clips them): 3 modes stack vertically, the legacy 4 form a 2x2 grid.
    @Composable
    private fun ModeDock(context: Context, state: LoadpointState.Data) {
        val modes = modes(state.lp)
        val grid = modes.size == 4
        Column(
            modifier = GlanceModifier.width(if (grid) DOCK_WIDTH_4 else DOCK_WIDTH_3).fillMaxHeight().background(modeUnselectedBackground),
        ) {
            if (grid) {
                DockRow(context, state, modes.subList(0, 2))
                Spacer(GlanceModifier.fillMaxWidth().height(1.dp).background(cardBackground))
                DockRow(context, state, modes.subList(2, 4))
            } else {
                modes.forEachIndexed { i, mode ->
                    if (i > 0) Spacer(GlanceModifier.fillMaxWidth().height(1.dp).background(cardBackground))
                    DockButton(context, state, mode, GlanceModifier.fillMaxWidth().defaultWeight())
                }
            }
        }
    }

    @Composable
    private fun ColumnScope.DockRow(context: Context, state: LoadpointState.Data, modes: List<String>) {
        Row(modifier = GlanceModifier.fillMaxWidth().defaultWeight()) {
            DockButton(context, state, modes[0], GlanceModifier.fillMaxHeight().defaultWeight())
            Spacer(GlanceModifier.fillMaxHeight().width(1.dp).background(cardBackground))
            DockButton(context, state, modes[1], GlanceModifier.fillMaxHeight().defaultWeight())
        }
    }

    @Composable
    private fun DockButton(context: Context, state: LoadpointState.Data, mode: String, modifier: GlanceModifier) {
        val selected = mode == state.lp.mode
        Box(
            modifier = modifier
                .background(if (selected) modeSelectedBackground else modeUnselectedBackground)
                .clickable(
                    actionRunCallback<ModeAction>(
                        actionParametersOf(
                            ModeAction.serverKey to state.serverId,
                            ModeAction.lpKey to (state.lpIndex + 1), // API is 1-based
                            ModeAction.modeKey to mode,
                        ),
                    ),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = modeChipLabel(context, state.lp, mode),
                style = (if (selected) modeSelectedStyle else modeUnselectedStyle),
                maxLines = 1,
            )
        }
    }

    @Composable
    private fun ReloadIcon() {
        Box(modifier = GlanceModifier.fillMaxSize().padding(top = 8.dp, end = 10.dp), contentAlignment = Alignment.TopEnd) {
            Image(
                provider = ImageProvider(R.drawable.ic_reload),
                contentDescription = null,
                colorFilter = ColorFilter.tint(textSecondary),
                modifier = GlanceModifier.width(15.dp).height(15.dp).clickable(actionRunCallback<ReloadAction>()),
            )
        }
    }

    /** Centered title + body; 1x1 has room for the title only, so it may wrap instead. */
    @Composable
    private fun MessageBody(title: String, message: String, w: WidthClass, notConfigured: Boolean = false, reload: Boolean = false) {
        val center = TextAlign.Center
        Column(
            modifier = GlanceModifier.fillMaxSize().padding(horizontal = 12.dp),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
        ) {
            val titleOnly = w == WidthClass.ONE
            Text(
                title,
                style = (if (notConfigured) notConfiguredTitleStyle else titleStyle).copy(textAlign = center),
                maxLines = if (titleOnly) 2 else 1,
            )
            if (!titleOnly) {
                Text(message, style = (if (notConfigured) notConfiguredBodyStyle else secondaryStyle).copy(textAlign = center), maxLines = 2)
            }
        }
        if (reload) ReloadIcon()
    }
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
        LoadpointWidget.refreshAll(context)
    }

    companion object {
        val serverKey = ActionParameters.Key<String>("serverId")
        val lpKey = ActionParameters.Key<Int>("lp")
        val modeKey = ActionParameters.Key<String>("mode")
    }
}

/** Forces a fresh fetch, mirrors iOS's ReloadIntent. */
class ReloadAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        LoadpointWidget.refreshAll(context)
    }
}

class EvccLoadpointWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = LoadpointWidget()
}
