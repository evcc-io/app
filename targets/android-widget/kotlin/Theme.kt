package io.evcc.android.widget

import androidx.compose.ui.graphics.Color
import androidx.glance.text.FontWeight
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider

// evcc brand green, mirrors the iOS widget Colors.swift / themes.json
private val evccGreen = Color(0xFF0FDE41)
private val onSurface = Color(0xFFFFFFFF)
private val onSurfaceMuted = Color(0xB3FFFFFF) // 70% white

val titleStyle = TextStyle(
    color = ColorProvider(onSurface),
    fontWeight = FontWeight.Medium,
)

val subtle = TextStyle(
    color = ColorProvider(onSurfaceMuted),
)

val accent = ColorProvider(evccGreen)
