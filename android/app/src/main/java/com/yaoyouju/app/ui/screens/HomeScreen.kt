package com.yaoyouju.app.ui.screens

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.api.Analysis
import com.yaoyouju.app.data.api.CareEvent
import com.yaoyouju.app.data.api.ContentItem
import com.yaoyouju.app.data.api.Episode
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.BottomNavBar
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.EmergencyBar
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.SecondaryButton
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.PrimaryLight
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Warn
import com.yaoyouju.app.ui.theme.Info
import com.yaoyouju.app.ui.theme.Ok
import com.yaoyouju.app.ui.theme.OkTint
import kotlinx.coroutines.launch

data class RecordItem(val date: String, val text: String, val dot: Color)

/**
 * A14 首页 · 当前情况（主 Tab）。
 * 待确认项优先、最新分析摘要、快捷入口、复诊倒计时；数据全部来自 server 接口。
 */
@Composable
fun HomeScreen(
    onNavigate: (String) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var episode by remember { mutableStateOf<Episode?>(null) }
    var analysis by remember { mutableStateOf<Analysis?>(null) }
    var records by remember { mutableStateOf<List<RecordItem>>(emptyList()) }
    var recommend by remember { mutableStateOf<ContentItem?>(null) }
    var planDate by remember { mutableStateOf("") }
    var planDays by remember { mutableStateOf(0) }
    var pendingDismissed by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        scope.launch {
            runCatching { com.yaoyouju.app.data.api.ApiClient.api.getEpisodes().unwrap() }
                .onSuccess { episodes ->
                    episode = episodes.firstOrNull()
                    val episodeId = episode?.id ?: return@onSuccess
                    runCatching { com.yaoyouju.app.data.api.ApiClient.api.getLatestAnalysis(episodeId).unwrap() }
                        .onSuccess { analysis = it }
                    runCatching { com.yaoyouju.app.data.api.ApiClient.api.getTimeline(episodeId).unwrap() }
                        .onSuccess { events ->
                            records = events.take(5).map { it.toRecordItem() }
                            events.firstOrNull()?.let { latest ->
                                val d = parseIsoDay(latest.occurredAt)
                                if (d != null) {
                                    val plus = java.util.Date(d.time + 28L * 86400_000L)
                                    planDate = plus.toIsoString().substring(0, 10)
                                    planDays = 28
                                }
                            }
                        }
                }
            runCatching { com.yaoyouju.app.data.api.ApiClient.api.getPublishedContents().unwrap() }
                .onSuccess { recommend = it.firstOrNull() }
        }
    }

    val pendingItems = analysis?.sections?.unknown?.filter { it != "尚未确认" } ?: emptyList()

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
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text("当前情况", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
                val subtitle = episode?.let { ep ->
                    val statusText = if (ep.status == "active") "保守治疗中" else ep.status
                    "本次发作 · $statusText · 起点${ep.onsetDate ?: "尚未确认"}"
                } ?: "暂无病程数据"
                Text(subtitle, color = Text3, fontSize = 12.sp)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Notifications, contentDescription = "通知", tint = Text3, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(PrimaryLight, CircleShape),
                    contentAlignment = Alignment.Center,
                ) { Text("U", color = Primary, fontWeight = FontWeight.SemiBold, fontSize = 13.sp) }
            }
        }

        // 待确认项
        if (pendingItems.isNotEmpty() && !pendingDismissed) {
            YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Warning, contentDescription = null, tint = Warn, modifier = Modifier.size(22.dp))
                    Spacer(Modifier.width(10.dp))
                    Text("有 ${pendingItems.size} 项信息尚未确认", color = Warn, fontWeight = FontWeight.Medium, fontSize = 15.sp)
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    "确认后才会生成新的分析；没有回答的问题会记录为“尚未确认”，不会被当作“没有”。",
                    color = Text2, fontSize = 13.sp, lineHeight = 20.sp,
                )
                pendingItems.forEach { q ->
                    Text("· $q", color = Text1, fontSize = 14.sp, modifier = Modifier.padding(top = 8.dp))
                }
                Spacer(Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PrimaryButton(text = "现在确认（约 30 秒）", onClick = { onNavigate("A02") }, modifier = Modifier.weight(1f))
                    SecondaryButton(text = "稍后", onClick = { pendingDismissed = true }, modifier = Modifier.weight(1f))
                }
            }
            Spacer(Modifier.height(Dimens.gapL))
        }

        // 最新一页分析
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            if (analysis != null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("最新一页分析", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1, modifier = Modifier.weight(1f))
                    Text("v${analysis!!.version} · ${formatDay(analysis!!.createdAt)}", color = Text3, fontSize = 11.sp)
                    Spacer(Modifier.width(8.dp))
                    StatusTag("不作诊断", com.yaoyouju.app.ui.components.TagType.ERROR)
                }
                Spacer(Modifier.height(12.dp))
                analysis!!.sections.known.take(2).forEach { k ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("已知", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Medium,
                            modifier = Modifier.background(Primary, RoundedCornerShape(4.dp)).padding(horizontal = 8.dp, vertical = 2.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(k, color = Text1, fontSize = 14.sp)
                    }
                    Spacer(Modifier.height(10.dp))
                }
                PrimaryButton(text = "查看完整分析", onClick = { onNavigate("A07") })
            } else {
                Text("尚未生成分析", color = Text3, fontSize = 14.sp)
                Spacer(Modifier.height(12.dp))
                PrimaryButton(text = "生成分析", onClick = { onNavigate("A02") })
            }
        }
        Spacer(Modifier.height(Dimens.gapL))

        // 计划复诊
        if (planDate.isNotEmpty()) {
            YyjCard(
                modifier = Modifier
                    .padding(horizontal = Dimens.pagePadding)
                    .clickable { onNavigate("A12") },
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Schedule, contentDescription = null, tint = Primary, modifier = Modifier.size(22.dp))
                    Spacer(Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("计划复诊", color = Text2, fontSize = 13.sp)
                        Text("$planDate（约 $planDays 天后）", color = Primary, fontWeight = FontWeight.SemiBold, fontSize = 17.sp)
                        Text("来源：按最近记录推算 · 未经核实", color = Text3, fontSize = 11.sp)
                    }
                    Text("›", color = Text3, fontSize = 20.sp)
                }
            }
            Spacer(Modifier.height(Dimens.gapL))
        }

        // 最近记录
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Text("最近记录", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
            Spacer(Modifier.height(12.dp))
            records.forEach { r ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(r.date, color = Text3, fontSize = 12.sp, modifier = Modifier.width(44.dp))
                    Box(modifier = Modifier.size(8.dp).background(r.dot, CircleShape))
                    Spacer(Modifier.width(10.dp))
                    Text(r.text, color = Text1, fontSize = 13.sp, lineHeight = 19.sp)
                }
                Spacer(Modifier.height(12.dp))
            }
            if (records.isEmpty()) {
                Text("暂无记录", color = Text3, fontSize = 13.sp)
            }
        }
        Spacer(Modifier.height(Dimens.gapL))

        // 快捷入口
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding),
            horizontalArrangement = Arrangement.spacedBy(Dimens.gapM),
        ) {
            QuickItem("记录今天", Icons.Filled.Edit, "约 1 分钟") { onNavigate("A11") }
            QuickItem("录入报告", Icons.Filled.Notifications, "粘贴文字") { onNavigate("A05") }
            QuickItem("问与解释", Icons.Filled.Favorite, "基于当前上下文") { onNavigate("A09") }
            QuickItem("复诊准备", Icons.Filled.Schedule, "4 个问题待确认") { onNavigate("A12") }
        }
        Spacer(Modifier.height(Dimens.gapL))

        // 为你推荐
        recommend?.let { item ->
            YyjCard(
                modifier = Modifier
                    .padding(horizontal = Dimens.pagePadding)
                    .clickable { onNavigate("A15") },
            ) {
                Text("为你推荐（原因：你的报告提到 L5/S1、硬膜囊受压）", color = Text2, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .background(Color(0xFFDDE5EA), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center,
                    ) { Icon(Icons.Filled.PlayArrow, contentDescription = null, tint = Primary) }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text(item.title, fontWeight = FontWeight.Medium, fontSize = 14.sp, color = Text1)
                        Text("${item.type} · 已审核", color = Text3, fontSize = 11.sp)
                    }
                }
            }
            Spacer(Modifier.height(Dimens.gapL))
        }

        EmergencyBar("症状突然变化或出现严重信号？查看就医提示", onClick = { onNavigate("A03") })
    }
    BottomNavBar(currentRoute = "A14", onTabSelected = onNavigate)
}

@Composable
private fun QuickItem(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, desc: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    YyjCard(
        modifier = modifier
            .clickable(onClick = onClick),
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, contentDescription = null, tint = Primary, modifier = Modifier.size(22.dp))
            Spacer(Modifier.height(6.dp))
            Text(title, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = Text1)
            Text(desc, fontSize = 10.sp, color = Text3)
        }
    }
}

private fun CareEvent.toRecordItem(): RecordItem {
    val label = when (eventType) {
        "症状" -> "症状记录：${rawText?.take(20) ?: "尚未确认"}"
        "报告" -> "检查报告已录入"
        "分析" -> "一页分析已生成"
        "医嘱" -> rawText ?: "医生建议"
        else -> rawText ?: eventType
    }
    val color = when (sourceType) {
        "报告原文" -> Info
        "自述" -> Ok
        "医生记录" -> Warn
        else -> Primary
    }
    return RecordItem(date = occurredAt.substring(0, 10), text = label, dot = color)
}

private fun parseIsoDay(iso: String): java.util.Date? =
    runCatching { java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).parse(iso.substring(0, 19)) }.getOrNull()

private fun java.util.Date.toIsoString(): String =
    java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).apply {
        timeZone = java.util.TimeZone.getTimeZone("UTC")
    }.format(this)

private fun formatDay(iso: String?): String = iso?.take(10) ?: ""
