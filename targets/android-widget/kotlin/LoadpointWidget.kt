package io.evcc.android.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
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
import androidx.glance.appwidget.updateAll
import androidx.glance.background
import androidx.glance.color.isNightMode
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
import io.evcc.android.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private fun deepLinkAction(uri: String): Action = actionStartActivity(Intent(Intent.ACTION_VIEW, Uri.parse(uri)))

/**
 * Loadpoint home-screen widget (Android counterpart of LoadpointWidget.swift /
 * LoadpointViews.swift's LoadpointCard). Uses the default server and the first
 * loadpoint; per-instance configuration (server + loadpoint picker) is set by
 * LoadpointWidgetConfigActivity.
 *
 * Two sizes, like iOS's systemSmall/systemMedium: compact shows the mode chips
 * inline below the metric (unlike iOS's compact layout, which only shows the
 * current mode as text - keeping the chips interactive here instead of
 * dropping mode-switching entirely for the smallest size); wide shows a
 * vertical mode-selector column alongside, mirroring LoadpointCard's
 * `HStack { left; modeSelector }`. Tapping the card opens the app to the
 * configured loadpoint (`evcc://loadpoint`, mirrors iOS's `widgetURL`); the
 * reload button and mode chips have their own clickable regions that take
 * priority over the card-wide deep link within their bounds.
 */
private val SMALL_SIZE = DpSize(180.dp, 110.dp)
private val WIDE_SIZE = DpSize(340.dp, 110.dp)

// Row measurements are unreliable right at a boundary on some launchers, so
// the switch-over threshold sits well below WIDE_SIZE's width.
private val WIDE_THRESHOLD = 260.dp
// visible (not private) so the config activities can reuse them for previews.
// mirrors Loadpoint.swift's `item()` closure: on smart-mode servers (detected
// by the presence of `alwaysCharge`) the same raw mode can carry a
// device-class-specific label (off->Normal, now->Boost/On) for continuous
// heat pumps / switchable devices.
fun modeLabel(context: Context, lp: Loadpoint, mode: String): String {
    val smartModeServer = lp.alwaysCharge != null
    if (smartModeServer) {
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

fun modes(lp: Loadpoint): List<String> = when {
    lp.alwaysCharge != null -> listOf("off", "smart", "now")
    lp.chargerFeatureSwitchDevice -> listOf("off", "pv", "now")
    else -> listOf("off", "pv", "minpv", "now")
}

class LoadpointWidget : GlanceAppWidget() {
    override val sizeMode = SizeMode.Responsive(setOf(SMALL_SIZE, WIDE_SIZE))

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
        provideContent { Content(context, state, resolved) }
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
    private fun Content(context: Context, state: LoadpointState, resolved: Pair<String?, Int>?) {
        val notConfigured = state == LoadpointState.NotConfigured
        // mirrors LoadpointView.deepLink in LoadpointViews.swift: always the
        // configured loadpoint (even in noData/unreachable, so the user can go
        // fix things in-app), "evcc://server" only when never configured at all.
        // A null serverId means the default server - the app resolves that on
        // its own, so the query param is simply omitted (mirrors iOS's
        // `if let id = entry.serverId`).
        val deepLink = resolved?.let { (serverId, lpIndex) ->
            "evcc://loadpoint?lp=$lpIndex" + (serverId?.let { "&server=$it" } ?: "")
        } ?: "evcc://server"
        Column(
            modifier = GlanceModifier.fillMaxSize()
                .background(if (notConfigured) notConfiguredBackground else cardBackground)
                .clickable(deepLinkAction(deepLink))
                .padding(12.dp),
            verticalAlignment = Alignment.Vertical.Top,
        ) {
            when (state) {
                is LoadpointState.Data -> LoadpointBody(context, state)
                LoadpointState.NoData -> MessageBody(
                    context.getString(R.string.widget_noData_title),
                    context.getString(R.string.widget_noData_body),
                )
                LoadpointState.Unreachable -> MessageBody(
                    context.getString(R.string.widget_unreachable_title),
                    context.getString(R.string.widget_unreachable_body),
                )
                LoadpointState.NotConfigured -> NotConfiguredBody(context)
            }
        }
    }

    @Composable
    private fun LoadpointBody(context: Context, state: LoadpointState.Data) {
        val wide = LocalSize.current.width >= WIDE_THRESHOLD
        if (wide) {
            Row(modifier = GlanceModifier.fillMaxSize()) {
                Column(modifier = GlanceModifier.defaultWeight().fillMaxHeight()) {
                    LoadpointInfo(context, state)
                }
                Spacer(GlanceModifier.width(14.dp))
                Column(modifier = GlanceModifier.width(116.dp).fillMaxHeight()) {
                    ModeSelectorColumn(context, state)
                }
            }
        } else {
            LoadpointInfo(context, state)
            Spacer(GlanceModifier.height(8.dp))
            ModeChipsRow(context, state)
        }
    }

    // main status/metric/power column, shared by both sizes (mirrors LoadpointCard's `left`)
    @Composable
    private fun LoadpointInfo(context: Context, state: LoadpointState.Data) {
        val lp = state.lp
        val s = status(lp)
        val m = metric(lp)
        val heating = lp.chargerFeatureHeating

        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
            Text(title(context, lp), style = titleStyle, modifier = GlanceModifier.defaultWeight())
            Image(
                provider = ImageProvider(R.drawable.ic_reload),
                contentDescription = null,
                colorFilter = ColorFilter.tint(textSecondary),
                modifier = GlanceModifier.width(13.dp).height(13.dp).clickable(actionRunCallback<ReloadAction>()),
            )
        }

        Row(modifier = GlanceModifier.padding(top = 3.dp), verticalAlignment = Alignment.Vertical.CenterVertically) {
            Box(modifier = GlanceModifier.width(7.dp).height(7.dp).background(statusColor(s.active, heating)).cornerRadius(4.dp)) {}
            Spacer(GlanceModifier.width(5.dp))
            Text(statusLabel(context, s, heating), style = statusStyle.copy(color = statusColor(s.active, heating)))
        }

        Spacer(GlanceModifier.height(6.dp))

        Row(verticalAlignment = Alignment.Vertical.Bottom) {
            Text(m.value, style = metricStyle)
            Text(" ${m.unit}", style = metricUnitStyle)
        }

        if (m.fill != null) {
            Spacer(GlanceModifier.height(6.dp))
            val dark = context.isNightMode
            Image(
                provider = ImageProvider(
                    ProgressBarRenderer.render(
                        fraction = m.fill,
                        fillColor = barFillColor(lp.connected, heating),
                        trackColor = barTrackColor(dark),
                        striped = s.active,
                        stripeColor = barStripeColor(heating),
                    ),
                ),
                contentDescription = null,
                modifier = GlanceModifier.fillMaxWidth().height(6.dp),
            )
        }

        Spacer(GlanceModifier.height(6.dp))

        val power = lp.chargePower?.let { Format.fmtW(it) } ?: "–"
        val (powerValue, powerUnit) = splitValueUnit(power)
        Row {
            Text(powerValue, style = powerStyle)
            Text(" $powerUnit", style = powerUnitStyle)
        }
    }

    // compact size: chips in a row below the metric (see class doc for why this
    // stays interactive here, unlike iOS's compact-size plain-text mode label)
    @Composable
    private fun ModeChipsRow(context: Context, state: LoadpointState.Data) {
        Row {
            modes(state.lp).forEachIndexed { i, mode ->
                if (i > 0) Spacer(GlanceModifier.width(4.dp))
                ModeChip(context, lp = state.lp, mode = mode, serverId = state.serverId, lpIndex = state.lpIndex)
            }
        }
    }

    // wide size: a vertical column of full-width chips (mirrors modeSelector in LoadpointViews.swift).
    // A ColumnScope extension (not just called within one) so defaultWeight() resolves below.
    @Composable
    private fun ColumnScope.ModeSelectorColumn(context: Context, state: LoadpointState.Data) {
        modes(state.lp).forEachIndexed { i, mode ->
            if (i > 0) Spacer(GlanceModifier.height(6.dp))
            ModeChip(
                context, lp = state.lp, mode = mode, serverId = state.serverId, lpIndex = state.lpIndex,
                modifier = GlanceModifier.fillMaxWidth().defaultWeight(),
            )
        }
    }

    @Composable
    private fun ModeChip(
        context: Context,
        lp: Loadpoint,
        mode: String,
        serverId: String,
        lpIndex: Int,
        modifier: GlanceModifier = GlanceModifier,
    ) {
        val selected = mode == lp.mode
        Box(
            modifier = modifier
                .background(if (selected) modeSelectedBackground else modeUnselectedBackground)
                .cornerRadius(9.dp)
                .padding(horizontal = 8.dp, vertical = 5.dp)
                .clickable(
                    actionRunCallback<ModeAction>(
                        actionParametersOf(
                            ModeAction.serverKey to serverId,
                            ModeAction.lpKey to (lpIndex + 1), // API is 1-based
                            ModeAction.modeKey to mode,
                        ),
                    ),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = modeChipLabel(context, lp, mode),
                style = modeChipStyle.copy(color = if (selected) modeSelectedText else modeUnselectedText),
            )
        }
    }

    @Composable
    private fun MessageBody(title: String, message: String) {
        Column(
            modifier = GlanceModifier.fillMaxSize(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
        ) {
            Text(title, style = messageTitleStyle)
            Text(message, style = messageBodyStyle)
        }
    }

    @Composable
    private fun NotConfiguredBody(context: Context) {
        Column(
            modifier = GlanceModifier.fillMaxSize(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
        ) {
            Text(context.getString(R.string.widget_setup_title), style = notConfiguredTitleStyle)
            Text(context.getString(R.string.widget_setup_body), style = notConfiguredBodyStyle)
        }
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
        LoadpointWidget().updateAll(context)
    }

    companion object {
        val serverKey = ActionParameters.Key<String>("serverId")
        val lpKey = ActionParameters.Key<Int>("lp")
        val modeKey = ActionParameters.Key<String>("mode")
    }
}

/** Forces a fresh fetch, mirrors iOS's ReloadIntent (WidgetCenter.shared.reloadAllTimelines()). */
class ReloadAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        LoadpointWidget().updateAll(context)
    }
}

class EvccLoadpointWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = LoadpointWidget()
}
