package com.yaoyouju.app.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.core.components.ActionTile
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.BottomTabBar
import com.yaoyouju.app.core.components.EmergencyBar
import com.yaoyouju.app.core.components.EmergencyDialog
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AnalysisResult
import com.yaoyouju.app.data.ContentItem

/** A14 首页 · 当前情况（主 Tab） */
@Composable
fun HomeScreen(
    state: HomeUiState,
    onSelectTab: (TabDestination) -> Unit,
    onConfirm: () -> Unit,
    onRecord: () -> Unit,
    onReport: () -> Unit,
    onQa: () -> Unit,
    onSummary: () -> Unit,
    onAnalysis: () -> Unit,
    onContentDetail: (ContentItem) -> Unit,
    onContents: () -> Unit,
    onShowEmergency: (Boolean) -> Unit,
    onDismissPending: () -> Unit,
    onConfusion: () -> Unit,
    onNotification: () -> Unit,
    onAvatar: () -> Unit,
    onRetry: () -> Unit,
    onFallback: () -> Unit,
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
                // 顶部标题
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "当前情况",
                            color = AppColors.Text1,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Medium,
                        )
                        Text(text = state.subtitle, color = AppColors.Text2, style = MaterialTheme.typography.bodySmall)
                    }
                    Text(
                        text = "内容库",
                        color = AppColors.Primary,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.clickable { onContents() },
                    )
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(
                            imageVector = AppIcons.Bell,
                            contentDescription = "通知",
                            tint = AppColors.Text1,
                            modifier = Modifier.size(22.dp).clickable { onNotification() },
                        )
                        Box(
                            modifier = Modifier.size(32.dp).background(AppColors.PrimaryLight, CircleShape).clickable { onAvatar() },
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = "U",
                                color = AppColors.Primary,
                                style = MaterialTheme.typography.labelMedium,
                            )
                        }
                    }
                }

                // 离线 / 服务不可达：明确提示并提供重试与回退入口
                if (state.error != null) {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                        TipBar(
                            text = "${state.error}。你仍可查看就医提示与已审核资料。",
                            type = TipBarType.Warn,
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            AppButton(text = "重试", onClick = onRetry, type = AppButtonType.Soft, modifier = Modifier.weight(1f))
                            AppButton(
                                text = "服务不可用说明",
                                onClick = onFallback,
                                type = AppButtonType.Secondary,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }

                // 待确认项
                if (state.pendingItems.isNotEmpty() && !state.pendingDismissed) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = AppDimens.CardGap)
                            .background(AppColors.tint(AppColors.Warn, 0.06f), RoundedCornerShape(AppDimens.RadiusCard))
                            .padding(16.dp),
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = AppIcons.Warning,
                                contentDescription = null,
                                tint = AppColors.Warn,
                                modifier = Modifier.size(18.dp),
                            )
                            Text(
                                text = "有 ${state.pendingItems.size} 项信息尚未确认",
                                color = AppColors.Warn,
                                style = MaterialTheme.typography.titleSmall,
                            )
                        }
                        Column(modifier = Modifier.padding(top = 8.dp)) {
                            state.pendingItems.forEach { item ->
                                Row(modifier = Modifier.padding(bottom = 4.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(text = "•", color = AppColors.Text2, style = MaterialTheme.typography.bodyMedium)
                                    Text(
                                        text = item,
                                        color = AppColors.Text1,
                                        style = MaterialTheme.typography.bodyMedium,
                                        modifier = Modifier.weight(1f),
                                    )
                                }
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            AppButton(
                                text = "现在确认（约 30 秒）",
                                onClick = onConfirm,
                                type = AppButtonType.Soft,
                                modifier = Modifier.weight(1f),
                            )
                            AppButton(text = "稍后", onClick = onDismissPending, type = AppButtonType.Secondary)
                        }
                    }
                }

                // 新用户 / 没有待确认项时也要能看到确认与选择困惑的入口
                if (state.pendingItems.isEmpty()) {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                        Text(text = "先说说现在的情况", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                        Text(
                            text = "确认当前关键变化（约 30 秒），或先选择你最想解决的问题。",
                            color = AppColors.Text2,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
                        )
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            AppButton(
                                text = "确认当前变化",
                                onClick = onConfirm,
                                type = AppButtonType.Soft,
                                modifier = Modifier.weight(1f),
                            )
                            AppButton(
                                text = "选择主要困惑",
                                onClick = onConfusion,
                                type = AppButtonType.Secondary,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }

                // 最新一页分析
                AnalysisCard(state.analysis, onAnalysis)

                // 快捷入口 2×2
                Column(
                    modifier = Modifier.fillMaxWidth().padding(bottom = AppDimens.CardGap),
                    verticalArrangement = Arrangement.spacedBy(AppDimens.BlockGap),
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(AppDimens.BlockGap)) {
                        ActionTile(AppIcons.Edit, "记录今天", "约 1 分钟", onRecord, Modifier.weight(1f))
                        ActionTile(AppIcons.Upload, "录入报告", "粘贴文字", onReport, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(AppDimens.BlockGap)) {
                        ActionTile(AppIcons.Qa, "问与解释", "基于当前上下文", onQa, Modifier.weight(1f))
                        ActionTile(
                            AppIcons.List,
                            "复诊摘要",
                            "${state.followupQuestionCount} 个问题待确认",
                            onSummary,
                            Modifier.weight(1f),
                        )
                    }
                }

                // 复诊倒计时
                if (state.followupDate.isNotBlank()) {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(
                                imageVector = AppIcons.Calendar,
                                contentDescription = null,
                                tint = AppColors.Primary,
                                modifier = Modifier.size(24.dp),
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "计划复诊：${state.followupDate}（约 ${state.daysUntil} 天后）",
                                    color = AppColors.Text1,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1,
                                )
                                Text(
                                    text = "来源：你录入的医嘱 · 未经核实",
                                    color = AppColors.Text2,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            Icon(
                                imageVector = AppIcons.ChevronRight,
                                contentDescription = null,
                                tint = AppColors.Text3,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                    }
                }

                // 为你推荐
                if (state.recommended.isNotEmpty()) {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                        Text(
                            text = androidx.compose.ui.text.buildAnnotatedString {
                                append("为你推荐")
                                if (state.analysis != null) {
                                    withStyle(
                                        androidx.compose.ui.text.SpanStyle(
                                            color = AppColors.Text3,
                                            fontSize = 12.sp,
                                        ),
                                    ) {
                                        append("（原因：报告提到 L5/S1）")
                                    }
                                }
                            },
                            color = AppColors.Text1,
                            style = MaterialTheme.typography.titleSmall,
                        )
                        state.recommended.forEach { item ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 12.dp).clickable { onContentDetail(item) },
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
                                        text = item.title,
                                        color = AppColors.Text1,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Medium,
                                    )
                                    Row(
                                        modifier = Modifier.padding(top = 6.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        StatusTag(label = "已审核 v${item.auditVersion ?: 2}")
                                        Text(
                                            text = item.duration ?: if (item.type == "视频") "2:10" else "图文",
                                            color = AppColors.Text3,
                                            style = MaterialTheme.typography.bodySmall,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))
                EmergencyBar(
                    text = "症状突然变化或出现严重信号？查看就医提示",
                    onClick = { onShowEmergency(true) },
                )
            }

            BottomTabBar(selected = TabDestination.Home, onSelect = onSelectTab)
        }

        if (state.showEmergency) {
            EmergencyDialog(tips = state.emergency, onDismiss = { onShowEmergency(false) })
        }
    }
}

@Composable
private fun AnalysisCard(analysis: AnalysisResult?, onAnalysis: () -> Unit) {
    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text = "最新一页分析", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
            if (analysis != null) {
                Text(
                    text = "v${analysis.version} · ${BeijingTime.relativeDay(analysis.createdAt)}",
                    color = AppColors.Primary,
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier
                        .background(AppColors.PrimaryLight, RoundedCornerShape(AppDimens.RadiusLabel))
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                )
            }
        }
        if (analysis == null) {
            Text(
                text = "尚未生成分析",
                color = AppColors.Text3,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(bottom = 12.dp),
            )
        } else {
            analysis.sections.known.firstOrNull()?.let { AnalysisLine("已知", it.text) }
            analysis.sections.unknown.firstOrNull()?.let { AnalysisLine("未知", it.text) }
            analysis.sections.next.firstOrNull()?.let { AnalysisLine("下一步", it.text) }
            AppButton(
                text = "查看完整分析",
                onClick = onAnalysis,
                type = AppButtonType.Soft,
                block = true,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

@Composable
private fun AnalysisLine(tag: String, text: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        StatusTag(label = tag)
        Text(text = text, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
    }
}
