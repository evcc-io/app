package io.evcc.android.widget

import android.content.Context
import android.graphics.Bitmap
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.Text
import androidx.glance.unit.ColorProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * Forecast home-screen widgets (Android counterpart of ForecastWidget.swift):
 * Solar, Price, CO₂ and Feed-in. Glance has no chart primitive, so the 48h
 * series is rendered to a Bitmap (see [ChartRenderer]) and shown via Image,
 * alongside a current value + summary.
 *
 * Per-instance config (server, and for Solar the "adjust to real production"
 * toggle) is set by ForecastWidgetConfigActivity, keyed by appWidgetId.
 */
// non-private: the abstract ForecastWidget's constructor (public, since the
// concrete widget subclasses are) takes it as a parameter.
enum class ForecastKind(val title: String) {
    SOLAR("Solar"), PRICE("Price"), CO2("CO₂"), FEEDIN("Feed-in")
}

private sealed interface ForecastState {
    data class Data(
        val header: String,
        val summary: String,
        val chart: Bitmap,
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

abstract class ForecastWidget(private val kind: ForecastKind) : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
        val serverId = WidgetConfig.forecastServerId(context, appWidgetId)
        val adjust = WidgetConfig.forecastAdjust(context, appWidgetId)
        val state = load(context, serverId, adjust)
        provideContent { Content(state) }
    }

    private suspend fun load(context: Context, serverId: String?, adjust: Boolean): ForecastState =
        withContext(Dispatchers.IO) {
            val server = SharedStore.server(context, serverId) ?: return@withContext ForecastState.NotConfigured
            when (kind) {
                ForecastKind.SOLAR -> solar(server, adjust)
                ForecastKind.PRICE -> series(server, "{currency:.currency,slots:.forecast.grid}")
                ForecastKind.FEEDIN -> series(server, "{currency:.currency,slots:.forecast.feedin}")
                ForecastKind.CO2 -> co2(server)
            }
        }

    private fun chart(values: List<Double>, times: List<Long>): Bitmap {
        val idx = downsampleIndices(values.size)
        return ChartRenderer.render(idx.map { values[it] }, idx.map { times[it] })
    }

    private fun solar(server: StoredServer, adjust: Boolean): ForecastState {
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
            ForecastState.Data(
                header = Format.fmtW(currentW ?: values.first()),
                summary = "today ${Format.fmtWh(today * scale)} · tom. ${Format.fmtWh(tomorrow * scale)}",
                chart = chart(values, times),
            )
        }.getOrDefault(ForecastState.NoData)
    }

    private fun series(server: StoredServer, jq: String): ForecastState {
        val out = ApiClient.fetch(server, jq)
        if (out is FetchOutcome.NoData) return ForecastState.NoData
        if (out !is FetchOutcome.Success) return ForecastState.Unreachable
        return runCatching {
            val o = JSONObject(out.json)
            val currency = o.optString("currency").takeIf { it.isNotEmpty() && it != "null" } ?: "EUR"
            val slots = o.optJSONArray("slots") ?: return@runCatching ForecastState.NoData
            val stat = windowStats(slots) ?: return@runCatching ForecastState.NoData
            ForecastState.Data(
                header = Format.fmtPricePerKWh(stat.current, currency),
                summary = "avg ${Format.fmtPricePerKWh(stat.avg, currency, withUnit = false)}" +
                    " · ${Format.fmtPricePerKWh(stat.min, currency, withUnit = false)}–" +
                    Format.fmtPricePerKWh(stat.max, currency),
                chart = chart(stat.values, stat.times),
            )
        }.getOrDefault(ForecastState.NoData)
    }

    private fun co2(server: StoredServer): ForecastState {
        val out = ApiClient.fetch(server, ".forecast.co2")
        if (out is FetchOutcome.NoData) return ForecastState.NoData
        if (out !is FetchOutcome.Success) return ForecastState.Unreachable
        return runCatching {
            val slots = org.json.JSONArray(out.json)
            val stat = windowStats(slots) ?: return@runCatching ForecastState.NoData
            ForecastState.Data(
                header = Format.fmtCo2(stat.current),
                summary = "avg ${Format.fmtNumber(stat.avg, 0)} · " +
                    "${Format.fmtNumber(stat.min, 0)}–${Format.fmtNumber(stat.max, 0)} g",
                chart = chart(stat.values, stat.times),
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

    @Composable
    private fun Content(state: ForecastState) {
        Column(
            modifier = GlanceModifier.fillMaxSize().background(ColorProvider(Color(0xFF1B1B1B))).padding(12.dp),
            verticalAlignment = Alignment.Vertical.Top,
        ) {
            Text(kind.title, style = subtle)
            when (state) {
                is ForecastState.Data -> {
                    Text(state.header, style = titleStyle)
                    Text(state.summary, style = subtle)
                    Spacer(GlanceModifier.height(6.dp))
                    Image(
                        provider = ImageProvider(state.chart),
                        contentDescription = null,
                        modifier = GlanceModifier.fillMaxWidth().height(64.dp),
                        contentScale = ContentScale.FillBounds,
                    )
                }
                ForecastState.NoData -> Text("No data", style = subtle)
                ForecastState.Unreachable -> Text("Unreachable", style = subtle)
                ForecastState.NotConfigured -> Text("Open the app to set up", style = subtle)
            }
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
