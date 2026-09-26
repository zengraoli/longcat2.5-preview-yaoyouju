package com.yaoyouju.app.ui.screens

import android.widget.Toast
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Warning
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.api.Analysis
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.CareEvent
import com.yaoyouju.app.data.api.StructuredReport
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.ErrorTint
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Warn
import com.yaoyouju.app.ui.theme.WarnTint
import kotlinx.coroutines.launch

/** A06 核对整理后的信息（第 4 / 4 步）：术语核对、侧别冲突确认、症状与医嘱核对。 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VerifyScreen(
    onBack: () -> Unit,
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var report by remember { mutableStateOf<StructuredReport?>(null) }
    var changeRaw by remember { mutableStateOf<String?>(null) }
    var confusionTitle by remember { mutableStateOf("") }
    var doctorAdvice by remember { mutableStateOf("") }
    var unknown by remember { mutableStateOf<List<String>>(emptyList()) }
    var resolved by remember { mutableStateOf(false) }
    var generating by remember { mutableStateOf(false) }

    suspend fun load() {
        runCatching { ApiClient.api.getEpisodes().unwrap() }.onSuccess { episodes ->
            val episodeId = episodes.firstOrNull()?.id ?: return@onSuccess
            runCatching { ApiClient.api.getReportsByEpisode(episodeId).unwrap() }
                .onSuccess { reports ->
                    val firstReportId = reports.firstOrNull()?.get("id") ?: return@onSuccess
                    runCatching { ApiClient.api.getStructuredReport(firstReportId).unwrap() }
                        .onSuccess { report = it }
                }
            runCatching { ApiClient.api.getTimeline(episodeId).unwrap() }
                .onSuccess { events ->
                    events.firstOrNull { it.eventType == "主要困惑" }?.rawText?.let { raw ->
                        Regex("主要困惑：([^；]*)").find(raw)?.groupValues?.get(1)?.trim()
                            ?.takeIf { it.isNotEmpty() }?.let { confusionTitle = it }
                    }
                    changeRaw = events.firstOrNull { it.eventType == "变化确认" }?.rawText
                    doctorAdvice = events.firstOrNull { it.eventType == "医嘱" }?.rawText.orEmpty()
                }
            runCatching { ApiClient.api.getLatestAnalysis(episodeId).unwrap() }
                .onSuccess { unknown = it.sections.unknown }
        }
    }

    LaunchedEffect(Unit) { scope.launch { load() } }

    val change = remember(changeRaw) { parseChangeText(changeRaw) }
    val parsed = parseChangeText(changeRaw)
    val cleanTerms = remember(report) {
        val seen = mutableSetOf<String>()
        (report?.extractedTerms.orEmpty())
            .filter { it.term.isNotEmpty() && (it.term.length >= 2 || it.term.contains("/")) }
            .filter { seen.add(it.term) }
            .take(8)
    }
    val symptomRows = remember(parsed, confusionTitle, unknown) {
        listOf(
            "症状开始" to (parsed.onset.ifEmpty { "尚未确认" }),
            "最近变化" to (parsed.change.ifEmpty { "尚未确认" }),
            "腿部无力" to if (unknown.any { it.contains("腿部无力") }) "尚未回答" else "尚未确认",
            "大小便/鞍区" to bowelStatus(parsed),
            "主要困惑" to (confusionTitle.ifEmpty { "尚未确认" }),
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("核对整理后的信息", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = Text1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    Text(
                        "第 4 / 4 步",
                        color = Text3,
                        fontSize = 12.sp,
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .background(Bg, RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                    )
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
                .padding(bottom = 32.dp),
        ) {
            AlertBar(
                text = "请核对系统整理的信息。缺失项显示为“尚未确认”，冲突项需要你确认后才会进入分析。",
                type = AlertType.INFO,
                modifier = Modifier.padding(horizontal = Dimens.pagePadding, vertical = 8.dp),
            )

            // 报告信息
            YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "报告信息 · ${report?.reportDate.orEmpty()}",
                        fontWeight = FontWeight.Medium,
                        fontSize = 16.sp,
                        color = Text1,
                        modifier = Modifier.weight(1f),
                    )
                    StatusTag("来源：报告原文", TagType.INFO)
                    Spacer(Modifier.width(8.dp))
                    IconButton(onClick = { onNavigate("A05") }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Outlined.Edit, contentDescription = "修改", tint = Text2, modifier = Modifier.size(18.dp))
                    }
                }
                Spacer(Modifier.height(10.dp))
                if (cleanTerms.isEmpty()) {
                    Text("暂无提取到的关键术语", color = Text3, fontSize = 13.sp)
                }
                cleanTerms.forEachIndexed { i, t ->
                    Row(modifier = Modifier.padding(vertical = 8.dp), verticalAlignment = Alignment.Top) {
                        Text(t.term.ifEmpty { "关键术语" }, color = Text3, fontSize = 12.sp, modifier = Modifier.width(56.dp))
                        Text(t.term, color = Text1, fontSize = 14.sp, modifier = Modifier.weight(1f))
                        StatusTag("原文${t.position.ifEmpty { "第${i + 1}行" }}", TagType.MUTED)
                    }
                }
            }
            Spacer(Modifier.height(14.dp))

            // 侧别冲突
            if (report?.hasConflict == true && !resolved) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = Dimens.pagePadding)
                        .background(ErrorTint, RoundedCornerShape(Dimens.cardRadius))
                        .padding(Dimens.cardPadding),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Warning, contentDescription = null, tint = Warn, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("侧别冲突：报告为“右侧”，你的描述为“左侧”", color = Warn, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    }
                    Spacer(Modifier.height(14.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        listOf("我的症状在左侧", "都有 / 不确定").forEach { opt ->
                            androidx.compose.material3.OutlinedButton(
                                onClick = {
                                    val r = report ?: return@OutlinedButton
                                    scope.launch {
                                        runCatching {
                                            ApiClient.api.verifyReport(
                                                r.reportId,
                                                mapOf(
                                                    "verifyStatus" to "已确认",
                                                    "extractedTerms" to r.extractedTerms.map { mapOf("term" to it.term, "position" to it.position) },
                                                ),
                                            ).unwrap()
                                        }.onSuccess {
                                            resolved = true
                                            Toast.makeText(context, "已确认：$opt", Toast.LENGTH_SHORT).show()
                                        }.onFailure {
                                            Toast.makeText(context, it.message ?: "确认失败", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(20.dp),
                            ) { Text(opt, fontSize = 13.sp, color = Text1) }
                        }
                    }
                }
                Spacer(Modifier.height(14.dp))
            }

            // 症状与变化
            YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("症状与变化", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1, modifier = Modifier.weight(1f))
                    StatusTag("来源：自述", TagType.WARN)
                    Spacer(Modifier.width(8.dp))
                    IconButton(onClick = { onNavigate("A02") }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Outlined.Edit, contentDescription = "修改", tint = Text2, modifier = Modifier.size(18.dp))
                    }
                }
                Spacer(Modifier.height(8.dp))
                symptomRows.forEach { (label, value) ->
                    Row(modifier = Modifier.padding(vertical = 7.dp), verticalAlignment = Alignment.Top) {
                        Text(label, color = Text3, fontSize = 12.sp, modifier = Modifier.width(72.dp))
                        Text(value, color = Text1, fontSize = 14.sp, modifier = Modifier.weight(1f))
                        StatusTag(
                            if (value == "尚未确认" || value == "尚未回答") "尚未确认" else "已确认",
                            if (value == "尚未确认" || value == "尚未回答") TagType.WARN else TagType.OK,
                        )
                    }
                }
            }
            Spacer(Modifier.height(14.dp))

            // 既有医嘱
            YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("既有医嘱", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1, modifier = Modifier.weight(1f))
                    StatusTag("来源：自述", TagType.WARN)
                    Spacer(Modifier.width(8.dp))
                    IconButton(onClick = { onNavigate("A05") }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Outlined.Edit, contentDescription = "修改", tint = Text2, modifier = Modifier.size(18.dp))
                    }
                }
                Spacer(Modifier.height(10.dp))
                if (doctorAdvice.isNotEmpty()) {
                    Text("医生建议", color = Text3, fontSize = 12.sp)
                    Spacer(Modifier.height(2.dp))
                    Text(doctorAdvice, color = Text1, fontSize = 14.sp)
                    Spacer(Modifier.height(8.dp))
                    StatusTag("未经核实", TagType.WARN)
                } else {
                    Text("尚未录入医嘱", color = Text3, fontSize = 13.sp)
                }
            }
            Spacer(Modifier.height(Dimens.gapL))

            AlertBar(
                text = "“尚未确认”不会被当作“没有”；旧记录中的“当时没有”也不会被当作“现在没有”。",
                type = AlertType.WARN,
                modifier = Modifier.padding(horizontal = Dimens.pagePadding),
            )
            Spacer(Modifier.height(24.dp))

            PrimaryButton(
                text = if (generating) "正在生成…" else "确认无误，生成一页分析",
                enabled = !generating,
                modifier = Modifier.padding(horizontal = Dimens.pagePadding),
                onClick = {
                    generating = true
                    scope.launch {
                        val episodes = runCatching { ApiClient.api.getEpisodes().unwrap() }.getOrNull()
                        val episodeId = episodes?.firstOrNull()?.id
                        if (episodeId == null) {
                            Toast.makeText(context, "请先创建病程", Toast.LENGTH_SHORT).show()
                            generating = false
                            return@launch
                        }
                        val r = report
                        runCatching {
                            ApiClient.api.createAnalysis(
                                mapOf("episodeId" to episodeId, "reportId" to (r?.reportId ?: "")),
                            ).unwrap()
                        }.onSuccess { res ->
                            val safety = res["safetyMessage"]
                            if (!safety.isNullOrEmpty()) onNavigate("A03") else onNavigate("A07")
                        }.onFailure {
                            Toast.makeText(context, it.message ?: "生成失败", Toast.LENGTH_SHORT).show()
                        }
                        generating = false
                    }
                },
            )
            Spacer(Modifier.height(16.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigate("A02") }
                    .padding(12.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text("返回修改", color = Primary, fontSize = 14.sp)
            }
        }
    }
}
