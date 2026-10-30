package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val CosmicNightColorScheme = darkColorScheme(
    primary = GoldAccent,
    onPrimary = Color.Black,
    primaryContainer = CosmicSurfaceVariant,
    onPrimaryContainer = GoldAccent,
    secondary = NeonCyan,
    onSecondary = Color.Black,
    tertiary = CelestialViolet,
    background = CosmicNightBackground,
    onBackground = Color.White,
    surface = CosmicCardSurface,
    onSurface = Color.White,
    surfaceVariant = CosmicSurfaceVariant,
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = CosmicCardBorder,
    error = RetrogradeAlertRed
)

private val SolarCreamColorScheme = lightColorScheme(
    primary = SolarCreamPrimary,
    onPrimary = Color.White,
    primaryContainer = SolarCreamSurfaceVariant,
    onPrimaryContainer = SolarCreamPrimary,
    secondary = SolarCreamAccent,
    onSecondary = Color.White,
    tertiary = CelestialViolet,
    background = SolarCreamBackground,
    onBackground = Color(0xFF0F172A),
    surface = SolarCreamCardSurface,
    onSurface = Color(0xFF0F172A),
    surfaceVariant = SolarCreamSurfaceVariant,
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFE2E8F0),
    error = RetrogradeAlertRed
)

@Composable
fun AstroKPTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) CosmicNightColorScheme else SolarCreamColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
