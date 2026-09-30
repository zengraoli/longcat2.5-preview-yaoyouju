package com.yaoyouju.app.feature.qa

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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.BottomTabBar
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens
import com.yaoyouju.app.data.QaMessage

/** A09 问与解释（R03/R04） */
@Composable
fun QaScreen(
    state: QaUiState,
    onSelectTab: (TabDestination) -> Unit,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit,
    onQuickAsk: (String) -> Unit,
    onAddFollowup: (String) -> Unit,
) {
    val listState = rememberLazyListState()
    val initialCount = remember { state.messages.size }
    LaunchedEffect(state.messages.size) {
        if (state.messages.size > initialCount) listState.animateScrollToItem(state.messages.size - 1)
    }

    Column(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(modifier = Modifier.padding(horizontal = AppDimens.PageMargin).padding(top = 16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(text = "问与解释", color = AppColors.Text1, style = MaterialTheme.typography.titleMedium)
                Icon(
                    imageVector = AppIcons.Course,
                    contentDescription = "历史会话",
                    tint = AppColors.Text2,
                    modifier = Modifier.size(20.dp),
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(AppColors.PrimaryLight, RoundedCornerShape(AppDimens.RadiusCard))
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
                    text = state.contextText,
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = AppDimens.PageMargin),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 16.dp, bottom = 12.dp),
        ) {
            items(state.messages, key = { it.id }) { message ->
                if (message.role == "user") {
                    UserBubble(message.content)
                } else {
                    AssistantBubble(
                        message = message,
                        outOfScope = state.outOfScopeMessageIds.contains(message.id),
                        onAddFollowup = onAddFollowup,
                    )
                }
            }
        }

        Column(modifier = Modifier.padding(horizontal = AppDimens.PageMargin)) {
            ChipRow(modifier = Modifier.padding(bottom = 12.dp)) {
                state.quickQuestions.forEach { q ->
                    AppChip(text = q, onClick = { onQuickAsk(q) })
                }
            }
            TipBar(
                text = "本轮已解释 ${state.explainedCount} 个问题，行动计划已记录。若没有新信息，反复确认不会得到不同答案；出现新变化时我会重新评估。",
                type = TipBarType.Warn,
            )
            InputBar(
                value = state.input,
                onValueChange = onInputChange,
                onSend = onSend,
                modifier = Modifier.padding(top = 12.dp),
            )
        }

        BottomTabBar(selected = TabDestination.Qa, onSelect = onSelectTab, modifier = Modifier.padding(top = 8.dp))
    }
}

@Composable
private fun UserBubble(text: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
        Box(
            modifier = Modifier
                .widthIn(max = 300.dp)
                .background(AppColors.Primary, RoundedCornerShape(AppDimens.RadiusCard))
                .padding(horizontal = 14.dp, vertical = 12.dp),
        ) {
            Text(text = text, color = AppColors.Surface, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun AssistantBubble(message: QaMessage, outOfScope: Boolean, onAddFollowup: (String) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(
            modifier = Modifier.size(32.dp).background(AppColors.Primary, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(text = "腰", color = AppColors.Surface, style = MaterialTheme.typography.labelMedium)
        }
        Column(
            modifier = Modifier
                .weight(1f)
                .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
                .border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusCard))
                .padding(14.dp),
        ) {
            Text(text = message.content, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium)
            if (message.citations.isNotEmpty()) {
                ChipRow(modifier = Modifier.padding(top = 8.dp)) {
                    message.citations.forEach { citation ->
                        Text(
                            text = "来源：${citation.docTitle}",
                            color = AppColors.Ok,
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier
                                .background(AppColors.tint(AppColors.Ok, 0.1f), RoundedCornerShape(AppDimens.RadiusLabel))
                                .padding(horizontal = 8.dp, vertical = 2.dp),
                        )
                    }
                }
            }
            if (outOfScope) {
                Text(
                    text = "＋ 把这个最担心的问题加入复诊问题",
                    color = AppColors.Primary,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.padding(top = 8.dp).clickable { onAddFollowup(message.content.take(50)) },
                )
            }
        }
    }
}

@Composable
private fun InputBar(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth().imePadding(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(44.dp)
                .background(AppColors.Surface, RoundedCornerShape(22.dp))
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.CenterStart,
        ) {
            if (value.isEmpty()) {
                Text(text = "输入你的问题…", color = AppColors.Text3, style = MaterialTheme.typography.bodyMedium)
            }
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                textStyle = MaterialTheme.typography.bodyMedium.copy(color = AppColors.Text1),
                cursorBrush = SolidColor(AppColors.Primary),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Box(
            modifier = Modifier.size(44.dp).background(AppColors.Primary, CircleShape).clickable { onSend() },
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = AppIcons.Send,
                contentDescription = "发送",
                tint = AppColors.Surface,
                modifier = Modifier.size(18.dp),
            )
        }
    }
}
