package io.evcc.wear

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material.Colors
import androidx.wear.compose.material.MaterialTheme

/** Wear Compose MaterialTheme wired to [Theme]'s ARGB tokens. Wear OS is
 *  effectively always-dark (AMOLED, ambient mode), but we still read the
 *  system flag for consistency with the widget/tile dark-mode resolution. */
@Composable
fun EvccWearTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme() || true // Wear OS has no light theme in practice
    val colors = Colors(
        primary = Color(Theme.statusColor(active = true, heating = false, dark = dark)),
        primaryVariant = Color(Theme.EVCC_GREEN_DARKER),
        secondary = Color(Theme.EVCC_ORANGE),
        secondaryVariant = Color(Theme.EVCC_ORANGE),
        background = Color.Black,
        surface = Color(Theme.card(dark)),
        error = Color(Theme.EVCC_ORANGE),
        onPrimary = Color.Black,
        onSecondary = Color.Black,
        onBackground = Color(Theme.textPrimary(dark)),
        onSurface = Color(Theme.textPrimary(dark)),
        onSurfaceVariant = Color(Theme.textSecondary(dark)),
        onError = Color.Black,
    )
    MaterialTheme(colors = colors, content = content)
}

fun accentColor(heating: Boolean, dark: Boolean = true): Color =
    Color(if (heating) Theme.EVCC_ORANGE else if (dark) Theme.EVCC_GREEN else Theme.EVCC_GREEN_DARKER)
