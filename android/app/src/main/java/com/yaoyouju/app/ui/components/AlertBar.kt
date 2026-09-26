package com.yaoyouju.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.ErrorTint
import com.yaoyouju.app.ui.theme.Info
import com.yaoyouju.app.ui.theme.InfoTint
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Warn
import com.yaoyouju.app.ui.theme.WarnTint

enum class AlertType { INFO, WARN, ERROR }

/** 提示条三种（信息提示、提醒、就医提示） */
@Composable
fun AlertBar(text: String, type: AlertType, modifier: Modifier = Modifier) {
    val (bg, fg, icon) = when (type) {
        AlertType.INFO -> Triple(InfoTint, Info, Icons.Filled.Info)
        AlertType.WARN -> Triple(WarnTint, Warn, Icons.Filled.Warning)
        AlertType.ERROR -> Triple(ErrorTint, Error, Icons.Filled.Error)
    }
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(bg, RoundedCornerShape(Dimens.cardRadius))
            .padding(horizontal = Dimens.cardPadding, vertical = Dimens.cardPadding),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(icon, contentDescription = null, tint = fg, modifier = Modifier.padding(top = 1.dp))
        Text(text = text, color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
    }
}
