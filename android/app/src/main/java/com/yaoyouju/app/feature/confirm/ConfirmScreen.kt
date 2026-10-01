package com.yaoyouju.app.feature.confirm

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppCheckbox
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.ChineseDatePickerDialog
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A02 当前关键变化确认（R01/R03） */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfirmScreen(
    state: ConfirmUiState,
    onBack: () -> Unit,
    onSelectChange: (String) -> Unit,
    onToggleRedFlag: (String) -> Unit,
    onToggleNone: () -> Unit,
    onToggleUncertain: () -> Unit,
    onSelectSide: (String) -> Unit,
    onSelectOnset: (String) -> Unit,
    onSetOnsetDate: (String) -> Unit,
    onShowDatePicker: (Boolean) -> Unit,
    onNext: () -> Unit,
    onSkip: () -> Unit,
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
            title = "当前关键变化确认",
            onBack = onBack,
            trailing = {
                Text(
                    text = "第 ${state.step} / 4 步",
                    color = AppColors.Text3,
                    style = MaterialTheme.typography.bodySmall,
                )
            },
        )

        TipBar(
            text = "先确认最近的变化。没有回答的问题会记录为“尚未确认”，不会被当作“没有”。",
            type = TipBarType.Info,
        )

        // 1. 变化
        AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
            QuestionTitle("1. 与上次记录相比，最近腰痛或腿部症状有变化吗？")
            ChipRow {
                CHANGE_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.change == option) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onSelectChange(option) },
                    )
                }
            }
        }

        // 2. 红旗信号
        AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
            QuestionTitle("2. 最近是否出现以下任一情况？（可多选）")
            Text(
                text = "这些变化需要医生及时评估，出现时会优先提示就医。",
                color = AppColors.Text2,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(bottom = 12.dp),
            )
            RED_FLAG_OPTIONS.forEach { option ->
                CheckOption(
                    text = option,
                    checked = state.redFlags.contains(option),
                    onClick = { onToggleRedFlag(option) },
                )
            }
            CheckOption(
                text = "以上都没有",
                checked = state.noneSelected,
                highlight = true,
                onClick = onToggleNone,
            )
            CheckOption(
                text = "不确定 / 记不清",
                checked = state.uncertain,
                onClick = onToggleUncertain,
            )
        }

        // 3. 侧别
        AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
            QuestionTitle("3. 疼痛或麻木主要涉及哪一侧？")
            ChipRow {
                SIDE_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.side == option) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onSelectSide(option) },
                    )
                }
            }
        }

        // 4. 开始时间
        AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
            QuestionTitle("4. 这次症状大约从什么时候开始？")
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusButton))
                    .border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusButton))
                    .clickable { onShowDatePicker(true) }
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = state.onsetDate.ifBlank { "选择日期，或点“记不清”" },
                    color = if (state.onsetDate.isBlank()) AppColors.Text3 else AppColors.Text1,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f),
                )
                Icon(
                    imageVector = AppIcons.Calendar,
                    contentDescription = null,
                    tint = AppColors.Text3,
                    modifier = Modifier.size(18.dp),
                )
            }
            ChipRow(modifier = Modifier.padding(top = 12.dp)) {
                ONSET_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.onset == option) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onSelectOnset(option) },
                    )
                }
            }
        }

        AppButton(
            text = "下一步",
            onClick = onNext,
            block = true,
            enabled = !state.submitting,
            modifier = Modifier.padding(top = 16.dp),
        )
        Text(
            text = "先看已审核科普，稍后再填",
            color = AppColors.Primary,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onSkip() }
                .padding(vertical = 16.dp),
        )
    }

    if (state.showDatePicker) {
        ChineseDatePickerDialog(
            initial = state.onsetDate,
            onSelect = { onSetOnsetDate(it); onShowDatePicker(false) },
            onDismiss = { onShowDatePicker(false) },
        )
    }
}

@Composable
private fun QuestionTitle(text: String) {
    Text(
        text = text,
        color = AppColors.Text1,
        style = MaterialTheme.typography.titleSmall,
        modifier = Modifier.padding(bottom = 12.dp),
    )
}

@Composable
private fun CheckOption(
    text: String,
    checked: Boolean,
    onClick: () -> Unit,
    highlight: Boolean = false,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 10.dp)
            .background(
                if (highlight && checked) AppColors.PrimaryLight else AppColors.Surface,
                RoundedCornerShape(AppDimens.RadiusButton),
            )
            .border(
                1.dp,
                if (highlight && checked) AppColors.Primary else AppColors.Border,
                RoundedCornerShape(AppDimens.RadiusButton),
            )
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        AppCheckbox(checked = checked, onToggle = onClick)
        Text(text = text, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
    }
}
