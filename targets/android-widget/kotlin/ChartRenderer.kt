package io.evcc.android.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import androidx.glance.color.isNightMode
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlin.math.ceil

/** Mirrors ChartKind in Views.swift: area = solar (monotone-ish line + fill),
 *  step = price/CO2 (stepEnd line, no fill), stepArea = feed-in (stepEnd + fill). */
enum class ChartKind { AREA, STEP, STEP_AREA }

/**
 * Renders a forecast series to a Bitmap (line + optional area fill, a Y axis,
 * local-midnight day dividers, and weekday labels), shown in the widget via a
 * Glance Image. Glance has no chart primitive, so this Canvas bitmap is how we
 * approximate the iOS Swift Charts look (see ForecastChart in Views.swift) -
 * straight line segments rather than Swift Charts' `.monotone` spline
 * smoothing is a known simplification.
 */
object ChartRenderer {
    private const val W = 720
    private const val H = 240
    private const val PAD_TOP = 18f
    private const val PAD_BOTTOM = 30f
    private const val PAD_LEFT = 32f

    /** values and times must be index-aligned; times in epoch millis (may be empty). */
    fun render(
        context: Context,
        values: List<Double>,
        times: List<Long>,
        kind: ChartKind,
        accentDay: Int,
        accentNight: Int,
    ): Bitmap {
        val bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        if (values.size < 2) return bmp

        val dark = context.isNightMode
        val accent = if (dark) accentNight else accentDay
        val fillColor = (accent and 0x00FFFFFF) or 0x33000000
        val dividerColor = if (dark) 0x33FFFFFF.toInt() else 0x22000000.toInt()
        val labelColor = if (dark) 0x99FFFFFF.toInt() else 0x99000000.toInt()
        val zeroLineColor = if (dark) 0x40FFFFFF.toInt() else 0x33000000.toInt()

        val axisBottom = minOf(0.0, values.min())
        val axisTop = axisTop(values)
        val span = (axisTop - axisBottom).let { if (it <= 0.0) 1.0 else it }

        val plotW = W - PAD_LEFT
        val plotH = H - PAD_TOP - PAD_BOTTOM

        fun x(i: Int) = PAD_LEFT + plotW * (i.toFloat() / (values.size - 1))
        fun y(v: Double) = PAD_TOP + plotH * (1f - ((v - axisBottom) / span).toFloat())

        // Y axis: 0 line + min/max labels (mirrors chartYAxis in Views.swift)
        val axisLabelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = labelColor
            textSize = 18f
        }
        canvas.drawLine(PAD_LEFT, y(0.0), W.toFloat(), y(0.0), Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = zeroLineColor
            strokeWidth = 1f
        })
        canvas.drawText(axisLabel(0.0), 2f, y(0.0) + 6f, axisLabelPaint)
        canvas.drawText(axisLabel(axisTop), 2f, y(axisTop) + 6f, axisLabelPaint)

        // day dividers + weekday labels (drawn first, behind the series)
        if (times.size == values.size) {
            val dividerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = dividerColor
                strokeWidth = 1.5f
            }
            val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = labelColor
                textSize = 22f
            }
            val weekday = SimpleDateFormat("EEE", Locale.getDefault())
            val cal = Calendar.getInstance()
            var lastDay = -1
            for (i in values.indices) {
                cal.timeInMillis = times[i]
                val day = cal.get(Calendar.DAY_OF_YEAR)
                if (day != lastDay) {
                    if (lastDay != -1) {
                        val xx = x(i)
                        canvas.drawLine(xx, PAD_TOP, xx, PAD_TOP + plotH, dividerPaint)
                        canvas.drawText(weekday.format(Date(times[i])), xx + 6f, H - 8f, textPaint)
                    }
                    lastDay = day
                }
            }
        }

        // area fill under the line (skipped for pure STEP, like iOS's `if kind != .step`)
        if (kind != ChartKind.STEP) {
            val area = if (kind == ChartKind.AREA) {
                areaPath(::x, ::y, values, y(axisBottom))
            } else {
                stepAreaPath(::x, ::y, values, y(axisBottom))
            }
            canvas.drawPath(area, Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.FILL
                color = fillColor
            })
        }

        // series line
        val line = if (kind == ChartKind.AREA) linePath(::x, ::y, values) else stepLinePath(::x, ::y, values)
        canvas.drawPath(line, Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = if (kind == ChartKind.AREA) 4.4f else 4f
            color = accent
            strokeJoin = Paint.Join.ROUND
            strokeCap = Paint.Cap.ROUND
        })

        return bmp
    }

    // labels: 0 + max, ceil to next integer; fractional (<1) series ceil to 0.1
    // so sub-unit currencies aren't flattened. Mirrors axisTop/axisBottom in
    // ForecastChart (Views.swift).
    private fun axisTop(values: List<Double>): Double {
        val m = values.maxOrNull() ?: 0.0
        if (m <= 0.0) return 1.0
        return if (m < 1.0) ceil(m * 10) / 10 else ceil(m)
    }

    private fun axisLabel(v: Double): String =
        if (v == v.toLong().toDouble()) v.toLong().toString() else String.format(Locale.getDefault(), "%.1f", v)

    private fun linePath(x: (Int) -> Float, y: (Double) -> Float, values: List<Double>): Path = Path().apply {
        moveTo(x(0), y(values[0]))
        for (i in 1 until values.size) lineTo(x(i), y(values[i]))
    }

    private fun areaPath(x: (Int) -> Float, y: (Double) -> Float, values: List<Double>, baselineY: Float): Path =
        Path().apply {
            moveTo(x(0), baselineY)
            for (i in values.indices) lineTo(x(i), y(values[i]))
            lineTo(x(values.size - 1), baselineY)
            close()
        }

    /** Staircase: horizontal to the next x at the current value, then a vertical jump. */
    private fun stepLinePath(x: (Int) -> Float, y: (Double) -> Float, values: List<Double>): Path = Path().apply {
        moveTo(x(0), y(values[0]))
        for (i in 1 until values.size) {
            lineTo(x(i), y(values[i - 1]))
            lineTo(x(i), y(values[i]))
        }
    }

    private fun stepAreaPath(x: (Int) -> Float, y: (Double) -> Float, values: List<Double>, baselineY: Float): Path =
        Path().apply {
            moveTo(x(0), baselineY)
            lineTo(x(0), y(values[0]))
            for (i in 1 until values.size) {
                lineTo(x(i), y(values[i - 1]))
                lineTo(x(i), y(values[i]))
            }
            lineTo(x(values.size - 1), baselineY)
            close()
        }
}
