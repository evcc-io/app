package io.evcc.android.widget

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.sp
import androidx.glance.color.ColorProvider
import androidx.glance.text.FontWeight
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider

// evcc brand + energy tokens, mirror targets/widget/Colors.swift (and evcc's
// web tokens, assets/css/app.css). Day/night pairs below mirror the `scheme ==
// .dark` branches in LoadpointViews.swift/Views.swift/Theme.swift.
private val evccDarkGreen = Color(0xFF0FDE41)
private val evccDarkerGreen = Color(0xFF0BA631)
private val evccYellow = Color(0xFFFAF000)
private val evccDarkYellow = Color(0xFFF6BB0F)
private val evccOrange = Color(0xFFFF9000)
private val evccPrice = Color(0xFFFF912F)
private val evccCo2 = Color(0xFF00916E)
private val co2Dark = Color(0xFF1BB88F)

private val bsGrayMedium = Color(0xFF93949E)
private val bsGrayDeep = Color(0xFF010322)

private val widgetCardDark = Color(0xFF1C1C1E)
private val onGreen = Color(0xFF0A2912)
private val onGreenSoft = Color(0xFF0A3D18)
private val progressTrackLight = Color(0xFFECEEF0)
private val modeBgLight = Color(0xFFF0F1F3)
private val modeBgDark = Color(0xFF1A1B2E)
private val modeTextLight = Color(0xFF7C7D8A)
private val modeTextDark = Color(0xFF9A9BAB)

// approximates SwiftUI's semantic .primary / .secondary on each background
private val textPrimaryDay = Color(0xFF1C1C1E)
private val textSecondaryDay = Color(0x991C1C1E) // 60% ink
private val textSecondaryNight = Color(0xB3FFFFFF) // 70% white

// -- card chrome --

val cardBackground: ColorProvider = ColorProvider(day = Color.White, night = widgetCardDark)
val notConfiguredBackground: ColorProvider = ColorProvider(evccDarkGreen)

// -- typography (point sizes mirror LoadpointViews.swift / Views.swift) --

val textPrimary: ColorProvider = ColorProvider(day = textPrimaryDay, night = Color.White)
val textSecondary: ColorProvider = ColorProvider(day = textSecondaryDay, night = textSecondaryNight)

val titleStyle = TextStyle(color = textPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
val subtle = TextStyle(color = textSecondary, fontSize = 11.sp)
val metricStyle = TextStyle(color = textPrimary, fontSize = 30.sp, fontWeight = FontWeight.Bold)
val metricUnitStyle = TextStyle(color = textSecondary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
val powerStyle = TextStyle(color = textPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
val powerUnitStyle = TextStyle(color = textSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
val statusStyle = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold)
val modeChipStyle = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold)

val headerHeadlineStyle = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold)
val headerHeadlineUnitStyle = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold)
val headerSubStyle = TextStyle(color = textSecondary, fontSize = 10.sp, fontWeight = FontWeight.Medium)
val footerStyle = TextStyle(color = textSecondary, fontSize = 11.sp, fontWeight = FontWeight.Medium)
val footerEmphasisStyle = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold)
val messageTitleStyle = TextStyle(color = textPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
val messageBodyStyle = TextStyle(color = textSecondary, fontSize = 11.sp)
val notConfiguredTitleStyle = TextStyle(color = ColorProvider(onGreen), fontSize = 15.sp, fontWeight = FontWeight.Bold)
val notConfiguredBodyStyle = TextStyle(color = ColorProvider(onGreenSoft), fontSize = 11.sp, fontWeight = FontWeight.Medium)

// -- loadpoint status / mode chip colors --

/** gray unless active; brand green (darker in light mode) unless heating, then orange. */
fun statusColor(active: Boolean, heating: Boolean): ColorProvider = when {
    !active -> ColorProvider(bsGrayMedium)
    heating -> ColorProvider(evccOrange)
    else -> ColorProvider(day = evccDarkerGreen, night = evccDarkGreen)
}

// progress bar fill/stripe/track as raw ARGB ints, rendered via ProgressBarRenderer
// (Glance has no fractional-width modifier, so the bar is a small canvas bitmap
// like the chart) - mirrors ProgressBar in LoadpointViews.swift.
private val evccDarkGreenArgb = evccDarkGreen.toArgb()
private val evccDarkerGreenArgb = evccDarkerGreen.toArgb()
private val evccOrangeArgb = evccOrange.toArgb()
private val orangeStripeArgb = Color(0xFFCC7400).toArgb()
private val bsGrayMediumArgb = bsGrayMedium.toArgb()
private val progressTrackLightArgb = progressTrackLight.toArgb()
private val bsGrayDeepArgb = bsGrayDeep.toArgb()

fun barFillColor(connected: Boolean, heating: Boolean): Int = when {
    !connected -> bsGrayMediumArgb
    heating -> evccOrangeArgb
    else -> evccDarkGreenArgb
}

fun barStripeColor(heating: Boolean): Int = if (heating) orangeStripeArgb else evccDarkerGreenArgb

fun barTrackColor(dark: Boolean): Int = if (dark) bsGrayDeepArgb else progressTrackLightArgb

// selected chip inverts against the card (like a filled/primary button); mirrors
// AnyShapeStyle(.primary) in LoadpointViews.swift's modeSelector.
val modeSelectedBackground: ColorProvider = ColorProvider(day = Color.Black, night = Color.White)
val modeSelectedText: ColorProvider = ColorProvider(day = Color.White, night = Color.Black)
val modeUnselectedBackground: ColorProvider = ColorProvider(day = modeBgLight, night = modeBgDark)
val modeUnselectedText: ColorProvider = ColorProvider(day = modeTextLight, night = modeTextDark)

// -- same colors as raw ARGB ints, for the plain-Views config-screen preview
// (WidgetPreview.kt) - it can't use Glance's day/night ColorProvider directly. --

private val modeBgLightArgb = modeBgLight.toArgb()
private val modeBgDarkArgb = modeBgDark.toArgb()
private val modeTextLightArgb = modeTextLight.toArgb()
private val modeTextDarkArgb = modeTextDark.toArgb()
private val widgetCardDarkArgb = widgetCardDark.toArgb()
private val textPrimaryDayArgb = textPrimaryDay.toArgb()
private val textSecondaryDayArgb = textSecondaryDay.toArgb()
private val textSecondaryNightArgb = textSecondaryNight.toArgb()

fun cardBackgroundArgb(dark: Boolean): Int = if (dark) widgetCardDarkArgb else Color.White.toArgb()
fun textPrimaryArgb(dark: Boolean): Int = if (dark) Color.White.toArgb() else textPrimaryDayArgb
fun textSecondaryArgb(dark: Boolean): Int = if (dark) textSecondaryNightArgb else textSecondaryDayArgb

fun statusColorArgb(active: Boolean, heating: Boolean, dark: Boolean): Int = when {
    !active -> bsGrayMediumArgb
    heating -> evccOrangeArgb
    else -> if (dark) evccDarkGreenArgb else evccDarkerGreenArgb
}

fun modeSelectedBackgroundArgb(dark: Boolean): Int = if (dark) Color.White.toArgb() else Color.Black.toArgb()
fun modeSelectedTextArgb(dark: Boolean): Int = if (dark) Color.Black.toArgb() else Color.White.toArgb()
fun modeUnselectedBackgroundArgb(dark: Boolean): Int = if (dark) modeBgDarkArgb else modeBgLightArgb
fun modeUnselectedTextArgb(dark: Boolean): Int = if (dark) modeTextDarkArgb else modeTextLightArgb

// -- forecast per-type palette (mirrors Theme.swift's Palette.make) --

data class Palette(val accent: ColorProvider, val headline: ColorProvider, val accentDay: Color, val accentNight: Color)

fun palette(kind: ForecastKind): Palette = when (kind) {
    ForecastKind.SOLAR -> Palette(
        accent = ColorProvider(evccDarkGreen),
        headline = ColorProvider(day = evccDarkerGreen, night = evccDarkGreen),
        accentDay = evccDarkerGreen, accentNight = evccDarkGreen,
    )
    ForecastKind.PRICE -> Palette(
        accent = ColorProvider(evccPrice), headline = ColorProvider(evccPrice),
        accentDay = evccPrice, accentNight = evccPrice,
    )
    ForecastKind.CO2 -> Palette(
        accent = ColorProvider(day = evccCo2, night = co2Dark),
        headline = ColorProvider(day = evccCo2, night = co2Dark),
        accentDay = evccCo2, accentNight = co2Dark,
    )
    ForecastKind.FEEDIN -> Palette(
        accent = ColorProvider(day = evccDarkYellow, night = evccYellow),
        headline = ColorProvider(day = evccDarkYellow, night = evccYellow),
        accentDay = evccDarkYellow, accentNight = evccYellow,
    )
}
