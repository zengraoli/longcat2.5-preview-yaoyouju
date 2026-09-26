package com.yaoyouju.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.api.Analysis
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.CareEvent
import com.yaoyouju.app.data.api.Episode
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.BottomNavBar
import com.yaoyouju.app.ui.components.SoftButton
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.Ok
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Warn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/** A10 病程：本次发作统计、14 天柱图、按事件时间线（保留来源与核实状态）。 */
@Composable
fun TimelineScreen(
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var episode by remember { mutableStateOf<Episode?>(null) }
    var events by remember { mutableStateOf<List<CareEvent>>(emptyList()) }
    var changeRaw by remember { mutableStateOf<String?>(null) }
    var analysis by remember { mutableStateOf<Analysis?>(null) }
    var analysisVersion by remember { mutableStateOf<Int?>(null) }
    var menuForEvent by remember { mutableStateOf<String?>(null) }
    var deleteTarget by remember { mutableStateOf<String?>(null) }

    suspend fun load() {
        runCatching { ApiClient.api.getEpisodes().unwrap() }.onSuccess { episodes ->
            episode = episodes.firstOrNull()
            val episodeId = episode?.id ?: return@onSuccess
            runCatching { ApiClient.api.getTimeline(episodeId).unwrap() }.onSuccess { list ->
                events = list
                changeRaw = list.firstOrNull { it.eventType == "变化确认" }?.rawText
            }
            runCatching { ApiClient.api.getLatestAnalysis(episodeId).unwrap() }.onSuccess {
                analysis = it
                analysisVersion = it.version
            }
        }
    }

    LaunchedEffect(Unit) { scope.launch { load() } }

    // 最新一页分析作为合成事件置顶（与 App 端一致）
    val timeline = remember(events, analysis) {
        val list = events.toMutableList()
        val a = analysis
        if (a != null) {
            list.add(
                0,
                CareEvent(
                    id = "analysis-" + a.analysisId,
                    episodeId = a.episodeId,
                    eventType = "分析",
                    occurredAt = a.createdAt,
                    sourceType = "系统生成",
                    rawText = "生成于模型 M-2609；使用报告与症状记录。",
                    verifyStatus = "已确认",
                ),
            )
        }
        list
    }
    val questionCount = (analysis?.sections?.unknown?.size ?: 0) +
        timeline.count { it.eventType == "症状" && !it.topWorry.isNullOrEmpty() && it.topWorry != "尚未确认" }

    val changeOnset = remember(changeRaw) {
        Regex("开始日期：([^；]*)").find(changeRaw ?: "")?.groupValues?.get(1)?.trim().orEmpty()
    }
    val onsetText = when {
        changeOnset.isNotEmpty() && changeOnset != "尚未确认" -> "$changeOnset 开始腰痛（自述）。"
        episode?.onsetDate != null -> "约 ${episode!!.onsetDate!!.take(7)} 中旬（自述，具体日期${episode!!.onsetCertainty}）"
        else -> "尚未确认"
    }

    // 最近 14 天柱图（每天坐姿分钟数；最近 3 天用提醒色，与设计稿一致）
    val chartDays = remember(events) {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val cal = Calendar.getInstance()
        (13 downTo 0).map { i ->
            cal.time = Date()
            cal.add(Calendar.DAY_OF_YEAR, -i)
            val key = sdf.format(cal.time)
            val minutes = events.filter { it.occurredAt.take(10) == key }.sumOf { it.sitMinutes ?: 0 }
            Pair(key.substring(5), minutes)
        }
    }
    val chartMax = maxOf(60, chartDays.maxOfOrNull { it.second } ?: 0)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 96.dp),
    ) {
        // 头部
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("病程", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { Toast.makeText(context, "筛选（演示）", Toast.LENGTH_SHORT).show() }) {
                Icon(Icons.Filled.FilterList, contentDescription = "筛选", tint = Text2)
            }
            IconButton(onClick = { onNavigate("A11") }) {
                Icon(Icons.Filled.Add, contentDescription = "记录今天", tint = Text1)
            }
        }

        // 本次发作
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    episode?.title ?: "本次发作",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    color = Text1,
                    modifier = Modifier.weight(1f),
                )
                StatusTag(
                    if (episode?.status == "active") "保守治疗中" else (episode?.status ?: "尚未确认"),
                    TagType.PRIMARY,
                )
            }
            Spacer(Modifier.height(6.dp))
            Text("起点：$onsetText", color = Text3, fontSize = 13.sp)
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatBox(value = "${timeline.size}", label = "条记录", modifier = Modifier.weight(1f))
                StatBox(value = "${timeline.count { it.eventType == "报告" }}", label = "份报告", modifier = Modifier.weight(1f))
                StatBox(value = if (analysisVersion != null) "v$analysisVersion" else "0", label = "次分析", modifier = Modifier.weight(1f))
                StatBox(value = "$questionCount", label = "个复诊问题", modifier = Modifier.weight(1f))
            }
        }
        Spacer(Modifier.height(Dimens.gapL))

        // 14 天柱图
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("最近 14 天 · 每天能坐多久", fontSize = 15.sp, fontWeight = FontWeight.Medium, color = Text1, modifier = Modifier.weight(1f))
                Text("分钟", color = Text3, fontSize = 12.sp)
            }
            Spacer(Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                chartDays.forEachIndexed { i, (_, minutes) ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height((minutes.toFloat() / chartMax * 120f).dp.coerceAtLeast(if (minutes > 0) 4.dp else 0.dp))
                            .background(
                                if (i >= chartDays.size - 3) Warn else Primary,
                                RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp),
                            ),
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(chartDays.first().first, color = Text3, fontSize = 11.sp)
                Text(chartDays.last().first, color = Text3, fontSize = 11.sp)
            }
            Spacer(Modifier.height(8.dp))
            Text("图中变化只反映你的记录，不代表影像变化或病情恶化。", color = Text3, fontSize = 12.sp)
        }
        Spacer(Modifier.height(Dimens.gapL))

        Text(
            "记录（按事件，保留来源与核实状态）",
            fontSize = 15.sp,
            fontWeight = FontWeight.Medium,
            color = Text1,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(12.dp))

        // 时间线
        Box(modifier = Modifier.fillMaxWidth().padding(horizontal = Dimens.pagePadding)) {
            Box(
                modifier = Modifier
                    .padding(start = 5.dp, top = 20.dp, bottom = 20.dp)
                    .width(1.dp)
                    .fillMaxHeight()
                    .background(Border),
            )
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                timeline.forEachIndexed { index, item ->
                    Row(verticalAlignment = Alignment.Top) {
                        // 最新一条实心主色，其余按类型描边（与设计稿一致）
                        val dotColor = when {
                            item.eventType == "医嘱" -> Warn
                            item.eventType == "症状开始" -> Text3
                            else -> Primary
                        }
                        if (index == 0) {
                            Box(
                                modifier = Modifier.padding(top = 20.dp).size(12.dp).background(Primary, CircleShape),
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .padding(top = 20.dp)
                                    .size(12.dp)
                                    .background(Surface, CircleShape)
                                    .border(2.dp, dotColor, CircleShape),
                            )
                        }
                        Spacer(Modifier.width(10.dp))
                        YyjCard(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(item.occurredAt.take(10), color = Text2, fontSize = 13.sp, modifier = Modifier.weight(1f))
                                StatusTag(eventTypeLabel(item, analysisVersion), eventTypeTagType(item.eventType))
                                Box {
                                    IconButton(onClick = { menuForEvent = item.id }, modifier = Modifier.size(32.dp)) {
                                        Icon(Icons.Filled.MoreVert, contentDescription = "更多", tint = Text3, modifier = Modifier.size(18.dp))
                                    }
                                    DropdownMenu(
                                        expanded = menuForEvent == item.id,
                                        onDismissRequest = { menuForEvent = null },
                                    ) {
                                        DropdownMenuItem(
                                            text = { Text("纠正", color = Primary, fontSize = 14.sp) },
                                            onClick = {
                                                menuForEvent = null
                                                Toast.makeText(context, "请选择要纠正的内容（演示）", Toast.LENGTH_SHORT).show()
                                            },
                                        )
                                        DropdownMenuItem(
                                            text = { Text("删除", color = Error, fontSize = 14.sp) },
                                            onClick = {
                                                deleteTarget = item.id
                                                menuForEvent = null
                                            },
                                        )
                                    }
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(item.rawText ?: "暂无描述", color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
                            Spacer(Modifier.height(10.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                StatusTag(item.sourceType, TagType.MUTED)
                                val verifyType = when (item.verifyStatus) {
                                    "已确认" -> TagType.OK
                                    "有冲突" -> TagType.ERROR
                                    else -> TagType.WARN
                                }
                                StatusTag(item.verifyStatus, verifyType)
                            }
                        }
                    }
                }
            }
        }

        if (timeline.isEmpty()) {
            Spacer(Modifier.height(Dimens.gapL))
            YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("暂无病程记录", color = Text3, fontSize = 14.sp)
                    Spacer(Modifier.height(12.dp))
                    SoftButton(text = "记录今天", onClick = { onNavigate("A11") })
                }
            }
        }
        Spacer(Modifier.height(Dimens.gapL))
        // 删除确认
        deleteTarget?.let { targetId ->
            AlertDialog(
                onDismissRequest = { menuForEvent = null },
                title = { Text("删除记录") },
                text = { Text("确定删除这条记录？") },
                confirmButton = {
                    TextButton(onClick = {
                        deleteTarget = null
                        scope.launch {
                            runCatching { ApiClient.api.deleteCareEvent(targetId).unwrap() }
                                .onSuccess {
                                    Toast.makeText(context, "已删除", Toast.LENGTH_SHORT).show()
                                    load()
                                }
                                .onFailure { Toast.makeText(context, it.message ?: "删除失败", Toast.LENGTH_SHORT).show() }
                        }
                    }) { Text("删除", color = Error) }
                },
                dismissButton = {
                    TextButton(onClick = { deleteTarget = null }) { Text("取消") }
                },
            )
        }
        BottomNavBar(currentRoute = "A10", onTabSelected = onNavigate)
    }
}

@Composable
private fun StatBox(value: String, label: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(Bg, RoundedCornerShape(8.dp))
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(value, color = Primary, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        Text(label, color = Text3, fontSize = 11.sp)
    }
}

private fun eventTypeLabel(item: CareEvent, version: Int?): String = when (item.eventType) {
    "症状" -> "症状记录"
    "报告" -> "检查报告"
    "分析" -> if (item.id.startsWith("analysis-") && version != null) "一页分析 v$version" else "一页分析"
    "医嘱" -> "医生建议"
    "症状开始" -> "症状开始"
    else -> item.eventType
}

/** 事件类型标签配色（对齐设计稿：症状记录/一页分析蓝、医生建议橙、检查报告绿、症状开始灰） */
private fun eventTypeTagType(eventType: String): TagType = when (eventType) {
    "症状", "分析" -> TagType.INFO
    "医嘱" -> TagType.WARN
    "报告" -> TagType.OK
    "症状开始" -> TagType.MUTED
    else -> TagType.MUTED
}
