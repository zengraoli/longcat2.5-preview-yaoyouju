package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens
import java.time.LocalDate

/**
 * 中文日期选择器：用年 / 月 / 日三个数字输入框，避免系统语言为英文时
 * Material3 DatePicker 显示英文界面。
 */
@Composable
fun ChineseDatePickerDialog(
    initial: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val today = remember { LocalDate.now() }
    var year by remember { mutableStateOf(initial.take(4).toIntOrNull() ?: today.year) }
    var month by remember { mutableStateOf(initial.drop(5).take(2).toIntOrNull() ?: today.monthValue) }
    var day by remember { mutableStateOf(initial.drop(8).take(2).toIntOrNull() ?: today.dayOfMonth) }
    var error by remember { mutableStateOf<String?>(null) }

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
            Text(text = "选择日期", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                NumberField(value = year.toString(), label = "年", modifier = Modifier.weight(1.4f)) {
                    year = it.filter { c -> c.isDigit() }.take(4).toIntOrNull() ?: year
                }
                NumberField(value = month.toString(), label = "月", modifier = Modifier.weight(1f)) {
                    month = it.filter { c -> c.isDigit() }.take(2).toIntOrNull() ?: month
                }
                NumberField(value = day.toString(), label = "日", modifier = Modifier.weight(1f)) {
                    day = it.filter { c -> c.isDigit() }.take(2).toIntOrNull() ?: day
                }
            }
            error?.let {
                Text(
                    text = it,
                    color = AppColors.Error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
            AppButton(
                text = "确定",
                onClick = {
                    val date = runCatching { LocalDate.of(year, month.coerceIn(1, 12), day.coerceIn(1, 31)) }.getOrNull()
                    if (date == null) {
                        error = "日期不合法，请重新输入"
                    } else {
                        onSelect(date.toString())
                    }
                },
                block = true,
                modifier = Modifier.padding(top = 16.dp),
            )
            Text(
                text = "取消",
                color = AppColors.Text2,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().clickable { onDismiss() }.padding(vertical = 12.dp),
            )
        }
    }
}

@Composable
private fun NumberField(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
    onValueChange: (String) -> Unit,
) {
    Column(modifier = modifier) {
        Text(text = label, color = AppColors.Text2, style = MaterialTheme.typography.labelMedium)
        Box(modifier = Modifier.padding(top = 4.dp)) {
            AppTextField(
                value = value,
                onValueChange = onValueChange,
                keyboardType = KeyboardType.Number,
                maxLength = 4,
            )
        }
    }
}
