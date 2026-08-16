package io.evcc.android.widget

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.compose.ui.graphics.toArgb

/**
 * Builds a plain-Views mock of the Loadpoint/Forecast widgets for the config
 * screens' live preview. Glance content can't be embedded in a classic-Views
 * Activity without pulling in the full Compose UI stack (this repo is
 * deliberately Compose-free outside Glance itself), so this reuses the same
 * data plus the same ChartRenderer/ProgressBarRenderer bitmaps to approximate
 * the real widget closely rather than rendering it exactly.
 */
object WidgetPreview {
    private fun dp(context: Context, v: Int): Int = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), context.resources.displayMetrics,
    ).toInt()

    private fun card(context: Context, bgColor: Int): LinearLayout {
        val d = { v: Int -> dp(context, v) }
        return LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(d(14), d(14), d(14), d(14))
            background = GradientDrawable().apply {
                cornerRadius = d(16).toFloat()
                setColor(bgColor)
            }
        }
    }

    private fun text(context: Context, str: String, sizeSp: Float, color: Int, bold: Boolean = false): TextView =
        TextView(context).apply {
            text = str
            setTextColor(color)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
            if (bold) setTypeface(typeface, Typeface.BOLD)
        }

    private fun spacer(context: Context, h: Int): View =
        View(context).apply { layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(context, h)) }

    private fun chip(context: Context, label: String, selected: Boolean, dark: Boolean): TextView {
        val d = { v: Int -> dp(context, v) }
        return text(
            context, label, 10f,
            if (selected) modeSelectedTextArgb(dark) else modeUnselectedTextArgb(dark),
            bold = true,
        ).apply {
            setPadding(d(8), d(5), d(8), d(5))
            background = GradientDrawable().apply {
                cornerRadius = d(9).toFloat()
                setColor(if (selected) modeSelectedBackgroundArgb(dark) else modeUnselectedBackgroundArgb(dark))
            }
        }
    }

    /** Loading/placeholder state shown while the first fetch for a candidate is in flight. */
    fun message(context: Context, title: String, dark: Boolean): View {
        val root = card(context, cardBackgroundArgb(dark))
        root.gravity = Gravity.CENTER
        root.addView(text(context, title, 12f, textSecondaryArgb(dark)).apply { gravity = Gravity.CENTER })
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
        root.addView(text(context, title(lp), 14f, primary, bold = true))

        val statusRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, d(4), 0, 0)
        }
        statusRow.addView(
            View(context).apply {
                layoutParams = LinearLayout.LayoutParams(d(7), d(7))
                background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(dotColor) }
            },
        )
        statusRow.addView(View(context).apply { layoutParams = LinearLayout.LayoutParams(d(5), 1) })
        statusRow.addView(text(context, statusLabel(s, heating), 10f, dotColor, bold = true))
        root.addView(statusRow)

        root.addView(spacer(context, 6))

        val metricRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.BOTTOM }
        metricRow.addView(text(context, m.value, 24f, primary, bold = true))
        metricRow.addView(text(context, " ${m.unit}", 12f, secondary, bold = true))
        root.addView(metricRow)

        if (m.fill != null) {
            root.addView(spacer(context, 6))
            root.addView(
                ImageView(context).apply {
                    setImageBitmap(
                        ProgressBarRenderer.render(
                            fraction = m.fill,
                            fillColor = barFillColor(lp.connected, heating),
                            trackColor = barTrackColor(dark),
                            striped = s.active,
                            stripeColor = barStripeColor(heating),
                        ),
                    )
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, d(6))
                },
            )
        }

        root.addView(spacer(context, 6))
        val (powerValue, powerUnit) = splitValueUnit(lp.chargePower?.let { Format.fmtW(it) } ?: "–")
        val powerRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        powerRow.addView(text(context, powerValue, 13f, primary, bold = true))
        powerRow.addView(text(context, " $powerUnit", 10f, secondary, bold = true))
        root.addView(powerRow)

        root.addView(spacer(context, 8))
        val chipsRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        modes(lp).forEachIndexed { i, mode ->
            if (i > 0) chipsRow.addView(View(context).apply { layoutParams = LinearLayout.LayoutParams(d(4), 1) })
            chipsRow.addView(chip(context, MODE_LABELS[mode] ?: mode, mode == lp.mode, dark))
        }
        root.addView(chipsRow)

        return root
    }

    private fun footerSide(context: Context, side: FooterSide, emphasisColor: Int, secondary: Int): LinearLayout {
        val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        if (side.prefix != null) row.addView(text(context, side.prefix, 10f, secondary))
        row.addView(text(context, side.emphasis, 10f, emphasisColor, bold = true))
        if (side.label != null) row.addView(text(context, " ${side.label}", 10f, secondary))
        return row
    }

    fun forecast(context: Context, kind: ForecastKind, data: ForecastState.Data, dark: Boolean): View {
        val d = { v: Int -> dp(context, v) }
        val p = palette(kind)
        val headlineArgb = (if (dark) p.accentNight else p.accentDay).toArgb()
        val secondary = textSecondaryArgb(dark)

        val root = card(context, cardBackgroundArgb(dark))

        val headerRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.BOTTOM }
        headerRow.addView(
            text(context, kind.title, 15f, headlineArgb, bold = true).apply {
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            },
        )
        val valueCol = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.END }
        val valueRow = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        valueRow.addView(text(context, data.value, 15f, headlineArgb, bold = true))
        valueRow.addView(text(context, " ${data.unit}", 10f, headlineArgb, bold = true))
        valueCol.addView(valueRow)
        valueCol.addView(text(context, "now", 9f, secondary))
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
