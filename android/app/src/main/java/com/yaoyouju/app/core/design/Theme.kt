package com.yaoyouju.app.core.design

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = AppColors.Primary,
    onPrimary = AppColors.Surface,
    primaryContainer = AppColors.PrimaryLight,
    onPrimaryContainer = AppColors.Primary,
    secondary = AppColors.Info,
    onSecondary = AppColors.Surface,
    background = AppColors.Bg,
    onBackground = AppColors.Text1,
    surface = AppColors.Surface,
    onSurface = AppColors.Text1,
    surfaceVariant = AppColors.Bg,
    onSurfaceVariant = AppColors.Text2,
    outline = AppColors.Border,
    outlineVariant = AppColors.Border,
    error = AppColors.Error,
    onError = AppColors.Surface,
)

/** 全局 Material 3 主题：只使用设计规范里的颜色、字号、圆角。 */
@Composable
fun YaoyoujuTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}
