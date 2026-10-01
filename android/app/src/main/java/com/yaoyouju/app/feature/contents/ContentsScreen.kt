package com.yaoyouju.app.feature.contents

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.AppTextField
import com.yaoyouju.app.core.components.BottomTabBar
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens
import com.yaoyouju.app.data.ContentItem

/** A13 审核内容库（R06） */
@Composable
fun ContentsScreen(
    state: ContentsUiState,
    onSelectTab: (TabDestination) -> Unit,
    onBack: () -> Unit,
    onSelectCategory: (String) -> Unit,
    onQueryChange: (String) -> Unit,
    onToggleSearch: () -> Unit,
    onOpenDetail: (String) -> Unit,
    showSearch: Boolean = true,
) {
    Column(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = AppDimens.PageMargin)
                .padding(top = 8.dp, bottom = 24.dp),
        ) {
            TopBar(
                title = "审核内容库",
                onBack = onBack,
                trailing = {
                    Icon(
                        imageVector = AppIcons.Search,
                        contentDescription = "搜索",
                        tint = AppColors.Text1,
                        modifier = Modifier.size(20.dp).clickable { onToggleSearch() },
                    )
                },
            )

            if (showSearch) {
                AppTextField(
                    value = state.query,
                    onValueChange = onQueryChange,
                    placeholder = "搜索已审核内容",
                    modifier = Modifier.padding(bottom = 12.dp),
                )
            }

            ChipRow(modifier = Modifier.padding(bottom = 16.dp)) {
                CONTENT_CATEGORIES.forEach { category ->
                    AppChip(
                        text = category,
                        state = if (state.category == category) AppChipState.Selected else AppChipState.Unselected,
                        onClick = { onSelectCategory(category) },
                    )
                }
            }

            TipBar(
                text = "这里的内容都经过临床审定，附字幕与文字替代。示意图不是你的真实病变，不能据此判断本人病因。",
                type = TipBarType.Info,
                modifier = Modifier.padding(bottom = 16.dp),
            )

            if (state.recommended.isNotEmpty()) {
                Text(
                    text = "为你推荐（原因：${state.recommended.first().reason ?: "与你的报告相关"}）",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                state.recommended.forEach { item ->
                    ContentCard(item, onOpenDetail)
                }
            }

            Text(
                text = "全部内容（${state.filtered.size} / ${state.all.size}）",
                color = AppColors.Text1,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 8.dp, bottom = 12.dp),
            )
            if (state.filtered.isEmpty()) {
                Text(text = "该分类下暂无内容", color = AppColors.Text3, style = MaterialTheme.typography.labelMedium)
            }
            state.filtered.forEach { item ->
                ContentCard(item, onOpenDetail)
            }

            TipBar(
                text = "本库不包含实时生成的个性化查体或训练处方；康复动作内容待专业设计与审定后再加入。",
                type = TipBarType.Warn,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        BottomTabBar(selected = null, onSelect = onSelectTab)
    }
}

@Composable
private fun ContentCard(item: ContentItem, onOpenDetail: (String) -> Unit) {
    val offline = item.offline
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = AppDimens.CardGap)
            .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
            .clickable { onOpenDetail(item.id) }
            .padding(12.dp)
            .alpha(if (offline) 0.6f else 1f),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .background(AppColors.Bg, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = if (item.type == "视频") AppIcons.Play else AppIcons.Document,
                contentDescription = null,
                tint = AppColors.Primary,
                modifier = Modifier.size(24.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(text = item.title, color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
            Text(
                text = buildMeta(item),
                color = AppColors.Text2,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 2.dp),
            )
            ChipRow(modifier = Modifier.padding(top = 6.dp)) {
                StatusTag(label = "已审核 v${item.auditVersion ?: 1}")
                val scopeTag = item.applicableScope?.takeIf { it.isNotBlank() }?.let { "适用：$it" }
                    ?: item.notApplicable?.takeIf { it.isNotBlank() }
                scopeTag?.let { StatusTag(label = it) }
            }
        }
    }
}

private fun buildMeta(item: ContentItem): String {
    val parts = mutableListOf<String>()
    parts += if (item.type == "视频") "视频" else "图文"
    item.duration?.let { parts += it }
    if (item.type == "视频") {
        parts += "字幕"
        parts += "文字替代"
    }
    return parts.joinToString(" · ")
}
