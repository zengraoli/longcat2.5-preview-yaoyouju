package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** 输入框：白底、1dp 描边、圆角 10、高 48。 */
@Composable
fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    keyboardType: KeyboardType = KeyboardType.Text,
    maxLength: Int = Int.MAX_VALUE,
    singleLine: Boolean = true,
    minHeight: Int = 48,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(minHeight.dp)
            .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusButton))
            .border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusButton))
            .padding(horizontal = 14.dp),
        contentAlignment = Alignment.CenterStart,
    ) {
        if (value.isEmpty()) {
            Text(text = placeholder, color = AppColors.Text3, style = MaterialTheme.typography.bodyMedium)
        }
        BasicTextField(
            value = value,
            onValueChange = { if (it.length <= maxLength) onValueChange(it) },
            textStyle = MaterialTheme.typography.bodyMedium.copy(color = AppColors.Text1),
            cursorBrush = SolidColor(AppColors.Primary),
            singleLine = singleLine,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/** 多行输入框（报告粘贴等） */
@Composable
fun AppTextArea(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    minHeight: Int = 160,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = minHeight.dp)
            .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusButton))
            .border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusButton))
            .padding(14.dp),
    ) {
        if (value.isEmpty()) {
            Text(text = placeholder, color = AppColors.Text3, style = MaterialTheme.typography.bodyMedium)
        }
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            textStyle = MaterialTheme.typography.bodyMedium.copy(color = AppColors.Text1),
            cursorBrush = SolidColor(AppColors.Primary),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/** 复选框：20×20，圆角 4，选中为主色。 */
@Composable
fun AppCheckbox(checked: Boolean, onToggle: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(20.dp)
            .background(
                if (checked) AppColors.Primary else AppColors.Surface,
                RoundedCornerShape(AppDimens.RadiusLabel),
            )
            .border(1.dp, if (checked) AppColors.Primary else AppColors.Border, RoundedCornerShape(AppDimens.RadiusLabel))
            .clickable { onToggle() },
        contentAlignment = Alignment.Center,
    ) {
        if (checked) {
            Icon(
                imageVector = AppIcons.Check,
                contentDescription = null,
                tint = AppColors.Surface,
                modifier = Modifier.size(14.dp),
            )
        }
    }
}

/** 单选行（芯片式）：已选 / 未选 */
@Composable
fun SelectRow(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    trailing: String? = null,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(
                if (selected) AppColors.PrimaryLight else AppColors.Surface,
                RoundedCornerShape(AppDimens.RadiusButton),
            )
            .border(
                1.dp,
                if (selected) AppColors.Primary else AppColors.Border,
                RoundedCornerShape(AppDimens.RadiusButton),
            )
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = text,
            color = if (selected) AppColors.Primary else AppColors.Text1,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f),
        )
        if (trailing != null) {
            Text(text = trailing, color = AppColors.Text3, style = MaterialTheme.typography.bodySmall)
        }
    }
}

/** 字段标签 */
@Composable
fun FieldLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        color = AppColors.Text1,
        style = MaterialTheme.typography.bodyMedium,
        modifier = modifier.padding(top = 12.dp, bottom = 6.dp),
    )
}
