package com.yaoyouju.app.ui.screens

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.api.Analysis
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.ContentItem
import com.yaoyouju.app.data.api.Episode
import com.yaoyouju.app.data.api.StructuredReport
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.BottomNavBar
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.SecondaryButton
import com.yaoyouju.app.ui.components.SelectableChip
import com.yaoyouju.app.ui.components.SoftButton
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
import com.yaoyouju.app.ui.components.TextLink
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Info
import com.yaoyouju.app.ui.theme.Ok
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Warn
import kotlinx.coroutines.launch

/** A07 一页分析：五个编号卡片 + 反馈区 + 底部导航，数据全部来自 server 接口。 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalysisScreen(
    onBack: () -> Unit,
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var episode by remember { mutableStateOf<Episode?>(null) }
    var analysis by remember { mutableStateOf<Analysis?>(null) }
    var report by remember { mutableStateOf<StructuredReport?>(null) }
    var doctorAdvice by remember { mutableStateOf("") }
    var changeRaw by remember { mutableStateOf<String?>(null) }
    var video by remember { mutableStateOf<ContentItem?>(null) }
    var followupCount by remember { mutableIntStateOf(3) }
    var feedback by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        scope.launch {
            runCatching { ApiClient.api.getEpisodes().unwrap() }.onSuccess { episodes ->
                episode = episodes.firstOrNull()
                val episodeId = episode?.id ?: return@onSuccess
                runCatching { ApiClient.api.getLatestAnalysis(episodeId).unwrap() }
                    .onSuccess { analysis = it }
                runCatching { ApiClient.api.getReportsByEpisode(episodeId).unwrap() }
                    .onSuccess { reports ->
                        val firstReportId = reports.firstOrNull()?.get("id") ?: return@onSuccess
                        runCatching { ApiClient.api.getStructuredReport(firstReportId).unwrap() }
                            .onSuccess { report = it }
                    }
                runCatching { ApiClient.api.getTimeline(episodeId).unwrap() }
                    .onSuccess { events ->
                        changeRaw = events.firstOrNull { it.eventType == "变化确认" }?.rawText
                        doctorAdvice = events.firstOrNull { it.eventType == "医嘱" }?.rawText.orEmpty()
                    }
            }
            runCatching { ApiClient.api.getPublishedContents().unwrap() }
                .onSuccess { video = it.firstOrNull() }
        }
    }

    val change = remember(changeRaw) { parseChangeText(changeRaw) }
    val selfDescription = remember(change) { buildSelfDescription(change) }
    val known = analysis?.sections?.known.orEmpty()
    val reportKnown = known.filter { it != "尚未确认" }
    val reportDate = report?.reportDate.orEmpty()
    val reportTerms = report?.extractedTerms?.take(3)?.map { it.term }.orEmpty()
    val analysisDate = analysis?.createdAt?.take(10).orEmpty()

    val introText = remember(report, reportKnown, selfDescription, reportDate) {
        buildString {
            if (!report?.rawText.isNullOrEmpty()) {
                append("你上传的报告中提到了 ${reportKnown.joinToString("、").ifEmpty { "尚未确认" }}；")
            } else {
                append("你尚未录入检查报告；")
            }
            append(selfDescription)
            append(if (reportDate.isNotEmpty()) "报告日期已确认" else "尚未录入报告")
            append("，症状开始日期和是否出现腿部无力还需要确认。下面先解释报告术语，再整理复诊时需要确认的问题。")
        }
    }
    val reportSummary = remember(report, reportDate, reportTerms) {
        if (reportDate.isEmpty()) "尚未录入检查报告。"
        else "报告（$reportDate，${report?.eventType ?: "检查"}）" +
            (if (reportTerms.isNotEmpty()) "提到 ${reportTerms.joinToString("、")}。" else "未见提取术语。")
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("一页分析", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = Text1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    IconButton(onClick = { Toast.makeText(context, "摘要链接（演示）", Toast.LENGTH_SHORT).show() }) {
                        Icon(Icons.Filled.Share, contentDescription = "分享", tint = Text2)
                    }
                    IconButton(onClick = { Toast.makeText(context, "更多操作（演示）", Toast.LENGTH_SHORT).show() }) {
                        Icon(Icons.Filled.MoreVert, contentDescription = "更多", tint = Text2)
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Bg)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 96.dp),
        ) {
            // 元信息
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Dimens.pagePadding),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                StatusTag("不作诊断", TagType.ERROR)
                Text("基于 ${analysisDate.ifEmpty { "尚未确认" }} 的信息", color = Text3, fontSize = 12.sp)
            }
            Text(
                "分析版本 v${analysis?.version ?: "-"} · 模型 M-2609",
                color = Text3,
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = Dimens.pagePadding),
            )
            Text(
                introText,
                color = Text1,
                fontSize = 14.sp,
                lineHeight = 24.sp,
                modifier = Modifier.padding(horizontal = Dimens.pagePadding, vertical = 12.dp),
            )

            // ① 当前确认的信息与来源
            SectionCard(number = 1, numberColor = Primary, title = "当前确认的信息与来源") {
                if (!report?.rawText.isNullOrEmpty()) {
                    BulletItem {
                        Row(verticalAlignment = Alignment.Top) {
                            Text(reportSummary, color = Text1, fontSize = 14.sp, lineHeight = 22.sp, modifier = Modifier.weight(1f))
                            StatusTag("报告原文 · 可回看", TagType.INFO)
                        }
                    }
                }
                BulletItem {
                    Row(verticalAlignment = Alignment.Top) {
                        Text(selfDescription, color = Text1, fontSize = 14.sp, lineHeight = 22.sp, modifier = Modifier.weight(1f))
                        StatusTag("自述 · ${analysisDate.ifEmpty { "尚未确认" }}", TagType.WARN)
                    }
                }
                if (doctorAdvice.isNotEmpty()) {
                    BulletItem {
                        Row(verticalAlignment = Alignment.Top) {
                            Text("医生建议：$doctorAdvice", color = Text1, fontSize = 14.sp, lineHeight = 22.sp, modifier = Modifier.weight(1f))
                            StatusTag("自述 · 未经核实", TagType.WARN)
                        }
                    }
                }
            }

            // ② 这些信息能支持什么解释
            SectionCard(number = 2, numberColor = Info, title = "这些信息能支持什么解释") {
                analysis?.sections?.explanation?.forEach { exp ->
                    BulletItem {
                        Text(exp.text, color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
                        Spacer(Modifier.height(6.dp))
                        StatusTag("来源：${exp.source}", TagType.OK)
                    }
                }
            }

            // ③ 仍缺哪些信息、哪些不能据此判断
            SectionCard(number = 3, numberColor = Warn, title = "仍缺哪些信息、哪些不能据此判断") {
                analysis?.sections?.unknown?.forEach { item ->
                    BulletItem { Text(item, color = Text1, fontSize = 14.sp, lineHeight = 22.sp) }
                }
                BulletItem {
                    Text("不能据此判断这次疼痛的原因、严重程度，或是否需要手术。", color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
                }
            }

            // ④ 建议向医生确认的问题与下一步
            SectionCard(number = 4, numberColor = Ok, title = "建议向医生确认的问题与下一步") {
                analysis?.sections?.nextSteps?.forEach { item ->
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 12.dp)) {
                        Box(
                            modifier = Modifier
                                .size(16.dp)
                                .background(Primary, RoundedCornerShape(3.dp)),
                        )
                        Spacer(Modifier.width(12.dp))
                        Text(item, color = Text1, fontSize = 14.sp, lineHeight = 22.sp)
                    }
                }
                SoftButton(
                    text = "加入复诊问题清单（已选 ${followupCount} 条）",
                    onClick = {
                        followupCount += 1
                        Toast.makeText(context, "已加入复诊问题清单", Toast.LENGTH_SHORT).show()
                    },
                )
            }

            // ⑤ 可选科普视频与本次记录
            SectionCard(number = 5, numberColor = Text3, title = "可选科普视频与本次记录") {
                video?.let { item ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(width = 60.dp, height = 45.dp)
                                .background(Color(0xFFDDE5EA), RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center,
                        ) { Icon(Icons.Filled.PlayArrow, contentDescription = null, tint = Primary) }
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.title, color = Text1, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Spacer(Modifier.height(6.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                StatusTag(if (item.latestVersion != null) "已审核 ${item.latestVersion}" else "已审核", TagType.OK)
                                StatusTag(item.type, TagType.MUTED)
                            }
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        SecondaryButton(
                            text = "保存到病程",
                            modifier = Modifier.weight(1f),
                            onClick = {
                                val a = analysis ?: return@SecondaryButton
                                scope.launch {
                                    runCatching {
                                        ApiClient.api.createCareEvent(
                                            mapOf(
                                                "episodeId" to a.episodeId,
                                                "eventType" to "分析",
                                                "occurredAt" to a.createdAt,
                                                "sourceType" to "系统生成",
                                                "rawText" to "一页分析 v${a.version}（模型 M-2609）",
                                                "verifyStatus" to "已确认",
                                            ),
                                        ).unwrap()
                                    }.onSuccess { Toast.makeText(context, "已保存到病程", Toast.LENGTH_SHORT).show() }
                                        .onFailure { Toast.makeText(context, it.message ?: "保存失败", Toast.LENGTH_SHORT).show() }
                                }
                            },
                        )
                        PrimaryButton(
                            text = "生成复诊摘要",
                            modifier = Modifier.weight(1f),
                            onClick = { onNavigate("A12") },
                        )
                    }
                }
            }

            // 反馈区
            YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Text("这次分析对你有帮助吗？", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    listOf("看懂了", "知道下一步", "都不好，问题没解决").forEach { opt ->
                        SelectableChip(text = opt, selected = feedback == opt, onClick = { feedback = opt })
                    }
                }
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Flag, contentDescription = null, tint = Text3, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    TextLink(
                        text = "报告错误（会记录分析版本与影响范围）",
                        color = Text3,
                        onClick = { onNavigate("A16") },
                    )
                }
            }
            Spacer(Modifier.height(Dimens.gapL))

            AlertBar(
                text = "本页说明“已经知道什么、仍不知道什么、接下来怎么办”，帮助你理解和复诊，不代表医生诊断。",
                type = AlertType.INFO,
                modifier = Modifier.padding(horizontal = Dimens.pagePadding),
            )
        }
        BottomNavBar(currentRoute = "A14", onTabSelected = onNavigate)
    }
}

/** 编号卡片：圆形序号 + 卡片 */
@Composable
private fun SectionCard(number: Int, numberColor: Color, title: String, content: @Composable () -> Unit) {
    YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding, vertical = 8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 16.dp)) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(numberColor, CircleShape),
                contentAlignment = Alignment.Center,
            ) { Text("$number", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium) }
            Spacer(Modifier.width(10.dp))
            Text(title, fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
        }
        content()
    }
}

/** 项目符号项 */
@Composable
private fun BulletItem(content: @Composable () -> Unit) {
    Row(verticalAlignment = Alignment.Top, modifier = Modifier.padding(bottom = 14.dp)) {
        Box(
            modifier = Modifier
                .padding(top = 9.dp)
                .size(6.dp)
                .background(Text3, CircleShape),
        )
        Spacer(Modifier.width(12.dp))
        Column { content() }
    }
}
