package io.evcc.android.widget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF

/**
 * Renders a rounded, optionally diagonally-striped progress bar to a Bitmap,
 * shown via a Glance Image - Glance has no fractional-width layout modifier,
 * so this is how the fill gets a precise width. Mirrors ProgressBar in
 * LoadpointViews.swift (a SwiftUI Canvas closure drawing the same stripe
 * pattern).
 */
object ProgressBarRenderer {
    private const val W = 300
    private const val H = 24

    fun render(fraction: Double, fillColor: Int, trackColor: Int, striped: Boolean, stripeColor: Int): Bitmap {
        val bmp = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val r = H / 2f
        val track = RectF(0f, 0f, W.toFloat(), H.toFloat())

        canvas.drawRoundRect(track, r, r, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = trackColor })

        val fillW = (W * fraction.coerceIn(0.0, 1.0)).toFloat()
        if (fillW <= 0f) return bmp

        canvas.save()
        canvas.clipPath(Path().apply { addRoundRect(track, r, r, Path.Direction.CW) })
        canvas.drawRect(RectF(0f, 0f, fillW, H.toFloat()), Paint(Paint.ANTI_ALIAS_FLAG).apply { color = fillColor })

        if (striped) {
            val stripePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = stripeColor }
            val band = H * 0.8f
            var x = -H.toFloat()
            while (x < fillW) {
                val p = Path().apply {
                    moveTo(x, H.toFloat())
                    lineTo(x + H, 0f)
                    lineTo(x + H + band, 0f)
                    lineTo(x + band, H.toFloat())
                    close()
                }
                canvas.drawPath(p, stripePaint)
                x += band * 2
            }
        }
        canvas.restore()
        return bmp
    }
}
