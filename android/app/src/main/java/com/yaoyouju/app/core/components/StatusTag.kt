package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** 状态标签色调 */
enum class TagTone { Ok, Warn, Error, Info, Neutral }

/**
 * 状态标签：三端语义完全一致。
 * 未显式指定色调时按文案自动推断（与 App 端 StatusTag.vue 一致）。
 */
fun tagToneOf(label: String, explicit: TagTone? = null): TagTone {
    if (explicit != null && explicit != TagTone.Neutral) return explicit
    return when (label) {
        "已确认", "已审核 v2", "已审核", "已发布", "通过" -> TagTone.Ok
        "尚未确认", "未经核实", "待确认", "待审" -> TagTone.Warn
        "有冲突", "已下线 · 更正中", "已撤回" -> TagTone.Error
        "系统生成", "不作诊断", "报告原文" -> TagTone.Info
        else -> TagTone.Neutral
    }
}

private fun toneColor(tone: TagTone): Color = when (tone) {
    TagTone.Ok -> AppColors.Ok
    TagTone.Warn -> AppColors.Warn
    TagTone.Error -> AppColors.Error
    TagTone.Info -> AppColors.Info
    TagTone.Neutral -> AppColors.Text2
}

@Composable
fun StatusTag(label: String, modifier: Modifier = Modifier, tone: TagTone? = null) {
    val t = tagToneOf(label, tone)
    val fg = toneColor(t)
    val bg = if (t == TagTone.Neutral) AppColors.Bg else AppColors.tint(fg, 0.1f)
    Text(
        text = label,
        color = fg,
        style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
        modifier = modifier
            .background(bg, RoundedCornerShape(AppDimens.RadiusLabel))
            .padding(horizontal = 8.dp, vertical = 1.dp),
    )
}
