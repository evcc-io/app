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
import io.evcc.android.R

/**
 * Builds a plain-Views mock of the Loadpoint widget for the config screen's
 * live preview. Glance content can't be embedded in a classic-Views Activity
 * without pulling in the full Compose UI stack (this repo is deliberately
 * Compose-free outside Glance itself), so this reuses the same data plus the
 * same ProgressBarRenderer bitmaps to approximate the real widget closely
 * rather than rendering it exactly.
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
        root.addView(text(context, title(context, lp), 14f, primary, bold = true))

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
        statusRow.addView(text(context, statusLabel(context, s, heating), 10f, dotColor, bold = true))
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
            chipsRow.addView(chip(context, modeChipLabel(context, lp, mode), mode == lp.mode, dark))
        }
        root.addView(chipsRow)

        return root
    }
}
