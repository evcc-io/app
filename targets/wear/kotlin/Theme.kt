package io.evcc.wear

/**
 * evcc brand + energy color tokens as raw ARGB ints, for protolayout
 * (`ColorBuilders.argb(...)`) and as `Color(Theme.X)` in Compose. Values
 * mirror targets/android-widget/kotlin/Theme.kt (widget #255) and
 * targets/widget/Colors.swift.
 */
object Theme {
    const val EVCC_GREEN = 0xFF0FDE41.toInt()        // brand green (dark UI)
    const val EVCC_GREEN_DARKER = 0xFF0BA631.toInt() // brand green (light UI)
    const val EVCC_ORANGE = 0xFFFF9000.toInt()       // heating
    const val EVCC_YELLOW = 0xFFFFCC00.toInt()       // grid export
    const val GRAY_MEDIUM = 0xFF93949E.toInt()       // inactive

    const val CARD_DARK = 0xFF1C1C1E.toInt()
    const val CARD_LIGHT = 0xFFFFFFFF.toInt()
    const val TEXT_PRIMARY_DAY = 0xFF1C1C1E.toInt()
    const val TEXT_PRIMARY_NIGHT = 0xFFFFFFFF.toInt()
    const val TEXT_SECONDARY_DAY = 0x991C1C1E.toInt()   // 60% ink
    const val TEXT_SECONDARY_NIGHT = 0xB3FFFFFF.toInt() // 70% white

    private const val MODE_BG_LIGHT = 0xFFF0F1F3.toInt()
    private const val MODE_BG_DARK = 0xFF000000.toInt()
    private const val MODE_TEXT_LIGHT = 0xFF7C7D8A.toInt()
    private const val MODE_TEXT_DARK = 0xFF9A9A9A.toInt()

    private const val TRACK_LIGHT = 0xFFECEEF0.toInt()
    private const val TRACK_DARK = 0xFF38383A.toInt()

    fun card(dark: Boolean) = if (dark) CARD_DARK else CARD_LIGHT
    fun textPrimary(dark: Boolean) = if (dark) TEXT_PRIMARY_NIGHT else TEXT_PRIMARY_DAY
    fun textSecondary(dark: Boolean) = if (dark) TEXT_SECONDARY_NIGHT else TEXT_SECONDARY_DAY

    fun modeSelectedBg(dark: Boolean) = if (dark) 0xFFFFFFFF.toInt() else 0xFF000000.toInt()
    fun modeSelectedText(dark: Boolean) = if (dark) 0xFF000000.toInt() else 0xFFFFFFFF.toInt()
    fun modeUnselectedBg(dark: Boolean) = if (dark) MODE_BG_DARK else MODE_BG_LIGHT
    fun modeUnselectedText(dark: Boolean) = if (dark) MODE_TEXT_DARK else MODE_TEXT_LIGHT

    fun track(dark: Boolean) = if (dark) TRACK_DARK else TRACK_LIGHT

    /** gray unless active; brand green (darker in light mode) unless heating, then orange. */
    fun statusColor(active: Boolean, heating: Boolean, dark: Boolean): Int = when {
        !active -> GRAY_MEDIUM
        heating -> EVCC_ORANGE
        else -> if (dark) EVCC_GREEN else EVCC_GREEN_DARKER
    }

    fun barFill(connected: Boolean, heating: Boolean, dark: Boolean): Int = when {
        !connected -> GRAY_MEDIUM
        heating -> EVCC_ORANGE
        else -> if (dark) EVCC_GREEN else EVCC_GREEN_DARKER
    }
}
