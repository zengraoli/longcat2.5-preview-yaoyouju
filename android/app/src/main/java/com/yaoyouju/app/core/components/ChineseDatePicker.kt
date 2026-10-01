package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
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
                NumberField(value = year.toString(), label = "年", maxLength = 4, modifier = Modifier.weight(1.4f)) {
                    year = it.toIntOrNull() ?: year
                }
                NumberField(value = month.toString(), label = "月", maxLength = 2, modifier = Modifier.weight(1f)) {
                    month = it.toIntOrNull() ?: month
                }
                NumberField(value = day.toString(), label = "日", maxLength = 2, modifier = Modifier.weight(1f)) {
                    day = it.toIntOrNull() ?: day
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
    maxLength: Int,
    modifier: Modifier = Modifier,
    onValueChange: (String) -> Unit,
) {
    // 内部保留原始文本（允许为空），聚焦时全选，输入时替换而不是追加
    var text by remember { mutableStateOf(TextFieldValue(value, TextRange(value.length))) }
    LaunchedEffect(value) {
        if (text.text != value) {
            text = TextFieldValue(value, TextRange(value.length))
        }
    }
    Column(modifier = modifier) {
        Text(text = label, color = AppColors.Text2, style = MaterialTheme.typography.labelMedium)
        Box(
            modifier = Modifier
                .padding(top = 4.dp)
                .background(AppColors.Bg, RoundedCornerShape(AppDimens.RadiusButton))
                .border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusButton))
                .padding(horizontal = 14.dp),
        ) {
            BasicTextField(
                value = text,
                onValueChange = { newValue ->
                    val filtered = newValue.text.filter { it.isDigit() }.take(maxLength)
                    // 全选状态下输入会替换；否则保留用户输入（含空）
                    text = TextFieldValue(filtered, TextRange(filtered.length))
                    onValueChange(filtered)
                },
                textStyle = MaterialTheme.typography.bodyMedium.copy(color = AppColors.Text1),
                cursorBrush = androidx.compose.ui.graphics.SolidColor(AppColors.Primary),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .onFocusChanged { focus ->
                        if (focus.isFocused) {
                            text = text.copy(selection = TextRange(0, text.text.length))
                        }
                    },
            )
        }
    }
}
