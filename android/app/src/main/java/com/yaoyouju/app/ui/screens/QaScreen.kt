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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.BottomNavBar
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
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
import kotlinx.coroutines.launch

private data class ChatMsg(
    val role: String, // "user" | "assistant"
    val content: String,
    val source: String? = null,
    val outOfScope: Boolean = false,
    val shortQuestion: String? = null,
    val added: Boolean = false,
)

private val QUICK_QUESTIONS = listOf("复诊时该怎么描述？", "哪些变化要提前就医？", "保守治疗一般多久？")

/** A09 问与解释：对话式问答，数据来自 /qa/ask，超出范围的问题引导加入复诊清单。 */
@Composable
fun QaScreen(
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var episodeId by remember { mutableStateOf("") }
    var analysisDate by remember { mutableStateOf("") }
    var reportDate by remember { mutableStateOf("") }
    var messages by remember { mutableStateOf(listOf<ChatMsg>()) }
    var question by remember { mutableStateOf("") }
    var explainedCount by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        scope.launch {
            runCatching { ApiClient.api.getEpisodes().unwrap() }.onSuccess { episodes ->
                episodeId = episodes.firstOrNull()?.id.orEmpty()
                val eid = episodeId
                if (eid.isEmpty()) return@onSuccess
                runCatching { ApiClient.api.getLatestAnalysis(eid).unwrap() }
                    .onSuccess { analysisDate = it.createdAt.take(10) }
                runCatching { ApiClient.api.getReportsByEpisode(eid).unwrap() }
                    .onSuccess { reports ->
                        val firstReportId = reports.firstOrNull()?.get("id") ?: return@onSuccess
                        runCatching { ApiClient.api.getStructuredReport(firstReportId).unwrap() }
                            .onSuccess { reportDate = it.reportDate }
                    }
            }
        }
    }

    val contextBasis = when {
        analysisDate.isNotEmpty() && reportDate.isNotEmpty() -> "$analysisDate 当前情况 + $reportDate 报告"
        analysisDate.isNotEmpty() -> "$analysisDate 当前情况 + 最近报告"
        else -> "当前情况 + 最近一次检查报告"
    }

    fun askQuestion(q: String) {
        val text = q.trim()
        if (text.isEmpty()) return
        question = ""
        messages = messages + ChatMsg(role = "user", content = text)
        scope.launch {
            runCatching {
                ApiClient.api.askQuestion(mapOf("question" to text, "episodeId" to episodeId)).unwrap()
            }.onSuccess { res ->
                if (res.outOfScope) {
                    messages = messages + ChatMsg(
                        role = "assistant",
                        content = res.message ?: "该问题涉及诊断、手术或用药建议，超出服务范围。建议您将此问题加入复诊清单，咨询医生。",
                        outOfScope = true,
                        shortQuestion = if (text.length > 12) text.take(12) + "…" else text,
                    )
                } else {
                    messages = messages + ChatMsg(
                        role = "assistant",
                        content = res.answer ?: "",
                        source = res.source,
                    )
                    explainedCount += 1
                    if (res.isReassurance) explainedCount = maxOf(explainedCount, 2)
                }
            }.onFailure { e ->
                messages = messages + ChatMsg(role = "assistant", content = e.message ?: "回答失败，请稍后重试。")
            }
        }
    }

    fun addFollowup(index: Int) {
        val m = messages.getOrNull(index) ?: return
        if (m.shortQuestion != null && !m.added) {
            messages = messages.mapIndexed { i, msg -> if (i == index) msg.copy(added = true) else msg }
            Toast.makeText(context, "已加入复诊问题清单", Toast.LENGTH_SHORT).show()
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(Bg)) {
        // 头部
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("问与解释", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { Toast.makeText(context, "历史记录（演示）", Toast.LENGTH_SHORT).show() }) {
                Icon(Icons.Filled.History, contentDescription = "历史记录", tint = Text2)
            }
        }

        // 上下文提示
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Shield, contentDescription = null, tint = Primary, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(10.dp))
                Text(
                    "本轮基于：$contextBasis。出现新变化请先更新“当前情况”。",
                    color = Text2,
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                )
            }
        }
        Spacer(Modifier.height(Dimens.gapL))

        // 消息流
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            itemsIndexed(messages) { index, m ->
                if (m.role == "user") {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        Text(
                            m.content,
                            color = Color.White,
                            fontSize = 14.sp,
                            lineHeight = 22.sp,
                            modifier = Modifier
                                .background(Primary, RoundedCornerShape(12.dp, 12.dp, 4.dp, 12.dp))
                                .padding(12.dp),
                        )
                    }
                } else {
                    Row(verticalAlignment = Alignment.Top) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .background(PrimaryLight, CircleShape),
                            contentAlignment = Alignment.Center,
                        ) { Text("腰", color = Primary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
                        Spacer(Modifier.width(8.dp))
                        Column(
                            modifier = Modifier
                                .background(Surface, RoundedCornerShape(12.dp, 12.dp, 12.dp, 4.dp))
                                .padding(12.dp),
                        ) {
                            Text(m.content, color = Text1, fontSize = 14.sp, lineHeight = 24.sp)
                            if (!m.source.isNullOrEmpty()) {
                                Spacer(Modifier.height(10.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    StatusTag("来源：${m.source}", TagType.OK)
                                    StatusTag("报告原文", TagType.INFO)
                                }
                            }
                            if (m.outOfScope && !m.shortQuestion.isNullOrEmpty()) {
                                Spacer(Modifier.height(10.dp))
                                Text(
                                    if (m.added) "＋ 已加入复诊问题清单：${m.shortQuestion}"
                                    else "＋ 把“${m.shortQuestion}”加入复诊问题",
                                    color = Primary,
                                    fontSize = 13.sp,
                                    modifier = if (m.added) Modifier else Modifier.clickable { addFollowup(index) },
                                )
                            }
                        }
                    }
                }
            }
            item {
                // 快捷问题（设计稿位于消息流与稳定性提示之间）
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    QUICK_QUESTIONS.forEach { q ->
                        QuickQuestionChip(text = q, onClick = { askQuestion(q) })
                    }
                }
            }
            if (explainedCount >= 2) {
                item {
                    AlertBar(
                        text = "本轮已解释 ${explainedCount} 个问题，行动计划已记录。若没有新信息，反复确认不会得到不同答案；出现新变化时我会重新评估。",
                        type = AlertType.WARN,
                    )
                }
            }
        }

        // 输入区
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(horizontal = Dimens.pagePadding, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedTextField(
                value = question,
                onValueChange = { question = it },
                placeholder = { Text("输入你的问题…", color = Text3, fontSize = 14.sp) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = { askQuestion(question) }),
                shape = RoundedCornerShape(20.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = Bg,
                    focusedContainerColor = Bg,
                    unfocusedBorderColor = Color.Transparent,
                    focusedBorderColor = Primary,
                ),
                modifier = Modifier.weight(1f),
            )
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(if (question.trim().isEmpty()) Border else Primary, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                IconButton(onClick = { askQuestion(question) }, modifier = Modifier.size(40.dp)) {
                    Icon(
                        Icons.Filled.Send,
                        contentDescription = "发送",
                        tint = if (question.trim().isEmpty()) Text3 else Color.White,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }
        }
        BottomNavBar(currentRoute = "A09", onTabSelected = onNavigate)
    }
}

@Composable
private fun QuickQuestionChip(text: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .height(36.dp)
            .background(Surface, RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = Primary, fontSize = 13.sp)
    }
}
