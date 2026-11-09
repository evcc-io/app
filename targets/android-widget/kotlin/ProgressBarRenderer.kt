package io.evcc.android.widget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path

/**
 * Renders the progress strip along the card's bottom edge to a Bitmap, shown
 * via a Glance Image stretched with FillBounds - Glance has no fractional-width
 * layout modifier, so this is how the fill gets a precise width. Square ends,
 * transparent remainder over a themed track view; the card's corner radius clips the strip. Diagonal
 * stripes (like the web UI's charging bar) when [stripeColor] is given.
 */
object ProgressBarRenderer {
    // ~2px per dp at the widest strip so the stripes stay crisp after FillBounds
    private const val W = 600
    private const val H = 12

    fun strip(fraction: Double, fillColor: Int, stripeColor: Int? = null): Bitmap {
        val bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val fillW = (W * fraction.coerceIn(0.0, 1.0)).toFloat()
        canvas.drawRect(0f, 0f, fillW, H.toFloat(), Paint().apply { color = fillColor })
        if (stripeColor != null) {
            canvas.clipRect(0f, 0f, fillW, H.toFloat())
            val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = stripeColor }
            val band = H.toFloat() // stripe width == gap width, 45°
            var x = -H.toFloat()
            while (x < fillW) {
                canvas.drawPath(
                    Path().apply {
                        moveTo(x, H.toFloat()); lineTo(x + H, 0f); lineTo(x + H + band, 0f); lineTo(x + band, H.toFloat()); close()
                    },
                    paint,
                )
                x += band * 2
            }
        }
        return bmp
    }
}
