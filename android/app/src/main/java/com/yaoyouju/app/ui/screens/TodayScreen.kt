package com.yaoyouju.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val SLEEP_OPTIONS = listOf(
    0 to "没影响",
    1 to "偶尔醒",
    2 to "常醒",
    3 to "几乎没睡",
)

private val ACTIVITY_OPTIONS = listOf("步行", "热敷", "按医嘱用药", "休息", "康复练习", "工作/久坐", "其他")

/** A11 记录今天：7 组日常问题（可跳过），提交为症状记录 + 症状日志。 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun TodayScreen(
    onBack: () -> Unit,
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val today = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) }

    var sitLabel by remember { mutableStateOf("") }
    var sitSkipped by remember { mutableStateOf(false) }
    var activityDone by remember { mutableStateOf("") }
    var activitySkipped by remember { mutableStateOf(false) }
    var sleepImpact by remember { mutableStateOf<Int?>(null) }
    var compareToYesterday by remember { mutableStateOf("") }
    var compareSkipped by remember { mutableStateOf(false) }
    var legChange by remember { mutableStateOf("") }
    var activities by remember { mutableStateOf(listOf<String>()) }
    var topWorry by remember { mutableStateOf("") }

    fun selectSit(label: String) {
        sitLabel = if (sitLabel == label) "" else label
        sitSkipped = false
    }

    fun submit(updateCurrent: Boolean) {
        scope.launch {
            val episodes = runCatching { ApiClient.api.getEpisodes().unwrap() }.getOrNull()
            val episodeId = episodes?.firstOrNull()?.id
            if (episodeId == null) {
                Toast.makeText(context, "请先创建病程", Toast.LENGTH_SHORT).show()
                return@launch
            }
            val sitMinutes = if (sitSkipped) null else mapOf(
                "<15分钟" to 10, "15-30" to 22, "30-60" to 45, ">60分钟" to 75,
            )[sitLabel]
            val rawText = "日常记录：坐姿${if (sitSkipped) "跳过" else sitLabel.ifEmpty { "尚未确认" }}；" +
                "活动${if (activitySkipped) "跳过" else activityDone.ifEmpty { "部分" }}；" +
                "睡眠影响${sleepImpact ?: "尚未确认"}；" +
                "相比昨天${if (compareSkipped) "跳过" else compareToYesterday.ifEmpty { "尚未确认" }}；" +
                "腿部${legChange.ifEmpty { "尚未确认" }}；" +
                "做了：${activities.joinToString("、").ifEmpty { "未记录" }}；" +
                "担心：${topWorry.ifEmpty { "未记录" }}"
            val eventId = runCatching {
                ApiClient.api.createCareEvent(
                    mapOf(
                        "episodeId" to episodeId,
                        "eventType" to "症状",
                        "occurredAt" to SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(Date()),
                        "sourceType" to "自述",
                        "rawText" to rawText,
                        "verifyStatus" to "尚未确认",
                    ),
                ).unwrap()["id"]
            }.getOrNull()
            if (eventId == null) {
                Toast.makeText(context, "保存失败，请稍后重试", Toast.LENGTH_SHORT).show()
                return@launch
            }
            runCatching {
                ApiClient.api.createSymptomLog(
                    mapOf(
                        "careEventId" to eventId,
                        "sitMinutes" to sitMinutes,
                        "plannedActivityDone" to if (activitySkipped) "" else activityDone.ifEmpty { "部分" },
                        "sleepImpact" to sleepImpact,
                        "topWorry" to topWorry,
                        "legChange" to legChange.ifEmpty { "尚未确认" },
                    ),
                ).unwrap()
            }.onFailure {
                Toast.makeText(context, "保存失败，请稍后重试", Toast.LENGTH_SHORT).show()
                return@launch
            }
            Toast.makeText(context, "已保存", Toast.LENGTH_SHORT).show()
            delay(800)
            if (updateCurrent) onNavigate("A02") else onBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("记录今天", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = Text1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    Text(
                        "约 1 分钟",
                        color = Text3,
                        fontSize = 12.sp,
                        modifier = Modifier
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
                .verticalScroll(rememberScrollState())
                .padding(bottom = 32.dp),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Dimens.pagePadding),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Filled.AccessTime, contentDescription = null, tint = Text3, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    "$today · 每个问题都可以跳过，跳过会记为“尚未确认”",
                    color = Text3,
                    fontSize = 12.sp,
                )
            }

            // 今天能坐多久？
            QuestionCard(title = "今天能坐多久？") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf("<15分钟", "15-30", "30-60", ">60分钟").forEach { opt ->
                        AnswerChip(text = opt, selected = sitLabel == opt, onClick = { selectSit(opt) })
                    }
                    SkipChip(selected = sitSkipped, onClick = { sitSkipped = !sitSkipped })
                }
            }

            // 能否完成原本计划的活动？
            QuestionCard(title = "能否完成原本计划的活动？") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf("能", "部分", "不能").forEach { opt ->
                        AnswerChip(
                            text = opt,
                            selected = activityDone == opt,
                            onClick = {
                                activityDone = if (activityDone == opt) "" else opt
                                activitySkipped = false
                            },
                        )
                    }
                    SkipChip(selected = activitySkipped, onClick = { activitySkipped = !activitySkipped })
                }
            }

            // 睡眠受影响程度
            QuestionCard(title = "睡眠受影响程度") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SLEEP_OPTIONS.forEach { (value, label) ->
                        SleepOptionChip(
                            value = value,
                            label = label,
                            selected = sleepImpact == value,
                            onClick = { sleepImpact = value },
                        )
                    }
                }
            }

            // 与昨天相比
            QuestionCard(title = "与昨天相比") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf("加重", "差不多", "减轻").forEach { opt ->
                        AnswerChip(
                            text = opt,
                            selected = compareToYesterday == opt,
                            onClick = {
                                compareToYesterday = if (compareToYesterday == opt) "" else opt
                                compareSkipped = false
                            },
                        )
                    }
                    SkipChip(selected = compareSkipped, onClick = { compareSkipped = !compareSkipped })
                }
            }

            // 今天有腿部麻木或无力吗？
            QuestionCard(title = "今天有腿部麻木或无力吗？", note = "不会沿用昨天的答案——如果你今天不确定，请选“尚未确认”。") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf("有", "没有", "尚未确认").forEach { opt ->
                        AnswerChip(
                            text = opt,
                            selected = legChange == opt,
                            onClick = { legChange = if (legChange == opt) "" else opt },
                        )
                    }
                }
            }

            // 今天做了什么？（可多选）
            QuestionCard(title = "今天做了什么？（可多选）") {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    ACTIVITY_OPTIONS.forEach { opt ->
                        AnswerChip(
                            text = opt,
                            selected = activities.contains(opt),
                            onClick = {
                                activities = if (activities.contains(opt)) activities - opt else activities + opt
                            },
                        )
                    }
                }
            }

            // 今天最担心什么？
            QuestionCard(title = "今天最担心什么？") {
                OutlinedTextField(
                    value = topWorry,
                    onValueChange = { topWorry = it },
                    placeholder = { Text("例如：会不会越来越严重 / 要不要换医院…", color = Text3, fontSize = 14.sp) },
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = Bg,
                        focusedContainerColor = Bg,
                        unfocusedBorderColor = Color.Transparent,
                        focusedBorderColor = Primary,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Spacer(Modifier.height(Dimens.gapL))
            AlertBar(
                text = "记录只用于整理你的病程和复诊摘要；变化图不会把某一次疼痛上升解读为影像恶化。",
                type = AlertType.INFO,
                modifier = Modifier.padding(horizontal = Dimens.pagePadding),
            )
            Spacer(Modifier.height(24.dp))

            PrimaryButton(
                text = "保存记录",
                modifier = Modifier.padding(horizontal = Dimens.pagePadding),
                onClick = { submit(updateCurrent = false) },
            )
            Spacer(Modifier.height(16.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { submit(updateCurrent = true) }
                    .padding(12.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text("保存并更新“当前情况”（症状有新变化时）", color = Primary, fontSize = 14.sp)
            }
        }
    }
}

@Composable
private fun QuestionCard(title: String, note: String? = null, content: @Composable () -> Unit) {
    YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding, vertical = 8.dp)) {
        Text(title, fontWeight = FontWeight.Medium, fontSize = 15.sp, color = Text1)
        if (note != null) {
            Spacer(Modifier.height(4.dp))
            Text(note, color = Text3, fontSize = 12.sp, lineHeight = 18.sp)
        }
        Spacer(Modifier.height(14.dp))
        content()
    }
}

@Composable
private fun AnswerChip(text: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .height(36.dp)
            .background(if (selected) Primary else Bg, RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = if (selected) Color.White else Text2, fontSize = 14.sp)
    }
}

@Composable
private fun SkipChip(selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .height(36.dp)
            .background(if (selected) Primary else Color.Transparent, RoundedCornerShape(18.dp))
            .border(1.dp, if (selected) Primary else Text3, RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text("跳过", color = if (selected) Color.White else Text3, fontSize = 14.sp)
    }
}

@Composable
private fun SleepOptionChip(value: Int, label: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .height(44.dp)
            .background(if (selected) Primary else Bg, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("$value", color = if (selected) Color.White else Text1, fontSize = 15.sp, fontWeight = FontWeight.Medium)
            Text(label, color = if (selected) Color.White.copy(alpha = 0.85f) else Text3, fontSize = 10.sp)
        }
    }
}
