package com.yaoyouju.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.material.icons.filled.Warning
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.Primary

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
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.ChangeStore
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.DateField
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.SecondaryButton
import com.yaoyouju.app.ui.components.SelectableChip
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Warn
import com.yaoyouju.app.ui.theme.WarnTint
import kotlinx.coroutines.launch

private val redFlags = listOf(
    "大小便控制异常",
    "会阴区或鞍区麻木",
    "双腿进行性无力",
    "发热、夜间痛持续不缓解或体重明显下降",
)
private const val FLAG_NONE = "以上都没有"
private const val FLAG_UNSURE = "不确定 / 记不清"

private val changeOptions = listOf("加重", "差不多", "减轻", "尚未确认")
private val onsetOptions = listOf("记不清", "约1周内", "约1个月内", "超过3个月")

/**
 * A02 当前关键变化确认。
 * 低负担录入：缺失不默认阴性（"尚未确认"）；命中红旗项进入 A03 就医提示。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChangeScreen(
    onNavigate: (String) -> Unit,
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var change by remember { mutableStateOf("") }
    var flags by remember { mutableStateOf<List<String>>(emptyList()) }
    var side by remember { mutableStateOf("") }
    var onsetDate by remember { mutableStateOf("") }
    var onsetRange by remember { mutableStateOf("") }
    val totalSteps = 4
    var episodeId by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    fun toggleFlag(item: String) {
        flags = when {
            item == FLAG_NONE -> if (flags == listOf(FLAG_NONE)) emptyList() else listOf(FLAG_NONE)
            flags.contains(item) -> flags - item
            else -> flags.filter { it != FLAG_NONE } + item
        }
    }

    LaunchedEffect(Unit) {
        runCatching { ApiClient.api.getEpisodes().unwrap() }
            .onSuccess { list -> episodeId = list.firstOrNull()?.id ?: "" }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("当前关键变化确认", fontSize = 17.sp, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = { onNavigate("A14") }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    Text(
                        "第 1 / 4 步",
                        color = Text3,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(end = Dimens.pagePadding),
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
                .verticalScroll(rememberScrollState())
                .padding(start = Dimens.pagePadding, end = Dimens.pagePadding),
        ) {
            AlertBar(
                text = "先确认最近的变化。没有回答的问题会记录为“尚未确认”，不会被当作“没有”。",
                type = AlertType.INFO,
            )
            Spacer(Modifier.height(Dimens.gapL))

            YyjCard(modifier = Modifier.fillMaxWidth()) {
                Text("1. 与上次记录相比，最近腰痛或腿部症状有变化吗？", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Text1)
                Spacer(Modifier.height(Dimens.gapM))
                changeOptions.forEach { opt ->
                    SelectableChip(
                        text = opt,
                        selected = change == opt,
                        onClick = { change = if (change == opt) "" else opt },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                    )
                }
            }

            YyjCard(modifier = Modifier.fillMaxWidth()) {
                Text("2. 最近是否出现以下任一情况？（可多选）", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Text1)
                Text(
                    "这些变化需要医生及时评估，出现时会优先提示就医。",
                    color = Text3, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp),
                )
                Spacer(Modifier.height(Dimens.gapS))
                (redFlags + FLAG_NONE + FLAG_UNSURE).forEach { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { toggleFlag(item) }
                            .padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Checkbox(
                            checked = flags.contains(item),
                            onCheckedChange = { toggleFlag(item) },
                            colors = androidx.compose.material3.CheckboxDefaults.colors(checkedColor = androidx.compose.ui.graphics.Color(0xFF0F6E74)),
                        )
                        Text(item, fontSize = 14.sp, color = Text1, modifier = Modifier.padding(start = 8.dp))
                    }
                }
            }

            YyjCard(modifier = Modifier.fillMaxWidth()) {
                Text("3. 疼痛或麻木主要涉及哪一侧？", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Text1)
                Spacer(Modifier.height(Dimens.gapM))
                listOf("左侧", "右侧", "双侧", "尚未确认").forEach { opt ->
                    SelectableChip(
                        text = opt,
                        selected = side == opt,
                        onClick = { side = if (side == opt) "" else opt },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                    )
                }
            }

            YyjCard(modifier = Modifier.fillMaxWidth()) {
                Text("4. 这次症状大约从什么时候开始？", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Text1)
                Spacer(Modifier.height(Dimens.gapM))
                DateField(
                    value = onsetDate,
                    placeholder = "选择日期，或点“记不清”",
                    onValueChange = { onsetDate = it; if (it.isNotEmpty()) onsetRange = "" },
                )
                Spacer(Modifier.height(Dimens.gapM))
                onsetOptions.forEach { opt ->
                    SelectableChip(
                        text = opt,
                        selected = onsetRange == opt,
                        onClick = { onsetRange = if (onsetRange == opt) "" else opt; if (onsetRange.isNotEmpty()) onsetDate = "" },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                    )
                }
            }

            Spacer(Modifier.height(Dimens.gapL))
            PrimaryButton(text = "下一步", onClick = {
                error = null
                scope.launch {
                    val result = runCatching {
                        ChangeStore.saveRedFlags(context, flags)
                        if (episodeId.isEmpty()) {
                            episodeId = ApiClient.api.createEpisode(mapOf("title" to "本次发作")).unwrap()["id"] ?: ""
                        }
                        ApiClient.api.createCareEvent(mapOf(
                            "episodeId" to episodeId,
                            "eventType" to "变化确认",
                            "occurredAt" to java.util.Date().toInstant().toString(),
                            "sourceType" to "自述",
                            "rawText" to "变化：${change.ifEmpty { "尚未确认" }}；红旗项：${flags.joinToString("、").ifEmpty { "无" }}；侧别：${side.ifEmpty { "尚未确认" }}；开始日期：${onsetDate.ifEmpty { onsetRange }.ifEmpty { "尚未确认" }}",
                            "verifyStatus" to "尚未确认",
                        )).unwrap()
                    }
                    result.onSuccess {
                        val realFlags = flags.filter { it != FLAG_NONE && it != FLAG_UNSURE }
                        if (realFlags.isNotEmpty()) onNavigate("A03") else onNavigate("A04")
                    }.onFailure { error = it.message ?: "保存失败" }
                }
            })
            TextButton(onClick = { onNavigate("A04") }) {
                Text("先看已审核科普，稍后再填", color = Primary, fontSize = 14.sp)
            }
            Spacer(Modifier.height(Dimens.gapL))
        }

        error?.let {
            Text(it, color = Error, fontSize = 13.sp, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        }
    }
}
