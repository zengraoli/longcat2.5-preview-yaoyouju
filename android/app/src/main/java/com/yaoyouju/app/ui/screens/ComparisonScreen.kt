package com.yaoyouju.app.ui.screens

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
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.api.Analysis
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.Episode
import com.yaoyouju.app.data.api.StructuredReport
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.SecondaryButton
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
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
import kotlinx.coroutines.launch

/** A08 原文对照：解释 ↔ 报告原文分段高亮 + 术语表 + 未提及红线提示。 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComparisonScreen(
    onBack: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var episode by remember { mutableStateOf<Episode?>(null) }
    var analysis by remember { mutableStateOf<Analysis?>(null) }
    var report by remember { mutableStateOf<StructuredReport?>(null) }

    LaunchedEffect(Unit) {
        scope.launch {
            runCatching { ApiClient.api.getEpisodes().unwrap() }.onSuccess { episodes ->
                val episodeId = episodes.firstOrNull()?.id ?: return@onSuccess
                runCatching { ApiClient.api.getReportsByEpisode(episodeId).unwrap() }
                    .onSuccess { reports ->
                        val firstReportId = reports.firstOrNull()?.get("id") ?: return@onSuccess
                        runCatching { ApiClient.api.getStructuredReport(firstReportId).unwrap() }
                            .onSuccess { report = it }
                    }
                runCatching { ApiClient.api.getLatestAnalysis(episodeId).unwrap() }
                    .onSuccess { analysis = it }
            }
        }
    }

    val explanations = analysis?.sections?.explanation.orEmpty()
    // App 端取第二条解释（无则第一条），“对应原文”行号随解释序号
    val expIndex = if (explanations.size > 1) 1 else 0
    val currentExp = explanations.getOrNull(expIndex)
    val lineNo = expIndex + 1

    val reportDate = report?.reportDate.orEmpty()
    val examType = report?.eventType?.takeIf { it != "报告" } ?: "MRI"

    // 报告原文按句切分：含“右侧”→侧别不一致；含提取术语→本条解释引用
    data class RawSegment(val text: String, val type: String)

    val rawSegments = remember(report) {
        val text = report?.rawText.orEmpty()
        if (text.isEmpty()) {
            emptyList()
        } else {
            val terms = report?.extractedTerms?.map { it.term }?.filter { it.length >= 2 }.orEmpty()
            Regex("(?<=[。；\n])").split(text).filter { it.isNotEmpty() }.map { sentence ->
                when {
                    sentence.contains("右侧") -> RawSegment(sentence, "conflict")
                    terms.any { sentence.contains(it) } -> RawSegment(sentence, "cited")
                    else -> RawSegment(sentence, "normal")
                }
            }
        }
    }
    val annotatedRaw = remember(rawSegments) {
        buildAnnotatedString {
            rawSegments.forEach { seg ->
                if (seg.type == "normal") {
                    append(seg.text)
                } else {
                    val bg = if (seg.type == "cited") Primary.copy(alpha = 0.15f) else Warn.copy(alpha = 0.18f)
                    withStyle(SpanStyle(background = bg)) { append(seg.text) }
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("原文对照", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = Text1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
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
                .padding(horizontal = Dimens.pagePadding)
                .padding(bottom = 32.dp),
        ) {
            // 分段选项卡
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Surface, RoundedCornerShape(10.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                SegmentTab(text = "按解释查看", selected = true, modifier = Modifier.weight(1f))
                SegmentTab(text = "按术语查看", selected = false, modifier = Modifier.weight(1f))
            }
            Spacer(Modifier.height(Dimens.gapL))

            // 解释卡
            if (currentExp != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(PrimaryLight, RoundedCornerShape(Dimens.cardRadius))
                        .padding(Dimens.cardPadding),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("解释 ②-$lineNo", color = Primary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                        Spacer(Modifier.width(8.dp))
                        Text("对应原文：第 $lineNo 行", color = Text3, fontSize = 12.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("“${currentExp.text}”", color = Primary, fontSize = 14.sp, lineHeight = 22.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(currentExp.text, color = Text1, fontSize = 14.sp, lineHeight = 24.sp)
                }
                Spacer(Modifier.height(Dimens.gapL))
            }

            // 报告原文卡
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Surface, RoundedCornerShape(Dimens.cardRadius))
                    .padding(Dimens.cardPadding),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Description, contentDescription = null, tint = Text2, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "报告原文 · $reportDate · $examType",
                        color = Text1,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.weight(1f),
                    )
                    StatusTag("未修改", TagType.MUTED)
                }
                Spacer(Modifier.height(14.dp))
                if (rawSegments.isNotEmpty()) {
                    Text(annotatedRaw, color = Text1, fontSize = 14.sp, lineHeight = 26.sp)
                    Spacer(Modifier.height(16.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Border))
                    Spacer(Modifier.height(14.dp))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                    LegendItem(dotColor = Primary, text = "本条解释引用")
                    LegendItem(dotColor = Warn, text = "与你描述侧别不一致，需确认")
                }
            }
            Spacer(Modifier.height(Dimens.gapL))

            // 术语卡
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Surface, RoundedCornerShape(Dimens.cardRadius))
                    .padding(Dimens.cardPadding),
            ) {
                Text("本段涉及的术语", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
                Spacer(Modifier.height(12.dp))
                report?.extractedTerms?.take(6)?.forEach { term ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.Top,
                    ) {
                        Text(
                            term.term,
                            color = Primary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.width(90.dp),
                        )
                        Spacer(Modifier.width(12.dp))
                        Text("报告中的表述 · ${term.position}", color = Text3, fontSize = 12.sp, lineHeight = 18.sp)
                    }
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Border))
                }
            }
            Spacer(Modifier.height(Dimens.gapL))

            AlertBar(
                text = "报告中没有描述的内容（例如是否存在神经根水肿）不会被写成“已排除”，而会标为“报告未提及”。",
                type = AlertType.WARN,
            )
            Spacer(Modifier.height(24.dp))

            SecondaryButton(text = "返回一页分析", onClick = onBack)
        }
    }
}

@Composable
private fun SegmentTab(text: String, selected: Boolean, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .height(40.dp)
            .background(
                color = if (selected) Surface else Color.Transparent,
                shape = RoundedCornerShape(8.dp),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text,
            color = if (selected) Text1 else Text2,
            fontSize = 14.sp,
            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
        )
    }
}

@Composable
private fun LegendItem(dotColor: Color, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(8.dp).background(dotColor, CircleShape))
        Spacer(Modifier.width(6.dp))
        Text(text, color = Text2, fontSize = 12.sp)
    }
}
