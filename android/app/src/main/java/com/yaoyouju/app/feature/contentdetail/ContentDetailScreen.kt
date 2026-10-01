package com.yaoyouju.app.feature.contentdetail

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
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.AppTextArea
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A15 视频详情（R06） */
@Composable
fun ContentDetailScreen(
    state: ContentDetailUiState,
    onBack: () -> Unit,
    onRetellChange: (String) -> Unit,
    onSubmitRetell: () -> Unit,
    onToggleSubtitle: () -> Unit,
    onFeedback: (String) -> Unit,
    onReportContent: () -> Unit,
    onShare: () -> Unit,
    reviewDate: String,
) {
    val detail = state.detail
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppColors.Bg)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 32.dp),
    ) {
        Column(modifier = Modifier.padding(horizontal = AppDimens.PageMargin)) {
            TopBar(
                title = "审核视频",
                onBack = onBack,
                trailing = {
                    Icon(
                        imageVector = AppIcons.Share,
                        contentDescription = "分享",
                        tint = AppColors.Text1,
                        modifier = Modifier.size(20.dp).clickable { onShare() },
                    )
                },
            )
        }

        if (detail == null) {
            Box(modifier = Modifier.fillMaxWidth().padding(AppDimens.PageMargin)) {
                Text(
                    text = if (state.loading) "内容加载中…" else "没有找到这条内容，请返回内容库重新选择。",
                    color = AppColors.Text3,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            return
        }

        // 播放器占位（本地占位图，不引用外部资源）
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(210.dp)
                .background(Color(0xFF1B2230)),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier.size(64.dp).background(AppColors.Surface, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = AppIcons.Play,
                        contentDescription = "播放",
                        tint = AppColors.Primary,
                        modifier = Modifier.size(30.dp),
                    )
                }
                Text(
                    text = "示意动画：${detail.title}（非本人影像）",
                    color = AppColors.Surface.copy(alpha = 0.85f),
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 16.dp),
                )
            }
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF11161F))
                .padding(horizontal = AppDimens.PageMargin, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(text = "0:00 / ${detail.duration ?: "2:10"}", color = AppColors.Surface, style = MaterialTheme.typography.labelSmall)
            Box(modifier = Modifier.weight(1f).height(3.dp).background(AppColors.Surface.copy(alpha = 0.3f), RoundedCornerShape(2.dp)))
            Text(
                text = "CC 开",
                color = AppColors.Text1,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.background(AppColors.Surface, RoundedCornerShape(2.dp)).padding(horizontal = 6.dp, vertical = 1.dp),
            )
        }

        Column(modifier = Modifier.padding(horizontal = AppDimens.PageMargin)) {
            Text(
                text = detail.title,
                color = AppColors.Text1,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(top = 16.dp, bottom = 8.dp),
            )
            ChipRow(modifier = Modifier.padding(bottom = 12.dp)) {
                StatusTag(label = "已审核 v${detail.auditVersion ?: 1}")
                StatusTag(label = "临床审定 · $reviewDate", tone = com.yaoyouju.app.core.components.TagTone.Neutral)
                detail.modelAssetVersion?.let { StatusTag(label = "依据：$it", tone = com.yaoyouju.app.core.components.TagTone.Neutral) }
                StatusTag(label = "字幕 · 文字替代", tone = com.yaoyouju.app.core.components.TagTone.Info)
            }

            if (!detail.reason.isNullOrBlank()) {
                TipBar(
                    text = "为什么推荐给你：${detail.reason}。示意图不是你的真实病变，不能据此判断本人病因。",
                    type = TipBarType.Info,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
            }

            // 适用范围
            AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                Text(
                    text = "适用范围",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                ScopeRow("适用", detail.applicableScope ?: "未标注")
                ScopeRow("不适用", detail.notApplicable ?: "未标注")
            }

            // 文字替代
            AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { onToggleSubtitle() },
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(text = "文字替代（全文）", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    Text(text = if (state.expandedSubtitle) "⌃" else "⌄", color = AppColors.Text3, style = MaterialTheme.typography.titleSmall)
                }
                if (state.expandedSubtitle) {
                    Text(
                        text = detail.subtitleText ?: detail.script ?: "暂无文字替代内容",
                        color = AppColors.Text1,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                }
            }

            // 复述任务
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = AppDimens.CardGap)
                    .background(AppColors.PrimaryLight, RoundedCornerShape(AppDimens.RadiusCard))
                    .padding(16.dp),
            ) {
                Text(text = "看完后，用一句话说说你理解了什么（可选）", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                Text(
                    text = "这用来检查视频有没有造成新的误解，不是考试，也不会影响你的分析结果。",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
                )
                AppTextArea(
                    value = state.retell,
                    onValueChange = onRetellChange,
                    placeholder = "例如：L5/S1 是腰椎最下面那个椎间盘的位置…",
                    minHeight = 80,
                )
                AppButton(
                    text = if (state.submitted) "已提交" else "提交",
                    onClick = onSubmitRetell,
                    modifier = Modifier.padding(top = 12.dp),
                )
            }

            // 反馈
            AppCard {
                Text(
                    text = "这条内容对你有帮助吗？",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                ChipRow {
                    listOf("看懂了", "没看懂", "内容有误（举报）").forEach { option ->
                        AppChip(
                            text = option,
                            state = if (state.feedback == option) AppChipState.Selected else AppChipState.Unselected,
                            onClick = {
                                if (option == "内容有误（举报）") onReportContent() else onFeedback(option)
                            },
                        )
                    }
                }
            }

            AppButton(
                text = "返回内容库",
                onClick = onBack,
                type = AppButtonType.Secondary,
                block = true,
                modifier = Modifier.padding(top = 16.dp),
            )
        }
    }
}

@Composable
private fun ScopeRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(text = label, color = AppColors.Text2, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(end = 12.dp))
        Text(text = value, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
    }
}
