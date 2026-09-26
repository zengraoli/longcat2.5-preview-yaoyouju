package com.yaoyouju.app.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.yaoyouju.app.data.api.FollowupPreview
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.BottomNavBar
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.SecondaryButton
import com.yaoyouju.app.ui.components.SegmentTabs
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
import com.yaoyouju.app.ui.components.TextLink
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import kotlinx.coroutines.launch

/** A12 复诊准备：一页交接摘要 / 问题清单 / 带什么，数据来自 /followup/preview。 */
@Composable
fun FollowupScreen(
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var episode by remember { mutableStateOf<Episode?>(null) }
    var preview by remember { mutableStateOf<FollowupPreview?>(null) }
    var latestReportDate by remember { mutableStateOf("") }
    var unknown by remember { mutableStateOf<List<String>>(emptyList()) }
    var changeRaw by remember { mutableStateOf<String?>(null) }
    var lastLog by remember { mutableStateOf<CareEvent?>(null) }
    var activeTab by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        scope.launch {
            runCatching { ApiClient.api.getEpisodes().unwrap() }.onSuccess { episodes ->
                episode = episodes.firstOrNull()
                val episodeId = episode?.id ?: return@onSuccess
                runCatching { ApiClient.api.previewFollowup(mapOf("episodeId" to episodeId)).unwrap() }
                    .onSuccess { preview = it }
                runCatching { ApiClient.api.getReportsByEpisode(episodeId).unwrap() }
                    .onSuccess { reports -> latestReportDate = reports.firstOrNull()?.get("report_date").orEmpty() }
                runCatching { ApiClient.api.getLatestAnalysis(episodeId).unwrap() }
                    .onSuccess { unknown = it.sections.unknown }
                runCatching { ApiClient.api.getTimeline(episodeId).unwrap() }
                    .onSuccess { events ->
                        changeRaw = events.firstOrNull { it.eventType == "变化确认" }?.rawText
                        lastLog = events.filter { it.eventType == "症状" }
                            .sortedByDescending { it.occurredAt }
                            .firstOrNull()
                    }
            }
        }
    }

    val change = remember(changeRaw) { parseChangeText(changeRaw) }
    val sections = preview?.sections
    val generatedAt = preview?.generatedAt?.take(10).orEmpty()

    val onsetText = when {
        change.onset.isNotEmpty() && change.onset != "尚未确认" -> "${change.onset} 开始腰痛（自述）。"
        else -> {
            val onset = sections?.chiefComplaint?.onsetDate ?: "尚未确认"
            if (onset.isNotEmpty() && onset != "尚未确认") "$onset 开始腰痛（具体日期以记录为准）。"
            else "症状开始时间尚未确认。可在“当前情况-生成分析”中回答后自动记录。"
        }
    }
    val onsetConfirmed = change.onset.isNotEmpty() && change.onset != "尚未确认" &&
        !change.onset.contains("约") && !change.onset.contains("记不清")
    val chiefOnset = if (change.onset.isNotEmpty() && change.onset != "尚未确认") change.onset
        else sections?.chiefComplaint?.onsetDate ?: "尚未确认"
    val chiefText = buildChiefText(change, episode, lastLog, unknown)
    val recentLogs = sections?.symptomsAndChanges?.recentLogs.orEmpty()
    val actionsText = if (recentLogs.isEmpty()) "已采取的行动尚未记录。可在“病程-记录今天”中补充。"
        else {
            val log = recentLogs.first()
            "最近记录：坐姿约 ${log["sitMinutes"] ?: "尚未确认"} 分钟；${
                (log["topWorry"]?.takeIf { it.isNotEmpty() })?.let { "担心：$it" } ?: "未记录担心的事"
            }。"
        }
    val questions = (sections?.questionsForDoctor?.questions.orEmpty() + unknown)
    val bringItems = buildList {
        if (latestReportDate.isNotEmpty()) add("已录入的检查报告原文（$latestReportDate）")
        add("症状开始时间与最近变化记录")
        if ((sections?.diagnosisAndAssessment?.doctorRecords?.isNotEmpty()) == true) add("正在使用的药物与既有医嘱")
    }
    // 报告写“右侧”而自述侧别为“左侧”时提示侧别不一致（与 A08 高亮逻辑一致）
    val reportConflict = (sections?.examinationFindings?.reports.orEmpty()).any { it.text.contains("右侧") } && change.side == "左侧"

    fun buildText(): String = listOf(
        "复诊交接摘要",
        "生成于 $generatedAt · 由用户自述与报告原文整理 · 未经医生核实",
        "",
        "【本次发作起点】$chiefOnset",
        "【主要症状与变化】$chiefText",
        "【相关检查原文】${(sections?.examinationFindings?.reports.orEmpty()).joinToString("\n") { "[${it.date}] ${it.text}" }}",
        "【想问医生的问题】${questions.joinToString("；")}",
    ).joinToString("\n")

    fun copyText() {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("复诊交接摘要", buildText()))
        Toast.makeText(context, "已复制到剪贴板", Toast.LENGTH_SHORT).show()
    }

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
            Text("复诊准备", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { copyText() }, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Filled.Share, contentDescription = "分享", tint = Text2)
            }
        }

        SegmentTabs(
            tabs = listOf("一页交接摘要", "问题清单 (${questions.size})", "带什么"),
            selectedIndex = activeTab,
            onSelect = { activeTab = it },
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(Dimens.gapL))

        when (activeTab) {
            0 -> SummaryTab(
                generatedAt = generatedAt,
                onsetText = onsetText,
                onsetConfirmed = onsetConfirmed,
                chiefText = chiefText,
                symptomCount = recentLogs.size,
                reports = sections?.examinationFindings?.reports.orEmpty(),
                reportConflict = reportConflict,
                doctorRecords = sections?.diagnosisAndAssessment?.doctorRecords.orEmpty(),
                actionsText = actionsText,
                questions = questions,
            )
            1 -> Column(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                questions.forEachIndexed { i, q ->
                    YyjCard(modifier = Modifier.padding(bottom = 12.dp)) {
                        Row {
                            Text("${i + 1}", color = Primary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.width(12.dp))
                            Text(q, color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
                        }
                    }
                }
            }
            else -> YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Text("就诊时可以带上", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
                Spacer(Modifier.height(12.dp))
                bringItems.forEach { item ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("✓", color = Primary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.width(10.dp))
                        Text(item, color = Text1, fontSize = 14.sp)
                    }
                    Spacer(Modifier.height(10.dp))
                }
            }
        }

        if (activeTab == 0) {
            Spacer(Modifier.height(24.dp))
            Row(
                modifier = Modifier.padding(horizontal = Dimens.pagePadding),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                PrimaryButton(
                    text = "导出 PDF",
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val eid = episode?.id
                        if (eid != null) {
                            scope.launch {
                                runCatching { ApiClient.api.exportFollowup(mapOf("episodeId" to eid, "format" to "pdf")).unwrap() }
                            }
                        }
                        Toast.makeText(context, "请在浏览器中使用打印功能保存为 PDF", Toast.LENGTH_SHORT).show()
                    },
                )
                SecondaryButton(
                    text = "生成图片",
                    modifier = Modifier.weight(1f),
                    onClick = { copyText() },
                )
                SecondaryButton(
                    text = "复制文本",
                    modifier = Modifier.weight(1f),
                    onClick = { copyText() },
                )
            }
            Spacer(Modifier.height(Dimens.gapL))
            AlertBar(
                text = "导出后由你自行决定是否分享给医生；本产品不会主动把你的健康资料发送给任何第三方。",
                type = AlertType.INFO,
                modifier = Modifier.padding(horizontal = Dimens.pagePadding),
            )
        }
        Spacer(Modifier.height(Dimens.gapL))
        BottomNavBar(currentRoute = "A12", onTabSelected = onNavigate)
    }
}

@Composable
private fun SummaryTab(
    generatedAt: String,
    onsetText: String,
    onsetConfirmed: Boolean,
    chiefText: String,
    symptomCount: Int,
    reports: List<com.yaoyouju.app.data.api.FollowupReport>,
    reportConflict: Boolean,
    doctorRecords: List<Map<String, String>>,
    actionsText: String,
    questions: List<String>,
) {
    YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
        Text("复诊交接摘要", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Text1)
        Spacer(Modifier.height(6.dp))
        Text(
            "生成于 $generatedAt · 由用户自述与报告原文整理 · 未经医生核实",
            color = Text3,
            fontSize = 12.sp,
            lineHeight = 18.sp,
        )
        Spacer(Modifier.height(12.dp))
        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Border))
        Spacer(Modifier.height(16.dp))

        // 本次发作起点
        Block(title = "本次发作起点") {
            Text(onsetText, color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusTag("自述", TagType.MUTED)
                StatusTag(if (onsetConfirmed) "已确认" else "日期尚未确认", if (onsetConfirmed) TagType.OK else TagType.WARN)
            }
        }

        // 主要症状与变化
        Block(title = "主要症状与变化") {
            Text(chiefText, color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusTag("自述 · $symptomCount 条记录", TagType.MUTED)
                StatusTag("腿部无力：尚未确认", TagType.WARN)
            }
        }

        // 相关检查原文
        Block(title = "相关检查原文") {
            reports.forEach { r ->
                Text(
                    "${r.date} 腰椎 MRI：“${r.text}”",
                    color = Text1,
                    fontSize = 14.sp,
                    lineHeight = 22.sp,
                )
                Spacer(Modifier.height(8.dp))
            }
            Spacer(Modifier.height(2.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusTag("报告原文", TagType.INFO)
                if (reportConflict) StatusTag("与自述侧别不一致", TagType.ERROR)
            }
        }

        // 已经接受的专业建议
        Block(title = "已经接受的专业建议") {
            if (doctorRecords.isEmpty()) {
                Text("尚未记录。可在“病程-录入报告与医嘱”中补充。", color = Text3, fontSize = 14.sp)
            } else {
                doctorRecords.forEach { r ->
                    Text(r["text"] ?: "", color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
                    Spacer(Modifier.height(8.dp))
                }
            }
            Spacer(Modifier.height(2.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusTag("自述转述", TagType.MUTED)
                StatusTag("未经核实", TagType.WARN)
            }
        }

        // 已采取的行动
        Block(title = "已采取的行动") {
            Text(actionsText, color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
            Spacer(Modifier.height(10.dp))
            StatusTag("自述", TagType.MUTED)
        }

        // 最希望解决的问题
        Block(title = "最希望解决的问题") {
            questions.forEachIndexed { i, q ->
                Row(verticalAlignment = Alignment.Top, modifier = Modifier.padding(bottom = 8.dp)) {
                    Text(circledNumber(i + 1), color = Primary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.width(8.dp))
                    Text(q, color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Border))
        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Shield, contentDescription = null, tint = Text2, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(
                "本摘要整理已有信息，保留时间来源与未核实项，不含诊断结论。",
                color = Text2,
                fontSize = 12.sp,
                lineHeight = 18.sp,
            )
        }
    }
}

@Composable
private fun Block(title: String, content: @Composable () -> Unit) {
    Column(modifier = Modifier.padding(bottom = 16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title, fontWeight = FontWeight.Medium, fontSize = 15.sp, color = Text1, modifier = Modifier.weight(1f))
            TextLink(text = "纠正", onClick = { /* 与 App 端一致：仅展示入口 */ })
        }
        Spacer(Modifier.height(8.dp))
        content()
    }
}

private fun circledNumber(n: Int): String = listOf("①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩").getOrElse(n - 1) { "$n" }
