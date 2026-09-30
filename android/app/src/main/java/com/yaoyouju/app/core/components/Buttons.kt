package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** 按钮类型：主按钮 / 次按钮 / 柔和 / 危险·就医 */
enum class AppButtonType { Primary, Secondary, Soft, Danger }

@Composable
fun AppButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    type: AppButtonType = AppButtonType.Primary,
    block: Boolean = false,
    enabled: Boolean = true,
) {
    val bg: Color = when (type) {
        AppButtonType.Primary -> AppColors.Primary
        AppButtonType.Secondary -> AppColors.Surface
        AppButtonType.Soft -> AppColors.PrimaryLight
        AppButtonType.Danger -> AppColors.Error
    }
    val fg: Color = when (type) {
        AppButtonType.Primary, AppButtonType.Danger -> AppColors.Surface
        AppButtonType.Secondary, AppButtonType.Soft -> AppColors.Primary
    }
    val border = if (type == AppButtonType.Secondary) Modifier.border(1.dp, AppColors.Primary, RoundedCornerShape(AppDimens.RadiusButton)) else Modifier
    Box(
        modifier = modifier
            .then(if (block) Modifier.fillMaxWidth() else Modifier)
            .then(border)
            .defaultMinSize(minHeight = AppDimens.MinTouch)
            .background(bg, RoundedCornerShape(AppDimens.RadiusButton))
            .alpha(if (enabled) 1f else 0.5f)
            .clickable(enabled = enabled) { onClick() }
            .padding(horizontal = 20.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text = text, color = fg, style = androidx.compose.material3.MaterialTheme.typography.labelLarge)
    }
}

/** 芯片：已选 / 未选 / 跳过 */
enum class AppChipState { Selected, Unselected, Skip }

@Composable
fun AppChip(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    state: AppChipState = AppChipState.Unselected,
) {
    val bg = when (state) {
        AppChipState.Selected -> AppColors.Primary
        AppChipState.Unselected -> AppColors.Surface
        AppChipState.Skip -> Color.Transparent
    }
    val fg = when (state) {
        AppChipState.Selected -> AppColors.Surface
        AppChipState.Unselected -> AppColors.Text1
        AppChipState.Skip -> AppColors.Text3
    }
    val border = when (state) {
        AppChipState.Unselected -> Modifier.border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusChip))
        else -> Modifier
    }
    Box(
        modifier = modifier
            .then(border)
            .defaultMinSize(minHeight = AppDimens.MinTouch)
            .background(bg, RoundedCornerShape(AppDimens.RadiusChip))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text = text, color = fg, style = androidx.compose.material3.MaterialTheme.typography.labelMedium)
    }
}

/** 芯片行容器：横向可换行 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ChipRow(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    FlowRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(AppDimens.BlockGap),
        verticalArrangement = Arrangement.spacedBy(AppDimens.BlockGap),
    ) {
        content()
    }
}
