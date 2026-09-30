package com.yaoyouju.app.feature.record

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.AppTextArea
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A11 记录今天（R01/R05） */
@Composable
fun RecordScreen(
    state: RecordUiState,
    onBack: () -> Unit,
    onSelectSit: (String) -> Unit,
    onSelectPlanned: (String) -> Unit,
    onSelectSleep: (Int) -> Unit,
    onSelectChange: (String) -> Unit,
    onSelectLeg: (String) -> Unit,
    onToggleActivity: (String) -> Unit,
    onTopWorryChange: (String) -> Unit,
    onSave: () -> Unit,
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
            title = "记录今天",
            onBack = onBack,
            trailing = {
                Text(
                    text = "约 1 分钟",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier
                        .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusLabel))
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                )
            },
        )

        Row(
            modifier = Modifier.padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Icon(
                imageVector = AppIcons.Course,
                contentDescription = null,
                tint = AppColors.Text3,
                modifier = Modifier.size(16.dp),
            )
            Text(
                text = "${state.date} · 每个问题都可以跳过，跳过会记为“尚未确认”",
                color = AppColors.Text2,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.weight(1f),
            )
        }

        // 1. 能坐多久
        AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
            Question("今天能坐多久？")
            ChipRow {
                SIT_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.sitMinutes == option) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onSelectSit(option) },
                    )
                }
                AppChip(
                    text = "跳过",
                    state = if (state.sitMinutes == null) AppChipState.Skip else AppChipState.Unselected,
                    onClick = { onSelectSit(state.sitMinutes ?: "") },
                )
            }
        }

        // 2. 能否完成计划活动
        AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
            Question("能否完成原本计划的活动？")
            ChipRow {
                PLANNED_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.plannedActivityDone == option) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onSelectPlanned(option) },
                    )
                }
                AppChip(
                    text = "跳过",
                    state = if (state.plannedActivityDone == null) AppChipState.Skip else AppChipState.Unselected,
                    onClick = { onSelectPlanned(state.plannedActivityDone ?: "") },
                )
            }
        }

        // 3. 睡眠
        AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
            Question("睡眠受影响程度")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SLEEP_OPTIONS.forEach { (value, label) ->
                    val selected = state.sleepImpact == value
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                if (selected) AppColors.Primary else AppColors.Surface,
                                RoundedCornerShape(AppDimens.RadiusButton),
                            )
                            .border(
                                1.dp,
                                if (selected) AppColors.Primary else AppColors.Border,
                                RoundedCornerShape(AppDimens.RadiusButton),
                            )
                            .clickable { onSelectSleep(value) }
                            .padding(vertical = 12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = "$value",
                            color = if (selected) AppColors.Surface else AppColors.Text1,
                            style = MaterialTheme.typography.titleSmall,
                        )
                        Text(
                            text = label,
                            color = if (selected) AppColors.Surface else AppColors.Text2,
                            style = MaterialTheme.typography.labelSmall,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
            }
        }

        // 4. 与昨天相比
        AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
            Question("与昨天相比")
            ChipRow {
                CHANGE_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.changeVsYesterday == option) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onSelectChange(option) },
                    )
                }
                AppChip(
                    text = "跳过",
                    state = if (state.changeVsYesterday == null) AppChipState.Skip else AppChipState.Unselected,
                    onClick = { onSelectChange(state.changeVsYesterday ?: "") },
                )
            }
        }

        // 5. 腿部
        AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
            Question("今天有腿部麻木或无力吗？")
            Text(
                text = "不会沿用昨天的答案——如果你今天不确定，请选“尚未确认”。",
                color = AppColors.Text2,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(bottom = 12.dp),
            )
            ChipRow {
                LEG_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.legChange == option) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onSelectLeg(option) },
                    )
                }
            }
        }

        // 6. 今天做了什么
        AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
            Question("今天做了什么？（可多选）")
            ChipRow {
                ACTIVITY_OPTIONS.forEach { option ->
                    AppChip(
                        text = option,
                        state = if (state.activities.contains(option)) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onToggleActivity(option) },
                    )
                }
            }
        }

        // 7. 最担心什么
        AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
            Question("今天最担心什么？")
            AppTextArea(
                value = state.topWorry,
                onValueChange = onTopWorryChange,
                placeholder = "例如：会不会越来越严重 / 要不要换医院…",
                minHeight = 100,
            )
        }

        TipBar(
            text = "记录只用于整理你的病程和复诊摘要；变化图不会把某一次疼痛上升解读为影像恶化。",
            type = TipBarType.Info,
        )

        AppButton(
            text = "保存记录",
            onClick = onSave,
            block = true,
            enabled = !state.submitting,
            modifier = Modifier.padding(top = 16.dp),
        )
        Text(
            text = "保存并更新“当前情况”（症状有新变化时）",
            color = AppColors.Primary,
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().clickable { onSave() }.padding(vertical = 16.dp),
        )
    }
}

@Composable
private fun Question(text: String) {
    Text(
        text = text,
        color = AppColors.Text1,
        style = MaterialTheme.typography.titleSmall,
        modifier = Modifier.padding(bottom = 12.dp),
    )
}
