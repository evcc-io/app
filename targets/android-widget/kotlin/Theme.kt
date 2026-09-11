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

private val widgetCardDark = Color(0xFF1C1C1E)
private val onGreen = Color(0xFF0A2912)
private val onGreenSoft = Color(0xFF0A3D18)
private val modeBgLight = Color(0xFFF0F1F3)
private val modeBgDark = Color.Black
private val modeTextLight = Color(0xFF7C7D8A)
private val modeTextDark = Color(0xFF9A9A9A)

// approximates SwiftUI's semantic .primary / .secondary on each background
private val textPrimaryDay = Color(0xFF1C1C1E)
private val textSecondaryDay = Color(0x991C1C1E) // 60% ink
private val textSecondaryNight = Color(0xB3FFFFFF) // 70% white

// -- card chrome --

val cardBackground: ColorProvider = ColorProvider(day = Color.White, night = widgetCardDark)
val notConfiguredBackground: ColorProvider = ColorProvider(evccDarkGreen)

// -- typography: four sizes only - 36 (value), 20 (1x1 value), 14 (title, unit), 12 (the rest) --

val textPrimary: ColorProvider = ColorProvider(day = textPrimaryDay, night = Color.White)
val textSecondary: ColorProvider = ColorProvider(day = textSecondaryDay, night = textSecondaryNight)

val titleStyle = TextStyle(color = textPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
val metricUnitStyle = TextStyle(color = textSecondary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
val metricSmallStyle = TextStyle(color = textPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold) // 1x1, "33.9 °C" must fit
val metricLargeStyle = TextStyle(color = textPrimary, fontSize = 36.sp, fontWeight = FontWeight.Bold) // 2x1+, spans the name/status stack
val metricUnitSmallStyle = TextStyle(color = textSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
val secondaryStyle = TextStyle(color = textSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium) // 1x1 power, message bodies
val powerCompactLargeStyle = TextStyle(color = textSecondary, fontSize = 14.sp, fontWeight = FontWeight.Medium) // 2x1
val statusStyle = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium)

val notConfiguredTitleStyle = titleStyle.copy(color = ColorProvider(onGreen))
val notConfiguredBodyStyle = secondaryStyle.copy(color = ColorProvider(onGreenSoft))

// -- loadpoint status / mode chip colors --

/** gray unless active; brand green (darker in light mode) unless heating, then orange. */
fun statusColor(active: Boolean, heating: Boolean): ColorProvider = when {
    !active -> ColorProvider(bsGrayMedium)
    heating -> ColorProvider(evccOrange)
    else -> ColorProvider(day = evccDarkerGreen, night = evccDarkGreen)
}

// progress strip fill as raw ARGB, rendered via ProgressBarRenderer
private val evccDarkGreenArgb = evccDarkGreen.toArgb()
private val evccDarkerGreenArgb = evccDarkerGreen.toArgb()
private val evccOrangeArgb = evccOrange.toArgb()
private val bsGrayMediumArgb = bsGrayMedium.toArgb()

fun barFillColor(connected: Boolean, heating: Boolean): Int = when {
    !connected -> bsGrayMediumArgb
    heating -> evccOrangeArgb
    else -> evccDarkGreenArgb
}

private val orangeStripeArgb = Color(0xFFCC7400).toArgb()
fun barStripeColor(heating: Boolean): Int = if (heating) orangeStripeArgb else evccDarkerGreenArgb

private val trackLight = Color(0xFFECEEF0)
private val trackDark = Color(0xFF38383A)
val barTrack: ColorProvider = ColorProvider(day = trackLight, night = trackDark)
fun barTrackColorArgb(dark: Boolean): Int = (if (dark) trackDark else trackLight).toArgb()

/**
 * Bottom-edge strip fill (drawn over the themed track): progress when known,
 * striped while charging/heating (like the web UI); a full striped bar when
 * charging without a known progress. Null = no strip at all.
 */
fun stripBitmap(lp: Loadpoint): android.graphics.Bitmap? {
    val heating = lp.chargerFeatureHeating
    val active = status(lp).active
    val fill = metric(lp).fill ?: if (active) 1.0 else return null
    return ProgressBarRenderer.strip(
        fill, barFillColor(lp.connected, heating),
        stripeColor = if (active) barStripeColor(heating) else null,
    )
}

// selected chip inverts against the card (like a filled/primary button); mirrors
// AnyShapeStyle(.primary) in LoadpointViews.swift's modeSelector.
val modeSelectedBackground: ColorProvider = ColorProvider(day = Color.Black, night = Color.White)
val modeSelectedText: ColorProvider = ColorProvider(day = Color.White, night = Color.Black)
val modeUnselectedBackground: ColorProvider = ColorProvider(day = modeBgLight, night = modeBgDark)
val modeUnselectedText: ColorProvider = ColorProvider(day = modeTextLight, night = modeTextDark)
val modeSelectedStyle = TextStyle(color = modeSelectedText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
val modeUnselectedStyle = TextStyle(color = modeUnselectedText, fontSize = 12.sp, fontWeight = FontWeight.Medium)

// -- same colors as raw ARGB ints, for the plain-Views config-screen preview
// (WidgetPreview.kt) - it can't use Glance's day/night ColorProvider directly. --

private val widgetCardDarkArgb = widgetCardDark.toArgb()
private val textPrimaryDayArgb = textPrimaryDay.toArgb()
private val textSecondaryDayArgb = textSecondaryDay.toArgb()
private val textSecondaryNightArgb = textSecondaryNight.toArgb()

fun cardBackgroundArgb(dark: Boolean): Int = if (dark) widgetCardDarkArgb else Color.White.toArgb()
fun textPrimaryArgb(dark: Boolean): Int = if (dark) Color.White.toArgb() else textPrimaryDayArgb
fun textSecondaryArgb(dark: Boolean): Int = if (dark) textSecondaryNightArgb else textSecondaryDayArgb

fun modeSelectedBackgroundArgb(dark: Boolean): Int = (if (dark) Color.White else Color.Black).toArgb()
fun modeSelectedTextArgb(dark: Boolean): Int = (if (dark) Color.Black else Color.White).toArgb()
fun modeUnselectedBackgroundArgb(dark: Boolean): Int = (if (dark) modeBgDark else modeBgLight).toArgb()
fun modeUnselectedTextArgb(dark: Boolean): Int = (if (dark) modeTextDark else modeTextLight).toArgb()

fun statusColorArgb(active: Boolean, heating: Boolean, dark: Boolean): Int = when {
    !active -> bsGrayMediumArgb
    heating -> evccOrangeArgb
    else -> if (dark) evccDarkGreenArgb else evccDarkerGreenArgb
}


// -- forecast per-type accent (mirrors Theme.swift's Palette.make) -- only
// headline + the raw day/night colors ChartRenderer needs are kept; the old
// unused `accent` ColorProvider field is dropped, matching the four-sizes-
// only trim the rest of this file already went through.

data class ForecastPalette(val headline: ColorProvider, val accentDay: Color, val accentNight: Color)

fun forecastPalette(kind: ForecastKind): ForecastPalette = when (kind) {
    ForecastKind.SOLAR -> ForecastPalette(ColorProvider(day = evccDarkerGreen, night = evccDarkGreen), evccDarkerGreen, evccDarkGreen)
    ForecastKind.PRICE -> ForecastPalette(ColorProvider(evccPrice), evccPrice, evccPrice)
    ForecastKind.CO2 -> ForecastPalette(ColorProvider(day = evccCo2, night = co2Dark), evccCo2, co2Dark)
    ForecastKind.FEEDIN -> ForecastPalette(ColorProvider(day = evccDarkYellow, night = evccYellow), evccDarkYellow, evccYellow)
}

// -- forecast header/footer text: title/body reuse titleStyle/secondaryStyle
// and notConfiguredTitleStyle/notConfiguredBodyStyle directly (same role, same
// look as Loadpoint's message states) - only the header value/unit and footer
// stat rows are genuinely forecast-specific, so only those get new styles.

val forecastHeaderStyle = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.Bold) // colored per palette
val forecastHeaderUnitStyle = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold) // colored per palette
val forecastFooterStyle = TextStyle(color = textSecondary, fontSize = 10.sp, fontWeight = FontWeight.Medium)
val forecastFooterEmphasisStyle = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold) // colored per side
