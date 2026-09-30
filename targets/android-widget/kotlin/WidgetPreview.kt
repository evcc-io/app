package io.evcc.android.widget

import android.content.Context
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.compose.ui.graphics.toArgb
import io.evcc.android.R

/**
 * Builds a plain-Views mock of the 4x1 Loadpoint widget for the config screen's
 * live preview. Glance content can't be embedded in a classic-Views Activity
 * without pulling in the full Compose UI stack (this repo is deliberately
 * Compose-free outside Glance itself), so this mirrors LoadpointWidget.kt's
 * InfoFour + ModeDock with the same data and colors.
 */
object WidgetPreview {
    private fun dp(context: Context, v: Int): Int = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), context.resources.displayMetrics,
    ).toInt()

    private fun card(context: Context, bgColor: Int): FrameLayout = FrameLayout(context).apply {
        background = GradientDrawable().apply {
            cornerRadius = dp(context, 20).toFloat()
            setColor(bgColor)
        }
        clipToOutline = true // clips the docked mode buttons and the progress strip
    }

    private fun text(context: Context, str: String, sizeSp: Float, color: Int, bold: Boolean = false): TextView =
        TextView(context).apply {
            text = str
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            setTextColor(color)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
            if (bold) setTypeface(typeface, Typeface.BOLD)
        }

    /** Loading/placeholder state shown while the first fetch for a candidate is in flight. */
    fun message(context: Context, title: String, dark: Boolean): View {
        val root = card(context, cardBackgroundArgb(dark))
        root.addView(
            text(context, title, 12f, textSecondaryArgb(dark)).apply { gravity = Gravity.CENTER },
            FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT),
        )
        return root
    }

    fun loadpoint(context: Context, lp: Loadpoint, dark: Boolean): View {
        val d = { v: Int -> dp(context, v) }
        val primary = textPrimaryArgb(dark)
        val secondary = textSecondaryArgb(dark)
        val s = status(lp)
        val m = metric(lp)
        val heating = lp.chargerFeatureHeating
        val dotColor = statusColorArgb(s.active, heating, dark)

        val root = card(context, cardBackgroundArgb(dark))
        val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        root.addView(row, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        // info area: content plus the progress strip along the bottom edge
        val info = FrameLayout(context)
        row.addView(info, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f))

        val content = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(d(12), d(6), d(12), d(12))
        }
        info.addView(content, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        // big SoC first (mirrors InfoWide)
        val metricRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.BOTTOM }
        metricRow.addView(text(context, m.value, 36f, primary, bold = true))
        metricRow.addView(text(context, " ${m.unit}", 14f, secondary, bold = true).apply { setPadding(0, 0, 0, d(6)) })
        content.addView(metricRow)
        content.addView(View(context), LinearLayout.LayoutParams(d(14), 1))

        val block = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL; setPadding(0, 0, d(18), 0) }
        block.addView(text(context, title(context, lp), 14f, primary, bold = true))
        val statusRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, d(2), 0, 0)
        }
        statusRow.addView(
            View(context).apply {
                layoutParams = LinearLayout.LayoutParams(d(7), d(7))
                background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(dotColor) }
            },
        )
        statusRow.addView(View(context).apply { layoutParams = LinearLayout.LayoutParams(d(5), 1) })
        val power = lp.chargePower?.takeIf { it > 0 }?.let { Format.fmtW(it) }
        val line = listOfNotNull(power, statusLabel(context, s, heating)).joinToString(", ")
        statusRow.addView(text(context, line, 12f, dotColor))
        block.addView(statusRow)
        content.addView(block, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))

        info.addView(
            ImageView(context).apply {
                setImageResource(R.drawable.ic_reload)
                setColorFilter(secondary)
            },
            FrameLayout.LayoutParams(d(15), d(15), Gravity.TOP or Gravity.END).apply { topMargin = d(8); marginEnd = d(10) },
        )

        stripBitmap(lp)?.let { bitmap ->
            val strip = ImageView(context).apply {
                setBackgroundColor(barTrackColorArgb(dark))
                setImageBitmap(bitmap)
                scaleType = ImageView.ScaleType.FIT_XY
            }
            info.addView(strip, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, d(6), Gravity.BOTTOM))
        }

        row.addView(dock(context, lp, dark)) // keeps its own fixed-width params
        return root
    }

    // mirrors ModeDock: 3 modes stacked, legacy 4 as a 2x2 grid, hairline separators in the card color
    private fun dock(context: Context, lp: Loadpoint, dark: Boolean): View {
        val d = { v: Int -> dp(context, v) }
        val modes = modes(lp)
        val grid = modes.size == 4
        val separator = cardBackgroundArgb(dark)
        val dock = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(modeUnselectedBackgroundArgb(dark))
            layoutParams = LinearLayout.LayoutParams(d((if (grid) DOCK_WIDTH_4 else DOCK_WIDTH_3).value.toInt()), ViewGroup.LayoutParams.MATCH_PARENT)
        }
        fun button(mode: String): TextView {
            val selected = mode == lp.mode
            return text(
                context, modeChipLabel(context, lp, mode), 12f,
                if (selected) modeSelectedTextArgb(dark) else modeUnselectedTextArgb(dark), bold = selected,
            ).apply {
                gravity = Gravity.CENTER
                setBackgroundColor(if (selected) modeSelectedBackgroundArgb(dark) else modeUnselectedBackgroundArgb(dark))
            }
        }
        if (grid) {
            modes.chunked(2).forEachIndexed { i, pair ->
                if (i > 0) dock.addView(View(context).apply { setBackgroundColor(separator) }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, d(1)))
                val r = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
                r.addView(button(pair[0]), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f))
                r.addView(View(context).apply { setBackgroundColor(separator) }, LinearLayout.LayoutParams(d(1), ViewGroup.LayoutParams.MATCH_PARENT))
                r.addView(button(pair[1]), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f))
                dock.addView(r, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
            }
        } else {
            modes.forEachIndexed { i, mode ->
                if (i > 0) dock.addView(View(context).apply { setBackgroundColor(separator) }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, d(1)))
                dock.addView(button(mode), LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
            }
        }
        return dock
    }

    private fun spacer(context: Context, h: Int): View =
        View(context).apply { layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(context, h)) }

    private fun footerSide(context: Context, side: FooterSide, emphasisColor: Int, secondary: Int): LinearLayout {
        val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        if (side.prefix != null) row.addView(text(context, side.prefix, 10f, secondary))
        row.addView(text(context, side.emphasis, 10f, emphasisColor, bold = true))
        if (side.label != null) row.addView(text(context, " ${side.label}", 10f, secondary))
        return row
    }

    /** Mirrors ForecastWidget.kt's DataBody: header row, chart image, footer row. */
    fun forecast(context: Context, kind: ForecastKind, data: ForecastState.Data, dark: Boolean): View {
        val d = { v: Int -> dp(context, v) }
        val p = forecastPalette(kind)
        val headlineArgb = (if (dark) p.accentNight else p.accentDay).toArgb()
        val secondary = textSecondaryArgb(dark)

        val root = card(context, cardBackgroundArgb(dark))

        val headerRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.BOTTOM }
        headerRow.addView(
            text(context, kind.title(context), 15f, headlineArgb, bold = true).apply {
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            },
        )
        val valueCol = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.END }
        val valueRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        valueRow.addView(text(context, data.value, 15f, headlineArgb, bold = true))
        valueRow.addView(text(context, " ${data.unit}", 10f, headlineArgb, bold = true))
        valueCol.addView(valueRow)
        valueCol.addView(text(context, context.getString(R.string.widget_now), 9f, secondary))
        headerRow.addView(valueCol)
        root.addView(headerRow)

        root.addView(spacer(context, 4))
        root.addView(
            ImageView(context).apply {
                setImageBitmap(data.chart)
                scaleType = ImageView.ScaleType.FIT_XY
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, d(52))
            },
        )
        root.addView(spacer(context, 5))

        val footerRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        footerRow.addView(
            footerSide(context, data.footerLeft, headlineArgb, secondary).apply {
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            },
        )
        footerRow.addView(footerSide(context, data.footerRight, textPrimaryArgb(dark), secondary))
        root.addView(footerRow)

        return root
    }
}
