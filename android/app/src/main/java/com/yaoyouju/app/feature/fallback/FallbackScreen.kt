package com.yaoyouju.app.feature.fallback

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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.EmergencyBar
import com.yaoyouju.app.core.components.EmergencyDialog
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TagTone
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A18 服务不可用回退 */
@Composable
fun FallbackScreen(
    state: FallbackUiState,
    onBack: () -> Unit,
    onShowEmergency: (Boolean) -> Unit,
    onContents: () -> Unit,
    onSummary: () -> Unit,
    onTimeline: () -> Unit,
    onRetry: () -> Unit,
) {
    Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = AppDimens.PageMargin)
                .padding(bottom = 32.dp),
        ) {
            TopBar(title = "一页分析", onBack = onBack)

            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 24.dp, bottom = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier.size(72.dp).background(AppColors.tint(AppColors.Warn, 0.12f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = AppIcons.WifiOff,
                        contentDescription = null,
                        tint = AppColors.Warn,
                        modifier = Modifier.size(32.dp),
                    )
                }
                Text(
                    text = "本次无法完成个性化解释",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleLarge,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 16.dp),
                )
                Text(
                    text = "模型或来源校验暂时不可用。我们不会无限重试，也不会重复计费。你已核对的信息已经保存，稍后可以直接生成分析。",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 8.dp),
                )
                Row(
                    modifier = Modifier.padding(top = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    StatusTag(label = "错误码 ${state.errorCode}", tone = TagTone.Neutral)
                    StatusTag(label = "已保存核对信息", tone = TagTone.Ok)
                    StatusTag(label = "未计费", tone = TagTone.Ok)
                }
            }

            Text(
                text = "现在仍然可以使用",
                color = AppColors.Text1,
                style = MaterialTheme.typography.titleSmall,
                modifier = Modifier.padding(bottom = 12.dp),
            )

            FallbackItem(
                icon = AppIcons.Play,
                title = "已审核科普",
                desc = "已审核科普（视频/图文），含字幕与文字替代，不依赖模型",
                onClick = onContents,
            )
            FallbackItem(
                icon = AppIcons.Document,
                title = "复诊摘要",
                desc = "基于你已有的记录与报告原文生成，可导出",
                onClick = onSummary,
            )
            FallbackItem(
                icon = AppIcons.Timeline,
                title = "病程记录",
                desc = "继续记录今天；数据只保存在你的账户",
                onClick = onTimeline,
            )

            TipBar(
                text = "低带宽下本页与核心文字仍可阅读；网络异常时也能看到基础求助说明。",
                type = TipBarType.Info,
                modifier = Modifier.padding(top = 4.dp),
            )

            EmergencyBar(
                text = "出现严重症状？查看就医提示（不依赖网络）",
                onClick = { onShowEmergency(true) },
                modifier = Modifier.padding(top = 12.dp),
            )

            AppButton(
                text = "稍后重试（约 2 分钟后可用）",
                onClick = onRetry,
                type = AppButtonType.Secondary,
                block = true,
                modifier = Modifier.padding(top = 16.dp),
            )
            Text(
                text = "返回当前情况",
                color = AppColors.Primary,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().clickable { onBack() }.padding(vertical = 16.dp),
            )
        }

        if (state.showEmergency) {
            EmergencyDialog(tips = state.emergency, onDismiss = { onShowEmergency(false) })
        }
    }
}

@Composable
private fun FallbackItem(icon: ImageVector, title: String, desc: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = AppDimens.CardGap)
            .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
            .clickable { onClick() }
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier.size(44.dp).background(AppColors.PrimaryLight, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = AppColors.Primary, modifier = Modifier.size(22.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
            Text(text = desc, color = AppColors.Text2, style = MaterialTheme.typography.bodySmall)
        }
        StatusTag(label = "可用", tone = TagTone.Ok)
    }
}
