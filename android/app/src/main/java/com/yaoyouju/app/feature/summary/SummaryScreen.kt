package com.yaoyouju.app.feature.summary

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
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.AppTextArea
import com.yaoyouju.app.core.components.BottomTabBar
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A12 复诊摘要预览与导出（R05） */
@Composable
fun SummaryScreen(
    state: SummaryUiState,
    onSelectTab: (TabDestination) -> Unit,
    onSelectSummaryTab: (SummaryTab) -> Unit,
    onCorrect: (String) -> Unit,
    onCorrectTextChange: (String) -> Unit,
    onSaveCorrect: () -> Unit,
    onCancelCorrect: () -> Unit,
    onExport: (String) -> Unit,
) {
    Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = AppDimens.PageMargin)
                    .padding(top = 16.dp, bottom = 24.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(text = "复诊准备", color = AppColors.Text1, style = MaterialTheme.typography.titleMedium)
                    Icon(
                        imageVector = AppIcons.Upload,
                        contentDescription = "导出",
                        tint = AppColors.Text2,
                        modifier = Modifier.size(20.dp).clickable { onExport("文本") },
                    )
                }

                // 分段
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    SummaryTab.entries.forEach { tab ->
                        val active = state.tab == tab
                        val label = if (tab == SummaryTab.Questions) "${tab.label} (${state.questions.size})" else tab.label
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(AppDimens.MinTouch)
                                .background(
                                    if (active) AppColors.Primary else AppColors.Surface,
                                    RoundedCornerShape(AppDimens.RadiusButton),
                                )
                                .border(
                                    1.dp,
                                    if (active) AppColors.Primary else AppColors.Border,
                                    RoundedCornerShape(AppDimens.RadiusButton),
                                )
                                .clickable { onSelectSummaryTab(tab) },
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = label,
                                color = if (active) AppColors.Surface else AppColors.Text2,
                                style = MaterialTheme.typography.labelMedium,
                            )
                        }
                    }
                }

                when (state.tab) {
                    SummaryTab.Doc -> AppCard {
                        Text(text = "复诊交接摘要", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                        Text(
                            text = "生成于 ${state.today} · 由用户自述与报告原文整理 · 未经医生核实",
                            color = AppColors.Text2,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp),
                        )
                        state.sections.forEachIndexed { index, section ->
                            Column(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        text = section.title,
                                        color = AppColors.Text1,
                                        style = MaterialTheme.typography.titleSmall,
                                    )
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.clickable { onCorrect(section.key) },
                                    ) {
                                        Icon(
                                            imageVector = AppIcons.Edit,
                                            contentDescription = null,
                                            tint = AppColors.Primary,
                                            modifier = Modifier.size(14.dp),
                                        )
                                        Text(text = "纠正", color = AppColors.Primary, style = MaterialTheme.typography.labelMedium)
                                    }
                                }
                                if (section.items.isEmpty()) {
                                    Text(text = "尚未确认", color = AppColors.Text3, style = MaterialTheme.typography.labelMedium)
                                } else {
                                    section.items.forEach { item ->
                                        Column(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                                            Text(
                                                text = item.text,
                                                color = AppColors.Text1,
                                                style = MaterialTheme.typography.bodyMedium,
                                            )
                                            ChipRow(modifier = Modifier.padding(top = 4.dp)) {
                                                item.source?.let { StatusTag(label = it) }
                                                item.mark?.let { StatusTag(label = it) }
                                            }
                                        }
                                    }
                                }
                                if (index < state.sections.size - 1) {
                                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(AppColors.Border))
                                }
                            }
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(AppColors.PrimaryLight, RoundedCornerShape(AppDimens.RadiusButton))
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Icon(
                                imageVector = AppIcons.Shield,
                                contentDescription = null,
                                tint = AppColors.Primary,
                                modifier = Modifier.size(18.dp),
                            )
                            Text(
                                text = "本摘要整理已有信息，保留时间来源与未核实项，不含诊断结论。",
                                color = AppColors.Primary,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }

                    SummaryTab.Questions -> AppCard {
                        Text(
                            text = "问题清单（${state.questions.size}）",
                            color = AppColors.Text1,
                            style = MaterialTheme.typography.titleSmall,
                            modifier = Modifier.padding(bottom = 12.dp),
                        )
                        if (state.questions.isEmpty()) {
                            Text(
                                text = "暂无复诊问题，可在“问与解释”中加入",
                                color = AppColors.Text3,
                                style = MaterialTheme.typography.labelMedium,
                            )
                        } else {
                            state.questions.forEachIndexed { index, question ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Box(
                                        modifier = Modifier.size(20.dp).background(AppColors.Primary, RoundedCornerShape(10.dp)),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(
                                            text = "${index + 1}",
                                            color = AppColors.Surface,
                                            style = MaterialTheme.typography.labelSmall,
                                        )
                                    }
                                    Text(
                                        text = question,
                                        color = AppColors.Text1,
                                        style = MaterialTheme.typography.bodyMedium,
                                        modifier = Modifier.weight(1f),
                                    )
                                }
                            }
                        }
                    }

                    SummaryTab.Bring -> AppCard {
                        Text(
                            text = "带什么",
                            color = AppColors.Text1,
                            style = MaterialTheme.typography.titleSmall,
                            modifier = Modifier.padding(bottom = 12.dp),
                        )
                        listOf(
                            "已录入的检查报告原文",
                            "症状开始时间与最近变化记录",
                            "正在使用的药物与既有医嘱",
                        ).forEach { item ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    imageVector = AppIcons.Check,
                                    contentDescription = null,
                                    tint = AppColors.Ok,
                                    modifier = Modifier.size(18.dp),
                                )
                                Text(text = item, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    AppButton(
                        text = "导出 PDF",
                        onClick = { onExport("PDF") },
                        enabled = !state.exporting,
                        modifier = Modifier.weight(1f),
                    )
                    AppButton(
                        text = "生成图片",
                        onClick = { onExport("图片") },
                        type = AppButtonType.Secondary,
                        enabled = !state.exporting,
                        modifier = Modifier.weight(1f),
                    )
                    AppButton(
                        text = "复制文本",
                        onClick = { onExport("文本") },
                        type = AppButtonType.Secondary,
                        enabled = !state.exporting,
                        modifier = Modifier.weight(1f),
                    )
                }

                TipBar(
                    text = "导出后由你自行决定是否分享给医生；本产品不会主动把你的健康资料发送给任何第三方。",
                    type = TipBarType.Info,
                    modifier = Modifier.padding(top = 12.dp),
                )
            }

            BottomTabBar(selected = TabDestination.Followup, onSelect = onSelectTab)
        }

        state.correctingKey?.let { key ->
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0x66000000)).clickable { onCancelCorrect() },
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
                    Text(text = "纠正「$key」", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    Box(modifier = Modifier.padding(top = 12.dp)) {
                        AppTextArea(
                            value = state.correctText,
                            onValueChange = onCorrectTextChange,
                            placeholder = "输入修正后的内容",
                            minHeight = 100,
                        )
                    }
                    AppButton(text = "保存", onClick = onSaveCorrect, block = true, modifier = Modifier.padding(top = 12.dp))
                    Text(
                        text = "取消",
                        color = AppColors.Primary,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.fillMaxWidth().clickable { onCancelCorrect() }.padding(vertical = 12.dp),
                    )
                }
            }
        }
    }
}
