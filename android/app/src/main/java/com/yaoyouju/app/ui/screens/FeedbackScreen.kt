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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Upload
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.SegmentTabs
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val ERROR_CATEGORIES = listOf(
    "事实错误", "与我的报告不符", "越界（给了不该给的判断）", "缺少重要就医提示",
    "看不懂", "左右侧/日期混淆", "隐私问题", "其他",
)

/** A16 反馈与举报：帮助类型反馈 / 错误举报（自动附带当前分析版本）。 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FeedbackScreen(
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var mode by remember { mutableIntStateOf(1) } // 0=帮助类型反馈 1=错误举报
    var version by remember { mutableIntStateOf(3) }
    var analysisId by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var grantView by remember { mutableStateOf(true) }
    var categories by remember { mutableStateOf(listOf("与我的报告不符", "左右侧/日期混淆")) }
    val now = remember { SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date()) }

    LaunchedEffect(Unit) {
        runCatching { ApiClient.api.getEpisodes().unwrap() }.onSuccess { episodes ->
            val episodeId = episodes.firstOrNull()?.id ?: return@onSuccess
            runCatching { ApiClient.api.getLatestAnalysis(episodeId).unwrap() }
                .onSuccess {
                    version = it.version
                    analysisId = it.analysisId
                }
        }
    }

    fun submit() {
        scope.launch {
            runCatching {
                ApiClient.api.createFeedback(
                    mapOf(
                        "isErrorReport" to (mode == 1),
                        "errorDescription" to description,
                        "analysisId" to analysisId,
                        "errorCategory" to if (mode == 1) categories.joinToString("、") else "",
                        "severity" to if (mode == 1) "medium" else "",
                        "helpType" to if (mode == 0) (description.ifEmpty { "其他" }) else "",
                    ),
                ).unwrap()
            }.onSuccess {
                Toast.makeText(context, "提交成功", Toast.LENGTH_SHORT).show()
                delay(1000)
                onBack()
            }.onFailure { Toast.makeText(context, it.message ?: "提交失败", Toast.LENGTH_SHORT).show() }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 32.dp),
    ) {
        // 头部
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
            }
            Text("反馈与举报", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
        }

        SegmentTabs(
            tabs = listOf("帮助类型反馈", "错误举报"),
            selectedIndex = mode,
            onSelect = { mode = it },
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(Dimens.gapL))

        // 关于哪条内容（自动附带）
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Description, contentDescription = null, tint = Text2, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("关于哪条内容（自动附带）", fontWeight = FontWeight.Medium, fontSize = 15.sp, color = Text1)
            }
            Spacer(Modifier.height(10.dp))
            KvRow(label = "内容", value = "一页分析 v$version · ②-2 “硬膜囊受压”解释")
            KvRow(label = "版本", value = "分析 v$version · 模型 M-2609 · 科普 #07 v1 · 检索策略 R-4")
            KvRow(label = "时间", value = now)
        }
        Spacer(Modifier.height(14.dp))

        // 问题类型（错误举报）
        if (mode == 1) {
            YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Text("问题类型（可多选）", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
                Spacer(Modifier.height(12.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    ERROR_CATEGORIES.forEach { c ->
                        val selected = categories.contains(c)
                        Box(
                            modifier = Modifier
                                .height(34.dp)
                                .background(if (selected) Primary else Bg, RoundedCornerShape(17.dp))
                                .clickable {
                                    categories = if (selected) categories - c else categories + c
                                }
                                .padding(horizontal = 14.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(c, color = if (selected) Color.White else Text2, fontSize = 13.sp)
                        }
                    }
                }
            }
            Spacer(Modifier.height(14.dp))
        }

        // 具体描述
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Text(
                if (mode == 1) "具体描述" else "你想反馈什么？",
                fontWeight = FontWeight.Medium,
                fontSize = 16.sp,
                color = Text1,
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = description,
                onValueChange = { if (it.length <= 2000) description = it },
                placeholder = {
                    Text(
                        if (mode == 1) "例如：报告写的是右侧，但解释里说成了左侧……"
                        else "例如：看懂了 / 知道下一步 / 都不好，问题没解决",
                        color = Text3,
                        fontSize = 14.sp,
                    )
                },
                minLines = 4,
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = Bg,
                    focusedContainerColor = Bg,
                    unfocusedBorderColor = Color.Transparent,
                    focusedBorderColor = Primary,
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            if (mode == 1) {
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Upload, contentDescription = null, tint = Primary, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("添加截图（可选）", color = Primary, fontSize = 13.sp)
                }
            }
        }

        // 同意举报核查（错误举报）
        if (mode == 1) {
            Spacer(Modifier.height(14.dp))
            YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
                Row(verticalAlignment = Alignment.Top) {
                    Box(
                        modifier = Modifier
                            .padding(top = 2.dp)
                            .size(20.dp)
                            .background(if (grantView) Primary else Surface, RoundedCornerShape(4.dp))
                            .border(1.dp, if (grantView) Primary else Border, RoundedCornerShape(4.dp))
                            .clickable { grantView = !grantView },
                        contentAlignment = Alignment.Center,
                    ) {
                        if (grantView) Text("✓", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.width(12.dp))
                    Text(
                        "允许审核人员为处理这条举报查看相关资料（仅限本条分析涉及的报告与记录，可随时撤回）",
                        color = Text1,
                        fontSize = 13.sp,
                        lineHeight = 20.sp,
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        AlertBar(
            text = "你的反馈不会自动进入医学知识库。它会由运营编辑和临床审核人员处理，能定位受影响的版本与用户；处理结果会通知你。",
            type = AlertType.INFO,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(24.dp))

        PrimaryButton(
            text = if (mode == 1) "提交举报" else "提交反馈",
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
            onClick = { submit() },
        )
        Spacer(Modifier.height(16.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onBack() }
                .padding(12.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text("取消", color = Primary, fontSize = 14.sp)
        }
    }
}

@Composable
private fun KvRow(label: String, value: String) {
    Row(modifier = Modifier.padding(vertical = 6.dp), verticalAlignment = Alignment.Top) {
        Text(label, color = Text3, fontSize = 12.sp, modifier = Modifier.width(36.dp))
        Text(value, color = Text1, fontSize = 13.sp, lineHeight = 20.sp)
    }
}
