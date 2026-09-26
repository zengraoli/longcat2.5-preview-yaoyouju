package com.yaoyouju.app.ui.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.PrimaryLight
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3

private val confusionOptions = listOf(
    "报告术语" to "看懂报告里写的是什么、哪些结论不能得出",
    "病程变化" to "这段时间的变化意味着什么、哪些值得记录",
    "复诊准备" to "复诊时该问什么、带什么、怎么描述",
    "生活影响" to "日常活动、工作与睡眠要注意什么",
)

private val styleOptions = listOf("简短要点", "详细说明", "带图示视频", "先看原文对照")

/**
 * A04 你现在最想解决什么。
 * 用户主动选择困扰点与解释方式；可稍后更改。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfusionScreen(
    onNavigate: (String) -> Unit,
) {
    var selected by remember { mutableStateOf(confusionOptions.first().first) }
    var styles by remember { mutableStateOf<List<String>>(emptyList()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("你现在最想解决什么", fontSize = 17.sp, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = { onNavigate("A02") }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    Text(
                        "第 2 / 4 步",
                        color = Text3,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(end = 16.dp, top = 20.dp),
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
                .padding(horizontal = 16.dp),
        ) {
            Text(
                "选择一个最困扰你的问题（可稍后更改）。系统会按你的选择调整解释的重点、长度和形式。",
                color = Text2,
                fontSize = 13.sp,
                lineHeight = 20.sp,
                modifier = Modifier.padding(top = 16.dp, bottom = 24.dp),
            )

            confusionOptions.forEach { (title, desc) ->
                val isSelected = selected == title
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) PrimaryLight else Surface,
                    ),
                    border = BorderStroke(1.dp, if (isSelected) Primary else Border),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .clickable { selected = title },
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(16.dp),
                    ) {
                        RadioButton(selected = isSelected, onClick = { selected = title })
                        Column {
                            Text(
                                title,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                color = if (isSelected) Primary else Text1,
                            )
                            Text(desc, color = Text2, fontSize = 13.sp, lineHeight = 18.sp)
                        }
                    }
                }
            }

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = BorderStroke(1.dp, Border),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("希望的解释方式", fontSize = 15.sp, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.height(16.dp))
                    styleOptions.forEach { opt ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { styles = if (styles.contains(opt)) styles - opt else styles + opt }
                                .padding(vertical = 8.dp),
                        ) {
                            val checked = styles.contains(opt)
                            androidx.compose.material3.Checkbox(
                                checked = checked,
                                onCheckedChange = { styles = if (it) styles + opt else styles - opt },
                                colors = androidx.compose.material3.CheckboxDefaults.colors(
                                    checkedColor = Primary,
                                ),
                            )
                            Text(opt, fontSize = 14.sp, color = Text1, modifier = Modifier.padding(start = 8.dp))
                        }
                    }
                    Text(
                        "不会根据你的选择给你贴任何标签，也不会为了让你更安心而改写事实。",
                        color = Text2,
                        fontSize = 13.sp,
                        lineHeight = 20.sp,
                        modifier = Modifier.padding(top = 16.dp),
                    )
                }
            }

            Spacer(Modifier.weight(1f))

            PrimaryButton(text = "下一步", onClick = {
                scope.launch {
                    runCatching {
                        val episodes = ApiClient.api.getEpisodes().unwrap()
                        val episodeId = episodes.firstOrNull()?.id ?: run {
                            ApiClient.api.createEpisode(mapOf("title" to "本次发作")).unwrap().id
                        }
                        ApiClient.api.createCareEvent(mapOf(
                            "episodeId" to episodeId,
                            "eventType" to "主要困惑",
                            "occurredAt" to java.util.Date().toInstant().toString(),
                            "sourceType" to "自述",
                            "rawText" to "主要困惑：${selected}；解释方式：${styles.joinToString("、").ifEmpty { "未选择" }}",
                            "verifyStatus" to "尚未确认",
                        ))
                    }
                }
                onNavigate("A05")
            })
            Spacer(Modifier.height(24.dp))
        }
    }
}
