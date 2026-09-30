package com.yaoyouju.app.feature.verify

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.AppTextArea
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A06 核对结构化信息（R01/R02） */
@Composable
fun VerifyScreen(
    state: VerifyUiState,
    onBack: () -> Unit,
    onCorrectReport: () -> Unit,
    onResolveConflict: (String) -> Unit,
    onGenerate: () -> Unit,
    onDismissCorrectDialog: () -> Unit,
    onCorrectTextChange: (String) -> Unit,
    onSaveCorrection: () -> Unit,
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
                title = "核对整理后的信息",
                onBack = onBack,
                trailing = {
                    Text(text = "第 4 / 4 步", color = AppColors.Text3, style = MaterialTheme.typography.bodySmall)
                },
            )

            TipBar(
                text = "请核对系统整理的信息。缺失项显示为“尚未确认”，冲突项需要你确认后才会进入分析。",
                type = TipBarType.Info,
            )

            // 报告信息
            if (state.terms.isNotEmpty() || state.reportRawText.isNotBlank()) {
                AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "报告信息 · ${state.reportDate.ifBlank { "日期尚未确认" }}",
                            color = AppColors.Text1,
                            style = MaterialTheme.typography.titleSmall,
                            modifier = Modifier.weight(1f),
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            StatusTag(label = "报告原文")
                            Icon(
                                imageVector = AppIcons.Edit,
                                contentDescription = "纠正",
                                tint = AppColors.Text3,
                                modifier = Modifier.size(18.dp).clickable { onCorrectReport() },
                            )
                        }
                    }
                    state.terms.forEach { term ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Text(
                                text = term.label,
                                color = AppColors.Text2,
                                style = MaterialTheme.typography.labelMedium,
                                modifier = Modifier.width(64.dp),
                            )
                            Text(
                                text = term.text,
                                color = AppColors.Text1,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                text = term.pos,
                                color = AppColors.Text3,
                                style = MaterialTheme.typography.labelSmall,
                            )
                        }
                    }

                    if (state.conflict.isNotBlank()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 12.dp)
                                .background(AppColors.tint(AppColors.Error, 0.06f), RoundedCornerShape(AppDimens.RadiusButton))
                                .padding(12.dp),
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(
                                    imageVector = AppIcons.Warning,
                                    contentDescription = null,
                                    tint = AppColors.Error,
                                    modifier = Modifier.size(18.dp),
                                )
                                Text(
                                    text = "侧别冲突：${state.conflict}",
                                    color = AppColors.Error,
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.weight(1f),
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                AppButton(
                                    text = "我的症状在${state.selfSide.ifBlank { "左侧" }}",
                                    onClick = { onResolveConflict(state.selfSide.ifBlank { "左侧" }) },
                                    type = AppButtonType.Soft,
                                    modifier = Modifier.weight(1f),
                                )
                                AppButton(
                                    text = "都有 / 不确定",
                                    onClick = { onResolveConflict("双侧") },
                                    type = AppButtonType.Secondary,
                                    modifier = Modifier.weight(1f),
                                )
                            }
                        }
                    }
                }
            } else {
                AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
                    Text(
                        text = "暂无已录入的报告",
                        color = AppColors.Text3,
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                    )
                }
            }

            // 症状与变化
            AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(text = "症状与变化", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    StatusTag(label = "自述")
                }
                if (state.symptoms.isEmpty()) {
                    EmptyRow("暂无自述症状记录")
                } else {
                    state.symptoms.forEach { row ->
                        VerifyRowItem(row.label, row.text, row.status)
                    }
                }
            }

            // 既有医嘱
            AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(text = "既有医嘱", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    StatusTag(label = "医生记录")
                }
                if (state.advices.isEmpty()) {
                    EmptyRow("暂无既有医嘱")
                } else {
                    state.advices.forEach { row ->
                        VerifyRowItem(row.label, row.text, row.status)
                    }
                }
            }

            TipBar(
                text = "“尚未确认”不会被当作“没有”；旧记录中的“当时没有”也不会被当作“现在没有”。",
                type = TipBarType.Warn,
                modifier = Modifier.padding(top = 12.dp),
            )

            AppButton(
                text = "确认无误，生成一页分析",
                onClick = onGenerate,
                block = true,
                enabled = !state.submitting,
                modifier = Modifier.padding(top = 16.dp),
            )
            Text(
                text = "返回修改",
                color = AppColors.Primary,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onBack() }
                    .padding(vertical = 16.dp),
            )
        }

        if (state.showCorrectDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0x66000000))
                    .clickable { onDismissCorrectDialog() },
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
                    Text(text = "纠正报告原文", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    Box(modifier = Modifier.padding(top = 12.dp)) {
                        AppTextArea(
                            value = state.correctText,
                            onValueChange = onCorrectTextChange,
                            placeholder = "输入修正后的报告原文",
                            minHeight = 120,
                        )
                    }
                    AppButton(text = "保存", onClick = onSaveCorrection, block = true, modifier = Modifier.padding(top = 12.dp))
                    Text(
                        text = "取消",
                        color = AppColors.Text2,
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onDismissCorrectDialog() }
                            .padding(vertical = 12.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun VerifyRowItem(label: String, text: String, status: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Text(
            text = label,
            color = AppColors.Text2,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.width(72.dp),
        )
        Text(text = text, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
        StatusTag(label = status)
    }
}

@Composable
private fun EmptyRow(text: String) {
    Text(
        text = text,
        color = AppColors.Text3,
        style = MaterialTheme.typography.bodyMedium,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
    )
}
