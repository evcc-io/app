package io.evcc.android.widget

import android.content.Context
import android.graphics.Bitmap
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.Text
import androidx.glance.unit.ColorProvider
import io.evcc.android.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * Forecast home-screen widgets (Android counterpart of ForecastWidget.swift /
 * Views.swift's SolarCard/SeriesCard): Solar, Price, CO₂ and Feed-in. Glance
 * has no chart primitive, so the 48h series is rendered to a Bitmap (see
 * [ChartRenderer]) and shown via Image, alongside a two-column header and a
 * colored/bold footer.
 *
 * Per-instance config (server, and for Solar the "adjust to real production"
 * toggle) is set by ForecastWidgetConfigActivity, keyed by appWidgetId. The
 * data-fetching functions below (loadForecastState and friends) are top-level,
 * not GlanceAppWidget instance methods, so ForecastWidgetConfigActivity can
 * reuse them for its live preview without duplicating the parsing logic.
 */
// Titles mirror evcc's own forecast.type.*/widget.type.* strings (see Configuration.swift).
enum class ForecastKind {
    SOLAR, PRICE, CO2, FEEDIN;

    fun title(context: Context): String = context.getString(
        when (this) {
            SOLAR -> R.string.widget_type_solar
            PRICE -> R.string.widget_type_price
            CO2 -> R.string.widget_type_co2
            FEEDIN -> R.string.widget_type_feedin
        },
    )
}

data class FooterSide(val prefix: String? = null, val emphasis: String, val label: String? = null)

sealed interface ForecastState {
    data class Data(
        val value: String,
        val unit: String,
        val chart: Bitmap,
        val footerLeft: FooterSide,
        val footerRight: FooterSide,
    ) : ForecastState
    object NoData : ForecastState
    object Unreachable : ForecastState
    object NotConfigured : ForecastState
}

private const val WINDOW_MS = 48L * 3600 * 1000
private const val MAX_POINTS = 200

/** Cap the number of chart points by striding, keeping value/time index-aligned. */
private fun downsampleIndices(size: Int): List<Int> {
    if (size <= MAX_POINTS) return (0 until size).toList()
    val step = size.toDouble() / MAX_POINTS
    return (0 until MAX_POINTS).map { (it * step).toInt() }
}

private fun chart(context: Context, kind: ForecastKind, values: List<Double>, times: List<Long>, chartKind: ChartKind): Bitmap {
    val idx = downsampleIndices(values.size)
    val p = palette(kind)
    return ChartRenderer.render(
        context, idx.map { values[it] }, idx.map { times[it] }, chartKind,
        p.accentDay.toArgb(), p.accentNight.toArgb(),
    )
}

/** Fetches and parses the forecast state for `kind` from `server`. Runs network I/O - call off the main thread. */
fun loadForecastState(context: Context, kind: ForecastKind, server: StoredServer, adjust: Boolean): ForecastState = when (kind) {
    ForecastKind.SOLAR -> solar(context, server, adjust)
    ForecastKind.PRICE -> series(context, kind, server, "{currency:.currency,slots:.forecast.grid}")
    ForecastKind.FEEDIN -> series(context, kind, server, "{currency:.currency,slots:.forecast.feedin}")
    ForecastKind.CO2 -> co2(context, server)
}

private fun solar(context: Context, server: StoredServer, adjust: Boolean): ForecastState {
    val out = ApiClient.fetch(server, ".forecast.solar")
    if (out is FetchOutcome.NoData) return ForecastState.NoData
    if (out !is FetchOutcome.Success) return ForecastState.Unreachable
    return runCatching {
        val o = JSONObject(out.json)
        val rawScale = if (o.has("scale") && !o.isNull("scale")) o.optDouble("scale") else 1.0
        val scale = if (adjust) rawScale else 1.0
        val ts = o.optJSONArray("timeseries") ?: return@runCatching ForecastState.NoData
        val now = System.currentTimeMillis()
        val end = now + WINDOW_MS
        val values = ArrayList<Double>()
        val times = ArrayList<Long>()
        var currentW: Double? = null
        for (i in 0 until ts.length()) {
            // entries are [ts, val] tuples, unix seconds (see timeseries.MarshalJSON in evcc)
            val p = ts.optJSONArray(i) ?: continue
            if (p.length() < 2) continue
            val t = (p.optDouble(0) * 1000).toLong()
            val v = p.optDouble(1) * scale
            if (t in now..end) {
                values.add(v)
                times.add(t)
            }
            if (t <= now) currentW = v // last slot at/behind now wins
        }
        if (values.isEmpty()) return@runCatching ForecastState.NoData
        val today = o.optJSONObject("today")?.optDouble("energy") ?: 0.0
        val tomorrow = o.optJSONObject("tomorrow")?.optDouble("energy") ?: 0.0
        val (value, unit) = splitValueUnit(Format.fmtW(currentW ?: values.first()))
        ForecastState.Data(
            value = value,
            unit = unit,
            chart = chart(context, ForecastKind.SOLAR, values, times, ChartKind.AREA),
            footerLeft = FooterSide(
                emphasis = Format.fmtWh(today * scale),
                label = context.getString(R.string.widget_solar_remaining),
            ),
            footerRight = FooterSide(
                emphasis = Format.fmtWh(tomorrow * scale),
                label = context.getString(R.string.widget_solar_tomorrow),
            ),
        )
    }.getOrDefault(ForecastState.NoData)
}

private fun series(context: Context, kind: ForecastKind, server: StoredServer, jq: String): ForecastState {
    val out = ApiClient.fetch(server, jq)
    if (out is FetchOutcome.NoData) return ForecastState.NoData
    if (out !is FetchOutcome.Success) return ForecastState.Unreachable
    return runCatching {
        val o = JSONObject(out.json)
        val currency = o.optString("currency").takeIf { it.isNotEmpty() && it != "null" } ?: "EUR"
        val slots = o.optJSONArray("slots") ?: return@runCatching ForecastState.NoData
        val stat = windowStats(slots) ?: return@runCatching ForecastState.NoData
        val (value, unit) = splitValueUnit(Format.fmtPricePerKWh(stat.current, currency))
        ForecastState.Data(
            value = value,
            unit = unit,
            chart = chart(context, kind, stat.values, stat.times, ChartKind.STEP_AREA),
            footerLeft = FooterSide(
                emphasis = "${Format.fmtPricePerKWh(stat.min, currency, withUnit = false)}–" +
                    Format.fmtPricePerKWh(stat.max, currency, withUnit = false),
                label = Format.pricePerKWhUnit(currency),
            ),
            footerRight = FooterSide(
                prefix = "ø ",
                emphasis = Format.fmtPricePerKWh(stat.avg, currency),
            ),
        )
    }.getOrDefault(ForecastState.NoData)
}

private fun co2(context: Context, server: StoredServer): ForecastState {
    val out = ApiClient.fetch(server, ".forecast.co2")
    if (out is FetchOutcome.NoData) return ForecastState.NoData
    if (out !is FetchOutcome.Success) return ForecastState.Unreachable
    return runCatching {
        val slots = org.json.JSONArray(out.json)
        val stat = windowStats(slots) ?: return@runCatching ForecastState.NoData
        val (value, unit) = splitValueUnit(Format.fmtCo2(stat.current))
        ForecastState.Data(
            value = value,
            unit = unit,
            chart = chart(context, ForecastKind.CO2, stat.values, stat.times, ChartKind.STEP),
            footerLeft = FooterSide(
                emphasis = "${Format.fmtNumber(stat.min, 0)}–${Format.fmtNumber(stat.max, 0)}",
                label = "g",
            ),
            footerRight = FooterSide(prefix = "ø ", emphasis = "${Format.fmtNumber(stat.avg, 0)} g"),
        )
    }.getOrDefault(ForecastState.NoData)
}

private data class Stats(
    val values: List<Double>, val times: List<Long>,
    val current: Double, val min: Double, val max: Double, val avg: Double,
)

/** Trim slots ([start, end, value] tuples, unix seconds) to the 48h window and reduce to stats + series. */
private fun windowStats(slots: org.json.JSONArray): Stats? {
    val now = System.currentTimeMillis()
    val end = now + WINDOW_MS
    val values = ArrayList<Double>()
    val times = ArrayList<Long>()
    var current: Double? = null
    for (i in 0 until slots.length()) {
        val s = slots.optJSONArray(i) ?: continue
        if (s.length() < 3) continue
        val start = (s.optDouble(0) * 1000).toLong()
        val slotEnd = (s.optDouble(1) * 1000).toLong()
        val v = s.optDouble(2)
        if (start in now..end) {
            values.add(v)
            times.add(start)
        }
        if (current == null && now < slotEnd) current = v // first slot ending after now
    }
    if (values.isEmpty()) return null
    return Stats(
        values = values,
        times = times,
        current = current ?: values.first(),
        min = values.min(),
        max = values.max(),
        avg = values.average(),
    )
}

abstract class ForecastWidget(private val kind: ForecastKind) : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
        val serverId = WidgetConfig.forecastServerId(context, appWidgetId)
        val adjust = WidgetConfig.forecastAdjust(context, appWidgetId)
        val state = withContext(Dispatchers.IO) {
            val server = SharedStore.server(context, serverId) ?: return@withContext ForecastState.NotConfigured
            loadForecastState(context, kind, server, adjust)
        }
        provideContent { Content(context, state, serverId) }
    }

    @Composable
    private fun Content(context: Context, state: ForecastState, serverId: String?) {
        val notConfigured = state == ForecastState.NotConfigured
        // mirrors ForecastWidgetView.deepLink in Views.swift: no `type` param -
        // the app tab is fixed (forecast), only the server needs to be passed.
        val deepLink = serverId?.let { "evcc://forecast?server=$it" } ?: "evcc://server"
        Column(
            modifier = GlanceModifier.fillMaxSize()
                .background(if (notConfigured) notConfiguredBackground else cardBackground)
                .clickable(deepLinkAction(deepLink))
                .padding(12.dp),
            verticalAlignment = Alignment.Vertical.Top,
        ) {
            when (state) {
                is ForecastState.Data -> DataBody(context, state)
                ForecastState.NoData -> MessageBody(
                    context.getString(R.string.widget_noData_title),
                    context.getString(R.string.widget_noData_body),
                )
                ForecastState.Unreachable -> MessageBody(
                    context.getString(R.string.widget_unreachable_title),
                    context.getString(R.string.widget_unreachable_body),
                )
                ForecastState.NotConfigured -> NotConfiguredBody(context)
            }
        }
    }

    @Composable
    private fun DataBody(context: Context, state: ForecastState.Data) {
        val p = palette(kind)
        Header(context, p, state.value, state.unit)
        Spacer(GlanceModifier.height(4.dp))
        Image(
            provider = ImageProvider(state.chart),
            contentDescription = null,
            modifier = GlanceModifier.fillMaxWidth().height(64.dp),
            contentScale = ContentScale.FillBounds,
        )
        Spacer(GlanceModifier.height(5.dp))
        Footer(p, state.footerLeft, state.footerRight)
    }

    @Composable
    private fun Header(context: Context, p: Palette, value: String, unit: String) {
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.Bottom) {
            Text(kind.title(context), style = headerHeadlineStyle.copy(color = p.headline))
            Spacer(GlanceModifier.defaultWeight())
            Column(horizontalAlignment = Alignment.Horizontal.End) {
                Row {
                    Text(value, style = headerHeadlineStyle.copy(color = p.headline))
                    Text(" $unit", style = headerHeadlineUnitStyle.copy(color = p.headline))
                }
                Text(context.getString(R.string.widget_now), style = headerSubStyle)
            }
        }
    }

    @Composable
    private fun Footer(p: Palette, left: FooterSide, right: FooterSide) {
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Vertical.CenterVertically) {
            FooterText(left, p.headline)
            Spacer(GlanceModifier.defaultWeight())
            FooterText(right, textPrimary)
        }
    }

    @Composable
    private fun FooterText(side: FooterSide, emphasisColor: ColorProvider) {
        Row {
            if (side.prefix != null) Text(side.prefix, style = footerStyle)
            Text(side.emphasis, style = footerEmphasisStyle.copy(color = emphasisColor))
            if (side.label != null) Text(" ${side.label}", style = footerStyle)
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

class SolarWidget : ForecastWidget(ForecastKind.SOLAR)
class PriceWidget : ForecastWidget(ForecastKind.PRICE)
class Co2Widget : ForecastWidget(ForecastKind.CO2)
class FeedinWidget : ForecastWidget(ForecastKind.FEEDIN)

class EvccSolarWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SolarWidget()
}

class EvccPriceWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = PriceWidget()
}

class EvccCo2WidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = Co2Widget()
}

class EvccFeedinWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = FeedinWidget()
}
