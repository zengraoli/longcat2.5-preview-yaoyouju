package com.yaoyouju.app.feature.timeline

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppChip
import com.yaoyouju.app.core.components.AppChipState
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.AppTextArea
import com.yaoyouju.app.core.components.BottomTabBar
import com.yaoyouju.app.core.components.ChineseDatePickerDialog
import com.yaoyouju.app.core.components.ChipRow
import com.yaoyouju.app.core.components.SimpleChoiceDialogHost
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A10 病程时间线（R05） */
@Composable
fun TimelineScreen(
    state: TimelineUiState,
    onSelectTab: (TabDestination) -> Unit,
    onToggleFilter: () -> Unit,
    onSelectFilter: (String) -> Unit,
    onShowAdd: (Boolean) -> Unit,
    onAddTypeIndex: (Int) -> Unit,
    onAddDate: (String) -> Unit,
    onAddText: (String) -> Unit,
    onSaveEvent: () -> Unit,
    onDeleteEvent: (String) -> Unit,
    onRetry: () -> Unit,
    onFallback: () -> Unit,
) {
    var deleteTarget by remember { mutableStateOf<TimelineItem?>(null) }
    var showTypePicker by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }

    val filtered = remember(state.items, state.filter) {
        if (state.filter == "全部") state.items else state.items.filter { it.filterKey == state.filter }
    }

    Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = AppDimens.PageMargin)
                    .padding(top = 16.dp, bottom = 24.dp),
            ) {
                // 顶部
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(text = "病程", color = AppColors.Text1, style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Icon(
                            imageVector = AppIcons.Filter,
                            contentDescription = "筛选",
                            tint = if (state.showFilter) AppColors.Primary else AppColors.Text2,
                            modifier = Modifier.size(20.dp).clickable { onToggleFilter() },
                        )
                        Icon(
                            imageVector = AppIcons.Add,
                            contentDescription = "新增记录",
                            tint = AppColors.Text1,
                            modifier = Modifier.size(22.dp).clickable { onShowAdd(true) },
                        )
                    }
                }

                if (state.error != null) {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                        TipBar(text = "${state.error}。已审核科普与就医提示仍可查看。", type = TipBarType.Warn)
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            AppButton(text = "重试", onClick = onRetry, modifier = Modifier.weight(1f))
                            AppButton(
                                text = "服务不可用说明",
                                onClick = onFallback,
                                type = com.yaoyouju.app.core.components.AppButtonType.Secondary,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }

                if (state.showFilter) {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                        ChipRow {
                            TIMELINE_FILTERS.forEach { filter ->
                                AppChip(
                                    text = filter,
                                    state = if (state.filter == filter) AppChipState.Selected else AppChipState.Unselected,
                                    onClick = { onSelectFilter(filter) },
                                )
                            }
                        }
                    }
                }

                // 本次发作
                if (state.episode != null) {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(text = state.episode?.title ?: "本次发作", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                            Text(
                                text = "保守治疗中",
                                color = AppColors.Primary,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier
                                    .background(AppColors.PrimaryLight, RoundedCornerShape(AppDimens.RadiusLabel))
                                    .padding(horizontal = 10.dp, vertical = 2.dp),
                            )
                        }
                        Text(
                            text = "起点：${state.onsetLabel}（自述，具体日期尚未确认）",
                            color = AppColors.Text2,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(bottom = 16.dp),
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            StatBox("${state.recordCount}", "条记录", Modifier.weight(1f))
                            StatBox("${state.reportCount}", "份报告", Modifier.weight(1f))
                            StatBox("${state.analysisCount}", "次分析", Modifier.weight(1f))
                            StatBox("${state.questionCount}", "个复诊问题", Modifier.weight(1f))
                        }
                    }
                }

                // 最近 14 天
                if (state.chart.isNotEmpty()) {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {                        Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(text = "最近 14 天 · 每天能坐多久", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                            Text(text = "分钟", color = AppColors.Text3, style = MaterialTheme.typography.bodySmall)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth().height(100.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.Bottom,
                        ) {
                            state.chart.forEach { bar ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(bar.heightFraction)
                                        .background(
                                            if (bar.warn) AppColors.Warn else AppColors.Primary,
                                            RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp),
                                        ),
                                )
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(text = state.chartStart, color = AppColors.Text3, style = MaterialTheme.typography.labelSmall)
                            Text(text = state.chartEnd, color = AppColors.Text3, style = MaterialTheme.typography.labelSmall)
                        }
                        Text(
                            text = "图中变化只反映你的记录，不代表影像变化或病情恶化。",
                            color = AppColors.Text2,
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                } else {
                    AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                        Text(text = "最近 14 天暂无记录", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                        Text(
                            text = "记录今天后，这里会显示每天能坐多久的变化。",
                            color = AppColors.Text2,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                }

                Text(
                    text = "记录（按事件，保留来源与核实状态）",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
                )

                if (filtered.isEmpty()) {
                    AppCard { Text(text = "暂无记录", color = AppColors.Text3, style = MaterialTheme.typography.bodyMedium) }
                }

                filtered.forEachIndexed { index, item ->
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
                        Column(
                            modifier = Modifier.width(16.dp).fillMaxHeight(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .background(dotColor(item.tone), CircleShape),
                            )
                            if (index < filtered.size - 1) {
                                Box(
                                    modifier = Modifier
                                        .width(2.dp)
                                        .weight(1f)
                                        .background(AppColors.Border),
                                )
                            }
                        }
                        Box(modifier = Modifier.width(12.dp))
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
                                .padding(12.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(
                                    text = item.dateLabel,
                                    color = AppColors.Text2,
                                    style = MaterialTheme.typography.labelMedium,
                                    modifier = Modifier.weight(1f),
                                )
                                TypeTag(item.typeLabel, item.tone)
                                if (item.eventId != null) {
                                    Icon(
                                        imageVector = AppIcons.More,
                                        contentDescription = "更多",
                                        tint = AppColors.Text3,
                                        modifier = Modifier.size(16.dp).clickable { deleteTarget = item },
                                    )
                                }
                            }
                            Text(
                                text = item.text,
                                color = AppColors.Text1,
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.padding(bottom = 8.dp),
                            )
                            ChipRow {
                                item.tags.forEach { tag -> StatusTag(label = tag) }
                            }
                        }
                    }
                }
            }

            BottomTabBar(selected = TabDestination.Timeline, onSelect = onSelectTab)
        }

        // 新增记录弹层
        if (state.showAdd) {
            DialogMask(onDismiss = { onShowAdd(false) }) {
                Text(text = "新增记录", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                Box(modifier = Modifier.padding(top = 12.dp)) {
                    FieldButton(text = EVENT_TYPES[state.addTypeIndex], onClick = { showTypePicker = true })
                }
                Box(modifier = Modifier.padding(top = 10.dp)) {
                    FieldButton(text = state.addDate.ifBlank { "选择日期" }, onClick = { showDatePicker = true })
                }
                Box(modifier = Modifier.padding(top = 10.dp)) {
                    AppTextArea(
                        value = state.addText,
                        onValueChange = onAddText,
                        placeholder = "记录原文（如报告片段、医嘱、症状变化）",
                        minHeight = 100,
                    )
                }
                AppButton(text = "保存", onClick = onSaveEvent, block = true, modifier = Modifier.padding(top = 12.dp))
                Text(
                    text = "取消",
                    color = AppColors.Primary,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.fillMaxWidth().clickable { onShowAdd(false) }.padding(vertical = 12.dp),
                )
            }
        }

        if (showTypePicker) {
            SimpleChoiceDialogHost(
                title = "记录类型",
                options = EVENT_TYPES,
                onSelect = { onAddTypeIndex(it); showTypePicker = false },
                onDismiss = { showTypePicker = false },
            )
        }

        if (showDatePicker) {
            ChineseDatePickerDialog(
                initial = state.addDate,
                onSelect = { onAddDate(it); showDatePicker = false },
                onDismiss = { showDatePicker = false },
            )
        }

        deleteTarget?.let { target ->
            DialogMask(onDismiss = { deleteTarget = null }) {
                Text(text = "删除记录", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                Text(
                    text = "确定删除这条记录吗？",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
                )
                AppButton(
                    text = "确定删除",
                    onClick = {
                        target.eventId?.let(onDeleteEvent)
                        deleteTarget = null
                    },
                    block = true,
                )
                Text(
                    text = "取消",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.fillMaxWidth().clickable { deleteTarget = null }.padding(vertical = 12.dp),
                )
            }
        }
    }
}

@Composable
private fun StatBox(number: String, label: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(AppColors.Bg, RoundedCornerShape(AppDimens.RadiusButton))
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = number, color = AppColors.Primary, style = MaterialTheme.typography.titleLarge)
        Text(text = label, color = AppColors.Text2, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun TypeTag(text: String, tone: TimelineTone) {
    val color = when (tone) {
        TimelineTone.Ok -> AppColors.Ok
        TimelineTone.Info -> AppColors.Info
        TimelineTone.Warn -> AppColors.Warn
        TimelineTone.Neutral -> AppColors.Text2
    }
    Text(
        text = text,
        color = color,
        style = MaterialTheme.typography.labelSmall,
        modifier = Modifier
            .background(AppColors.tint(color, 0.1f), RoundedCornerShape(AppDimens.RadiusLabel))
            .padding(horizontal = 8.dp, vertical = 1.dp),
    )
}

private fun dotColor(tone: TimelineTone): Color = when (tone) {
    TimelineTone.Ok -> AppColors.Ok
    TimelineTone.Info -> AppColors.Info
    TimelineTone.Warn -> AppColors.Warn
    TimelineTone.Neutral -> AppColors.Text3
}

@Composable
private fun DialogMask(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0x66000000)).clickable { onDismiss() },
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
            content()
        }
    }
}

@Composable
private fun FieldButton(text: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(AppColors.Bg, RoundedCornerShape(AppDimens.RadiusButton))
            .border(1.dp, AppColors.Border, RoundedCornerShape(AppDimens.RadiusButton))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 13.dp),
    ) {
        Text(text = text, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium)
    }
}
