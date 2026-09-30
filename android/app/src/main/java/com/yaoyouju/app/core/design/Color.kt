package com.yaoyouju.app.core.design

import androidx.compose.ui.graphics.Color

/**
 * 设计令牌（docs/design/README.md）。
 * 颜色不散落在页面里，统一从这里取。
 */
object AppColors {
    val Primary = Color(0xFF0F6E74)
    val PrimaryLight = Color(0xFFE3F1F2)
    val Bg = Color(0xFFF4F6F8)
    val Surface = Color(0xFFFFFFFF)
    val Border = Color(0xFFE4E8EE)
    val Text1 = Color(0xFF1B2230)
    val Text2 = Color(0xFF5C6675)
    val Text3 = Color(0xFF98A1AE)
    val Ok = Color(0xFF1E9E5A)
    val Warn = Color(0xFFC77700)
    val Error = Color(0xFFD93B3B)
    val Info = Color(0xFF2F6FD8)

    /** 状态色 10% 透明背景（用于状态标签 / 提示条） */
    fun tint(color: Color, alpha: Float = 0.1f) = color.copy(alpha = alpha)
}
