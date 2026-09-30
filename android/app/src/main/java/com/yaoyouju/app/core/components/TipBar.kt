package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** 提示条三种：信息提示 / 提醒 / 就医提示 */
enum class TipBarType { Info, Warn, Error }

@Composable
fun TipBar(
    text: String,
    modifier: Modifier = Modifier,
    type: TipBarType = TipBarType.Info,
) {
    val fg = when (type) {
        TipBarType.Info -> AppColors.Primary
        TipBarType.Warn -> AppColors.Warn
        TipBarType.Error -> AppColors.Error
    }
    val bg = when (type) {
        TipBarType.Info -> AppColors.PrimaryLight
        TipBarType.Warn -> AppColors.tint(AppColors.Warn, 0.08f)
        TipBarType.Error -> AppColors.tint(AppColors.Error, 0.08f)
    }
    val iconName = when (type) {
        TipBarType.Info -> AppIcons.Info
        TipBarType.Warn -> AppIcons.Warning
        TipBarType.Error -> AppIcons.Warning
    }
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(bg, RoundedCornerShape(AppDimens.RadiusCard))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Icon(
            imageVector = iconName,
            contentDescription = null,
            tint = fg,
            modifier = Modifier.size(18.dp),
        )
        Text(
            text = text,
            color = fg,
            style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
            modifier = Modifier.weight(1f),
        )
    }
}

/** 就医提示入口：全局可达，无需登录 */
@Composable
fun EmergencyBar(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    text: String = "出现严重症状？无需登录，立即查看就医提示",
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(AppColors.tint(AppColors.Error, 0.08f), RoundedCornerShape(AppDimens.RadiusCard))
            .clickable { onClick() }
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = AppIcons.Warning,
            contentDescription = null,
            tint = AppColors.Error,
            modifier = Modifier.size(18.dp),
        )
        Text(
            text = text,
            color = AppColors.Error,
            style = androidx.compose.material3.MaterialTheme.typography.labelMedium,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
fun Dot(color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(6.dp)
            .background(color, RoundedCornerShape(3.dp)),
    )
}
