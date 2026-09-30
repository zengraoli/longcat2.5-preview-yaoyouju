package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** 简单选择弹层（检查类型 / 记录类型等） */
@Composable
fun SimpleChoiceDialogHost(
    title: String,
    options: List<String>,
    onSelect: (Int) -> Unit,
    onDismiss: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0x66000000))
            .clickable { onDismiss() },
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .padding(32.dp)
                .widthIn(max = 420.dp)
                .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
                .clickable(enabled = false) {}
                .padding(20.dp),
        ) {
            Text(text = title, color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
            options.forEachIndexed { index, option ->
                Text(
                    text = option,
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelect(index) }
                        .padding(vertical = 12.dp),
                )
            }
        }
    }
}
