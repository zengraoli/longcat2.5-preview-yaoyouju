package com.yaoyouju.app.feature.confusion

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A04 选择主要困惑 */
@Composable
fun ConfusionScreen(
    state: ConfusionUiState,
    onBack: () -> Unit,
    onSelect: (String) -> Unit,
    onToggleFormat: (String) -> Unit,
    onNext: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppColors.Bg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = AppDimens.PageMargin)
            .padding(bottom = 32.dp),
    ) {
        TopBar(
            title = "你现在最想解决什么",
            onBack = onBack,
            trailing = {
                Text(text = "第 2 / 4 步", color = AppColors.Text3, style = MaterialTheme.typography.bodySmall)
            },
        )

        Text(
            text = "选择一个最困扰你的问题（可稍后更改）。系统会按你的选择调整解释的重点、长度和形式。",
            color = AppColors.Text2,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(bottom = 16.dp),
        )

        CONFUSION_OPTIONS.forEach { option ->
            val selected = state.selected == option.key
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .background(
                        if (selected) AppColors.PrimaryLight else AppColors.Surface,
                        RoundedCornerShape(AppDimens.RadiusCard),
                    )
                    .border(
                        1.dp,
                        if (selected) AppColors.Primary else AppColors.Border,
                        RoundedCornerShape(AppDimens.RadiusCard),
                    )
                    .clickable { onSelect(option.key) }
                    .padding(14.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(
                            if (selected) AppColors.Primary else AppColors.Bg,
                            RoundedCornerShape(AppDimens.RadiusButton),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = option.icon,
                        contentDescription = null,
                        tint = if (selected) AppColors.Surface else AppColors.Primary,
                        modifier = Modifier.size(22.dp),
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = option.title, color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    Text(text = option.desc, color = AppColors.Text2, style = MaterialTheme.typography.bodySmall)
                }
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .background(
                            if (selected) AppColors.PrimaryLight else AppColors.Surface,
                            CircleShape,
                        )
                        .border(2.dp, if (selected) AppColors.Primary else AppColors.Border, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    if (selected) {
                        Box(modifier = Modifier.size(10.dp).background(AppColors.Primary, CircleShape))
                    }
                }
            }
        }

        AppCard(modifier = Modifier.padding(top = 4.dp)) {
            Text(text = "希望的解释方式", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
            ChipRow(modifier = Modifier.padding(top = 12.dp, bottom = 12.dp)) {
                FORMAT_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.formats.contains(option)) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onToggleFormat(option) },
                    )
                }
            }
            Text(
                text = "不会根据你的选择给你贴任何标签，也不会为了让你更安心而改写事实。",
                color = AppColors.Text2,
                style = MaterialTheme.typography.bodySmall,
            )
        }

        AppButton(
            text = "下一步",
            onClick = onNext,
            block = true,
            modifier = Modifier.padding(top = 16.dp),
        )
    }
}
