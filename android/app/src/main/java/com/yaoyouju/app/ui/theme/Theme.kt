package com.yaoyouju.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightScheme = lightColorScheme(
    primary = Primary,
    onPrimary = Surface,
    primaryContainer = PrimaryLight,
    onPrimaryContainer = Primary,
    background = Bg,
    onBackground = Text1,
    surface = Surface,
    onSurface = Text1,
    surfaceVariant = Bg,
    onSurfaceVariant = Text2,
    outline = Border,
    outlineVariant = Border,
    error = Error,
    onError = Surface,
)

@Composable
fun YyjTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    // 演示实现固定使用浅色主题（与设计稿一致）
    MaterialTheme(
        colorScheme = LightScheme,
        typography = YyjTypography,
        content = content,
    )
}
