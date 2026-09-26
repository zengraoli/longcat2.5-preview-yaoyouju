package com.yaoyouju.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.ErrorTint
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Text1

/**
 * 紧急就医提示弹窗（全局可达，不被登录、付费、上传或长问卷阻断）。
 */
@Composable
fun EmergencyDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Filled.Warning, contentDescription = null, tint = Error) },
        title = { Text("紧急就医提示") },
        text = {
            Text(
                "如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。",
                color = Text1,
                fontSize = 14.sp,
                lineHeight = 22.sp,
            )
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("我知道了", color = Primary)
            }
        },
    )
}

/**
 * 紧急就医提示条（全局可达）。
 */
@Composable
fun EmergencyBar(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(ErrorTint, RoundedCornerShape(Dimens.cardRadius))
            .padding(horizontal = Dimens.cardPadding, vertical = Dimens.cardPadding)
            .clickable(onClick = onClick),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(Icons.Filled.Warning, contentDescription = null, tint = Error)
        Text(
            text = text,
            color = Error,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1f),
        )
    }
}
