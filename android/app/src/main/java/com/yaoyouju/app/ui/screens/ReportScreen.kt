package com.yaoyouju.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.SelectField
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.PrimaryLight
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import kotlinx.coroutines.launch

private val tabs = listOf("粘贴文字（推荐）", "拍照提取", "暂不录入")
private val typeOptions = listOf("MRI", "CT", "X光", "超声", "其他")
private val adviceOptions = listOf("保守治疗", "复查时间", "用药", "康复建议", "手术评估")

/**
 * A05 录入报告与医嘱（可选）：粘贴文字（推荐）/ 拍照提取（演示为模拟）/ 暂不录入。
 * 数据来自接口提交；演示文本仅作为输入占位，提交后由 server 提取术语。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportScreen(
    onNavigate: (String) -> Unit,
) {
    val scope = rememberCoroutineScope()

    var tab by remember { mutableIntStateOf(0) }
    var rawText by remember { mutableStateOf("腰椎MRI平扫：L4/5椎间盘轻度膨出；L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能（示例文本，仅用于演示）") }
    var reportDate by remember { mutableStateOf("2026-08-30") }
    var typeIndex by remember { mutableIntStateOf(0) }
    var hospital by remember { mutableStateOf("") }
    var doctorAdvice by remember { mutableStateOf("") }
    var adviceChip by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    fun resolveEpisodeId(onReady: (String) -> Unit) {
        scope.launch {
            runCatching { ApiClient.api.getEpisodes().unwrap() }
                .onSuccess { list ->
                    val id = list.firstOrNull()?.id ?: run {
                        ApiClient.api.createEpisode(mapOf("title" to "本次发作")).unwrap()["id"] ?: ""
                    }
                    onReady(id)
                }
                .onFailure { error = it.message ?: "暂无病程，请先创建" }
        }
    }

    fun submit() {
        error = null
        if (tab == 0) {
            if (rawText.isBlank() || reportDate.isBlank()) {
                error = "请填写报告原文与报告日期"
                return
            }
            loading = true
            resolveEpisodeId { episodeId ->
                scope.launch {
                    val report = ApiClient.api.createReport(mapOf(
                        "careEventId" to eventIdForReport(episodeId),
                        "reportDate" to reportDate,
                        "rawText" to rawText,
                        "sourceType" to "报告原文",
                    )).unwrap()
                    loading = false
                    onNavigate("A06")
                }
            }
        } else {
            loading = false
            onNavigate("A06")
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("录入报告与医嘱（可选）", fontSize = 17.sp, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = { onNavigate("A04") }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    Text(
                        "第 3 / 4 步",
                        color = Text3,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(end = 16.dp),
                    )
                },
            )
        },
        containerColor = Surface,
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(androidx.compose.foundation.rememberScrollState())
                .padding(horizontal = 16.dp),
        ) {
            // Tab bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF4F6F8), RoundedCornerShape(16.dp))
                    .padding(6.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                tabs.forEachIndexed { i, label ->
                    val active = tab == i
                    Text(
                        label,
                        color = if (androidx.compose.ui.graphics.Color(0xFF0F6E74) != Text1) Primary else Text2,
                        fontSize = 14.sp,
                        fontWeight = if (active) FontWeight.Medium else FontWeight.Normal,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (active) Surface else Color.Transparent)
                            .clickable { tab = i }
                            .padding(vertical = 10.dp),
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            if (tab != 2) {
                // 报告原文
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Surface),
                    border = BorderStroke(1.dp, Border),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("检查报告原文", fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Text1)
                            Spacer(Modifier.width(8.dp))
                            Text("来源：报告原文", fontSize = 12.sp, color = Info)
                        }
                        Spacer(Modifier.height(16.dp))
                        OutlinedTextField(
                            value = rawText,
                            onValueChange = { rawText = it },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 6,
                            shape = RoundedCornerShape(10.dp),
                        )
                        Spacer(Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("报告日期", color = Text2, fontSize = 13.sp)
                                DateField(
                                    value = reportDate,
                                    placeholder = "选择日期",
                                    onValueChange = { reportDate = it },
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text("检查类型", color = Text2, fontSize = 13.sp)
                                SelectField(
                                    value = typeOptions[typeIndex],
                                    onClick = { /* 演示环境固定 MRI */ },
                                )
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                        Column {
                            Text("检查机构（可选）", color = Text2, fontSize = 13.sp)
                            OutlinedTextField(
                                value = hospital,
                                onValueChange = { hospital = it },
                                placeholder = { Text("如：XX市人民医院") },
                                singleLine = true,
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth(),
                            )
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // 医嘱
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Surface),
                    border = BorderStroke(1.dp, Border),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("医生已经给出的建议（可选）", fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Text1)
                            Spacer(Modifier.width(8.dp))
                            Text("来源：自述", fontSize = 12.sp, color = Warn)
                        }
                        Spacer(Modifier.height(16.dp))
                        OutlinedTextField(
                            value = doctorAdvice,
                            onValueChange = { doctorAdvice = it },
                            placeholder = { Text("如：医生建议先保守治疗，4周后复查；避免久坐和弯腰负重") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 4,
                            shape = RoundedCornerShape(10.dp),
                        )
                        Spacer(Modifier.height(16.dp))
                        // chips
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            adviceOptions.forEach { opt ->
                                val active = adviceChipSelected == opt
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    androidx.compose.material3.Checkbox(
                                        checked = active,
                                        onCheckedChange = { adviceChipSelected = if (it) opt else "" },
                                    )
                                    Text(opt, fontSize = 13.sp, color = Text1)
                                }
                            }
                        }
                    }
                }
            } else {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Surface),
                    border = BorderStroke(1.dp, Border),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("暂不录入报告", fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Text1)
                        Text("你可以先核对已有的信息，之后随时在“病程”中补充。", fontSize = 13.sp, color = Text3, modifier = Modifier.padding(top = 8.dp))
                    }
                }
            }

            Spacer(Modifier.height(24.dp))
            AlertBar(
                text = "原文仅用于对照解释，每个关键解释都可回看原文。本产品不做影像读片诊断，也不会把报告中未描述的内容写成“已排除”。",
                type = AlertType.INFO,
            )
            Spacer(Modifier.height(24.dp))
            PrimaryButton(text = if (tab == 0) "下一步：核对信息" else "完成并核对", onClick = { submit() })
            TextButton(onClick = { onNavigate("A06") }) {
                Text("跳过，先不录入报告", color = Primary, fontSize = 14.sp)
            }
            Spacer(Modifier.height(24.dp))
    }
}
