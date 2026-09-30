package com.yaoyouju.app.feature.analysis

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AnalysisResult

/** A07 一页理性分析（R04 证据化回答） */
@Composable
fun AnalysisScreen(
    state: AnalysisUiState,
    onBack: () -> Unit,
    onCompare: () -> Unit,
    onTimeline: () -> Unit,
    onSummary: () -> Unit,
    onContents: () -> Unit,
    onFallback: () -> Unit,
    onContentDetail: (String) -> Unit,
    onFeedback: (String) -> Unit,
    onReportError: () -> Unit,
    onToggleQuestion: (Int) -> Unit,
    onAddQuestions: () -> Unit,
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
            title = "一页分析",
            onBack = onBack,
            trailing = {
                Icon(
                    imageVector = AppIcons.Share,
                    contentDescription = "分享",
                    tint = AppColors.Text2,
                    modifier = Modifier.size(20.dp).padding(end = 4.dp),
                )
                Icon(
                    imageVector = AppIcons.More,
                    contentDescription = "更多",
                    tint = AppColors.Text2,
                    modifier = Modifier.size(20.dp),
                )
            },
        )

        val result = state.result
        when {
            state.loading -> AppCard {
                Text(text = "分析生成中，请稍候…", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                Text(
                    text = "任务正在排队或由 Worker 处理，完成后自动展示。",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }

            result == null && state.status == "失败" -> AppCard {
                TipBar(
                    text = "${state.reason}。你仍然可以查看已审核资料与复诊摘要。",
                    type = TipBarType.Error,
                )
                AppButton(
                    text = "查看已审核资料",
                    onClick = onContents,
                    type = AppButtonType.Soft,
                    block = true,
                    modifier = Modifier.padding(top = 12.dp),
                )
                AppButton(
                    text = "查看服务不可用说明",
                    onClick = onFallback,
                    type = AppButtonType.Secondary,
                    block = true,
                    modifier = Modifier.padding(top = 10.dp),
                )
            }

            result != null -> {
                val today = BeijingTime.today()
                Row(
                    modifier = Modifier.padding(bottom = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    StatusTag(label = "不作诊断")
                    Text(text = "基于 $today 的信息", color = AppColors.Text2, style = MaterialTheme.typography.bodySmall)
                }
                Text(
                    text = "分析版本 v${result.version} · 模型 ${result.modelReleaseId}",
                    color = AppColors.Text3,
                    style = MaterialTheme.typography.bodySmall,
                )
                Text(
                    text = introText(result),
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 12.dp, bottom = 16.dp),
                )

                // ① 已知
                SectionCard(1, "当前确认的信息与来源", AppColors.Primary) {
                    result.sections.known.forEach { item ->
                        AnalysisItem(
                            text = item.text,
                            source = sourceLabel(item.source, item.mark, today),
                            sourceColor = AppColors.Text3,
                            clickable = item.source == "报告",
                            onClick = onCompare,
                        )
                    }
                }

                // ② 解释
                SectionCard(2, "这些信息能支持什么解释", AppColors.Info) {
                    result.sections.explanation.forEach { item ->
                        AnalysisItem(
                            text = item.text,
                            source = "来源：${evidenceTitle(result, item.source)}",
                            sourceColor = AppColors.Ok,
                        )
                    }
                }

                // ③ 未知
                SectionCard(3, "仍缺哪些信息、哪些不能据此判断", AppColors.Warn) {
                    result.sections.unknown.forEach { item ->
                        AnalysisItem(text = item.text, source = null, sourceColor = AppColors.Text3)
                    }
                }

                // ④ 下一步
                SectionCard(4, "建议向医生确认的问题与下一步", AppColors.Ok) {
                    result.sections.next.forEachIndexed { index, item ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 8.dp)
                                .clickable { onToggleQuestion(index) },
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.Top,
                        ) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 5.dp)
                                    .size(12.dp)
                                    .background(
                                        if (state.selectedQuestions.contains(index)) AppColors.Primary else AppColors.Border,
                                        RoundedCornerShape(2.dp),
                                    ),
                            )
                            Text(
                                text = item.text,
                                color = AppColors.Text1,
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                    AppButton(
                        text = if (state.followupAdded) {
                            "已加入复诊问题清单（${state.selectedQuestions.size} 条）"
                        } else {
                            "加入复诊问题清单（已选 ${state.selectedQuestions.size} 条）"
                        },
                        onClick = onAddQuestions,
                        type = AppButtonType.Soft,
                        block = true,
                        enabled = !state.submitting,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }

                // ⑤ 视频与记录
                SectionCard(5, "可选科普视频与本次记录", AppColors.Text3) {
                    result.sections.videos.forEach { video ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).clickable { onContentDetail(video.contentId) },
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(width = 88.dp, height = 66.dp)
                                    .background(AppColors.PrimaryLight, RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = AppIcons.Play,
                                    contentDescription = null,
                                    tint = AppColors.Primary,
                                    modifier = Modifier.size(24.dp),
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = video.title,
                                    color = AppColors.Text1,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium,
                                )
                                Row(
                                    modifier = Modifier.padding(top = 6.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    StatusTag(label = "已审核 v2")
                                    Text(
                                        text = video.reason,
                                        color = AppColors.Text3,
                                        style = MaterialTheme.typography.bodySmall,
                                    )
                                }
                            }
                        }
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        AppButton(
                            text = "保存到病程",
                            onClick = onTimeline,
                            type = AppButtonType.Secondary,
                            modifier = Modifier.weight(1f),
                        )
                        AppButton(
                            text = "生成复诊摘要",
                            onClick = onSummary,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }

                // 反馈
                AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
                    Text(text = "这次分析对你有帮助吗？", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    ChipRow(modifier = Modifier.padding(top = 12.dp, bottom = 12.dp)) {
                        listOf("看懂了", "知道下一步", "都不好，问题没解决").forEach { option ->
                            AppChip(
                                text = option,
                                state = if (state.feedbackGiven == option) AppChipState.Selected else AppChipState.Unselected,
                                onClick = { onFeedback(option) },
                            )
                        }
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { onReportError() },
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            imageVector = AppIcons.Flag,
                            contentDescription = null,
                            tint = AppColors.Text2,
                            modifier = Modifier.size(16.dp),
                        )
                        Text(
                            text = "报告错误（会记录分析版本与影响范围）",
                            color = AppColors.Text2,
                            style = MaterialTheme.typography.labelMedium,
                        )
                    }
                }

                TipBar(
                    text = "本页说明“已经知道什么、仍不知道什么、接下来怎么办”，帮助你理解和复诊，不代替医生诊断。",
                    type = TipBarType.Info,
                    modifier = Modifier.padding(top = 12.dp),
                )
            }
        }
    }
}

@Composable
private fun SectionCard(
    number: Int,
    title: String,
    color: Color,
    content: @Composable () -> Unit,
) {
    AppCard(modifier = Modifier.padding(top = AppDimens.CardGap)) {
        Row(
            modifier = Modifier.padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier.size(24.dp).background(color, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(text = "$number", color = AppColors.Surface, fontSize = 13.sp)
            }
            Text(text = title, color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
        }
        content()
    }
}

@Composable
private fun AnalysisItem(
    text: String,
    source: String?,
    sourceColor: Color,
    clickable: Boolean = false,
    onClick: () -> Unit = {},
) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = "•", color = AppColors.Text2, style = MaterialTheme.typography.bodyMedium)
            Text(text = text, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
        }
        if (!source.isNullOrBlank()) {
            Text(
                text = source,
                color = sourceColor,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier
                    .padding(start = 16.dp, top = 2.dp)
                    .then(if (clickable) Modifier.clickable { onClick() } else Modifier),
            )
        }
    }
}

private fun sourceLabel(source: String?, mark: String?, today: String): String {
    val base = when (source) {
        "报告" -> "报告原文 · 可回看"
        "症状" -> "自述 · $today"
        "医嘱", "行动", "结局" -> "自述"
        null -> "系统生成"
        else -> source
    }
    return if (mark.isNullOrBlank()) base else "$base · $mark"
}

private fun evidenceTitle(result: AnalysisResult, source: String?): String {
    if (source.isNullOrBlank()) return "系统生成"
    val citation = result.citations.firstOrNull { it.evidenceDocId == source }
    if (!citation?.evidenceDocTitle.isNullOrBlank()) return citation!!.evidenceDocTitle!!
    return "审核科普 #${source.takeLast(2)}"
}

private fun introText(result: AnalysisResult): String {
    val parts = mutableListOf<String>()
    if (result.sections.known.isNotEmpty()) {
        parts += "整理出 ${result.sections.known.size} 条已知信息（来源与核实状态见每条标注）"
    }
    if (result.sections.unknown.isNotEmpty()) {
        parts += "有 ${result.sections.unknown.size} 项尚未确认"
    }
    if (parts.isEmpty()) return "下面按“已知 / 解释 / 未知 / 下一步”整理。"
    return "下面按“已知 / 解释 / 未知 / 下一步”整理：${parts.joinToString("，")}。"
}
