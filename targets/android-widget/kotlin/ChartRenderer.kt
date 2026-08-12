package io.evcc.android.widget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Renders a forecast series to a Bitmap (line + translucent area fill, with
 * local-midnight day dividers and weekday labels), shown in the widget via a
 * Glance Image. Glance has no chart primitive, so this Canvas bitmap is how we
 * approximate the iOS Swift Charts look.
 */
object ChartRenderer {
    private const val W = 720
    private const val H = 240

    private val green = 0xFF0FDE41.toInt()
    private val fill = 0x330FDE41.toInt()
    private val divider = 0x33FFFFFF.toInt()
    private val labelColor = 0x99FFFFFF.toInt()

    /** values and times must be index-aligned; times in epoch millis (may be empty). */
    fun render(values: List<Double>, times: List<Long>): Bitmap {
        val bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        if (values.size < 2) return bmp

        val minV = values.min()
        val maxV = values.max()
        val span = (maxV - minV).let { if (it <= 0.0) 1.0 else it }

        val padTop = 18f
        val padBottom = 30f
        val plotW = W.toFloat()
        val plotH = H - padTop - padBottom

        fun x(i: Int) = plotW * (i.toFloat() / (values.size - 1))
        fun y(v: Double) = padTop + plotH * (1f - ((v - minV) / span).toFloat())

        // day dividers + weekday labels (drawn first, behind the series)
        if (times.size == values.size) {
            val dividerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = divider
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
                        canvas.drawLine(xx, padTop, xx, padTop + plotH, dividerPaint)
                        canvas.drawText(weekday.format(Date(times[i])), xx + 6f, H - 8f, textPaint)
                    }
                    lastDay = day
                }
            }
        }

        // area fill under the line
        val area = Path().apply {
            moveTo(x(0), padTop + plotH)
            for (i in values.indices) lineTo(x(i), y(values[i]))
            lineTo(x(values.size - 1), padTop + plotH)
            close()
        }
        canvas.drawPath(area, Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.FILL
            color = fill
        })

        // series line
        val line = Path().apply {
            moveTo(x(0), y(values[0]))
            for (i in 1 until values.size) lineTo(x(i), y(values[i]))
        }
        canvas.drawPath(line, Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = 4f
            color = green
            strokeJoin = Paint.Join.ROUND
            strokeCap = Paint.Cap.ROUND
        })

        return bmp
    }
}
