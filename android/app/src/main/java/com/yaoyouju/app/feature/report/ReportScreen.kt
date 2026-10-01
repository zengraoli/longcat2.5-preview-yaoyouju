package com.yaoyouju.app.feature.report

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
import androidx.compose.foundation.layout.widthIn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.AppTextArea
import com.yaoyouju.app.core.components.AppTextField
import com.yaoyouju.app.core.components.ChineseDatePickerDialog
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A05 录入报告与既有医嘱（R02） */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportScreen(
    state: ReportUiState,
    onBack: () -> Unit,
    onSelectTab: (ReportTab) -> Unit,
    onReportTextChange: (String) -> Unit,
    onReportDateChange: (String) -> Unit,
    onSelectExamType: (Int) -> Unit,
    onHospitalChange: (String) -> Unit,
    onAdviceTextChange: (String) -> Unit,
    onToggleAdvice: (String) -> Unit,
    onShowDatePicker: (Boolean) -> Unit,
    onShowExamTypePicker: (Boolean) -> Unit,
    onOcr: () -> Unit,
    onNext: () -> Unit,
    onSkip: () -> Unit,
) {
    Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = AppDimens.PageMargin)
                .padding(bottom = 32.dp),
        ) {
            TopBar(
                title = "录入报告与医嘱（可选）",
                onBack = onBack,
                trailing = {
                    Text(text = "第 3 / 4 步", color = AppColors.Text3, style = MaterialTheme.typography.bodySmall)
                },
            )

            // 录入方式
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                ReportTab.entries.forEach { tab ->
                    val active = state.tab == tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                if (active) AppColors.Primary else AppColors.Surface,
                                RoundedCornerShape(AppDimens.RadiusButton),
                            )
                            .border(
                                1.dp,
                                if (active) AppColors.Primary else AppColors.Border,
                                RoundedCornerShape(AppDimens.RadiusButton),
                            )
                            .clickable { onSelectTab(tab) }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = tab.label,
                            color = if (active) AppColors.Surface else AppColors.Text2,
                            style = MaterialTheme.typography.labelMedium,
                            maxLines = 1,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 6.dp),
                        )
                    }
                }
            }

            when (state.tab) {
                ReportTab.Paste -> AppCard {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(text = "检查报告原文", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                        StatusTag(label = "报告原文")
                    }
                    AppTextArea(
                        value = state.reportText,
                        onValueChange = onReportTextChange,
                        placeholder = "腰椎MRI平扫：L4/5椎间盘轻度膨出；L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能…（示例文本，仅用于演示）",
                        minHeight = 120,
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            FieldLabelText("报告日期")
                            SelectField(
                                text = state.reportDate.ifBlank { "选择日期" },
                                placeholder = state.reportDate.isBlank(),
                                icon = AppIcons.Calendar,
                                onClick = { onShowDatePicker(true) },
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            FieldLabelText("检查类型")
                            SelectField(
                                text = EXAM_TYPES[state.examTypeIndex],
                                placeholder = false,
                                trailingText = "⌄",
                                onClick = { onShowExamTypePicker(true) },
                            )
                        }
                    }
                    FieldLabelText("检查机构（可选）")
                    AppTextField(
                        value = state.hospital,
                        onValueChange = onHospitalChange,
                        placeholder = "如：XX市人民医院",
                    )
                }

                ReportTab.Ocr -> AppCard {
                    Text(
                        text = "拍照提取（模拟）",
                        color = AppColors.Text1,
                        style = MaterialTheme.typography.titleSmall,
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(AppColors.Bg, RoundedCornerShape(AppDimens.RadiusButton))
                            .border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusButton))
                            .clickable { onOcr() }
                            .padding(vertical = 32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(
                            imageVector = AppIcons.Camera,
                            contentDescription = null,
                            tint = AppColors.Primary,
                            modifier = Modifier.size(28.dp),
                        )
                        Text(
                            text = state.ocrText.ifBlank { "点击拍照，提取报告文字（演示返回示例文本）" },
                            color = AppColors.Text2,
                            style = MaterialTheme.typography.labelMedium,
                        )
                    }
                }

                ReportTab.Skip -> AppCard {
                    Text(
                        text = "暂不录入报告。你可以稍后再录入，也可以直接核对已有信息。",
                        color = AppColors.Text2,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }

            // 既有医嘱
            AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(text = "医生已经给出的建议（可选）", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    StatusTag(label = "自述")
                }
                AppTextArea(
                    value = state.adviceText,
                    onValueChange = onAdviceTextChange,
                    placeholder = "如：医生建议先保守治疗，4周后复查；避免久坐和弯腰负重",
                    minHeight = 120,
                )
                ChipRow(modifier = Modifier.padding(top = 12.dp)) {
                    ADVICE_OPTIONS.forEach { option ->
                        AppChip(
                            text = option,
                            state = if (state.advice.contains(option)) AppChipState.Selected else AppChipState.Unselected,
                            onClick = { onToggleAdvice(option) },
                        )
                    }
                }
            }

            TipBar(
                text = "原文仅用于对照解释，每个关键解释都可回看原文。本产品不做影像读片诊断，也不会把报告中未描述的内容写成“已排除”。",
                type = TipBarType.Info,
                modifier = Modifier.padding(top = 12.dp),
            )

            AppButton(
                text = "下一步：核对信息",
                onClick = onNext,
                block = true,
                enabled = !state.submitting,
                modifier = Modifier.padding(top = 16.dp),
            )
            Text(
                text = "跳过，先不录入报告",
                color = AppColors.Primary,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSkip() }
                    .padding(vertical = 16.dp),
            )
        }
    }

    if (state.showDatePicker) {
        ChineseDatePickerDialog(
            initial = state.reportDate,
            onSelect = { onReportDateChange(it); onShowDatePicker(false) },
            onDismiss = { onShowDatePicker(false) },
        )
    }

    if (state.showExamTypePicker) {
        SimpleChoiceDialog(
            title = "检查类型",
            options = EXAM_TYPES,
            onSelect = { onSelectExamType(it) },
            onDismiss = { onShowExamTypePicker(false) },
        )
    }
}

@Composable
internal fun FieldLabelText(text: String) {
    Text(
        text = text,
        color = AppColors.Text2,
        style = MaterialTheme.typography.labelMedium,
        modifier = Modifier.padding(bottom = 6.dp),
    )
}

@Composable
internal fun SelectField(
    text: String,
    placeholder: Boolean,
    onClick: () -> Unit,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    trailingText: String? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(AppColors.Bg, RoundedCornerShape(AppDimens.RadiusButton))
            .border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusButton))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = text,
            color = if (placeholder) AppColors.Text3 else AppColors.Text1,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f),
        )
        if (icon != null) {
            Icon(imageVector = icon, contentDescription = null, tint = AppColors.Text3, modifier = Modifier.size(18.dp))
        }
        if (trailingText != null) {
            Text(text = trailingText, color = AppColors.Text3, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
internal fun SimpleChoiceDialog(
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
