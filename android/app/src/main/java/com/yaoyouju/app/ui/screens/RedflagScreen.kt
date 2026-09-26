package com.yaoyouju.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.ChangeStore
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.ErrorTint
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class ReportInfo(val date: String, val type: String)

/**
 * A03 就医提示。
 * 红旗信号直接提示，不被登录、付费、上传或长问卷阻断；停止个性化分析。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RedflagScreen(
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current

    var symptoms by remember { mutableStateOf<List<String>>(emptyList()) }
    LaunchedEffect(Unit) {
        symptoms = ChangeStore.loadRedFlags(context)
    }
    val report by produceState<ReportInfo?>(initialValue = null) {
        value = withContext(Dispatchers.IO) {
            runCatching {
                val episodes = ApiClient.api.getEpisodes().unwrap()
                episodes.firstOrNull()?.let { ep ->
                    val events = ApiClient.api.getTimeline(ep.id).unwrap()
                    events.firstOrNull { e ->
                        (e["event_type"] ?: "").contains("报告")
                    }?.let { e ->
                        ReportInfo(
                            date = e["occurred_at"]?.take(10) ?: "尚未确认",
                            type = (e["event_type"] ?: "").replace("报告", "").ifEmpty { "检查" },
                        )
                    }
                }
            }.getOrNull()
        }
    }

    LaunchedEffect(Unit) {
        runCatching {
            val episodes = ApiClient.api.getEpisodes().unwrap()
            episodes.firstOrNull()?.let { ep ->
                val analysis = ApiClient.api.getLatestAnalysis(ep.id).unwrap()
                symptoms = analysis.sections.unknown
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("需要及时寻求专业帮助", fontSize = 17.sp, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = { onNavigate("A14") }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = Dimens.pagePadding),
        ) {
            Card(
                shape = RoundedCornerShape(Dimens.cardRadius),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFBEBEB)),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(Dimens.cardPadding)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Error, contentDescription = null, tint = Color(0xFFD93B3B))
                        Spacer(Modifier.size(10.dp))
                        Text("建议尽快就医", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFD93B3B))
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("系统检测到需要医生及时评估的症状。本产品无法替你判断严重程度，本轮不会生成个性化分析。", color = Color(0xFF1B2230), lineHeight = 24.sp, fontSize = 14.sp)
                    if (symptoms.isNotEmpty()) {
                        Spacer(Modifier.height(12.dp))
                        symptoms.forEach { s -> Text("· $s", color = Color(0xFF5C6675), fontSize = 13.sp) }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("本页在网络异常时也可查看。", color = Color(0xFF98A1AE), fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = { runCatching { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:120"))) } },
                shape = RoundedCornerShape(Dimens.buttonRadius),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD93B3B), contentColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
            ) {
                Text("拨打 120 / 前往急诊", fontSize = 15.sp, fontWeight = FontWeight.Medium)
            }

            Spacer(Modifier.height(16.dp))

            OutlinedCard(
                shape = RoundedCornerShape(Dimens.cardRadius),
                border = BorderStroke(1.dp, Color(0xFFE4E8EE)),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showToast(context, "请在地图应用中搜索附近医院") },
            ) {
                Row(
                    modifier = Modifier.padding(Dimens.cardPadding),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(22.dp),
                    )
                    Spacer(Modifier.size(10.dp))
                    Text("查找附近医院", fontSize = 15.sp, color = Color(0xFF1B2230))
                }
            }

            Spacer(Modifier.height(12.dp))

            OutlinedCard(
                shape = RoundedCornerShape(Dimens.cardRadius),
                border = BorderStroke(1.dp, Color(0xFFE4E8EE)),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showToast(context, "已保存的主治医生联系方式（演示）") },
            ) {
                Row(
                    modifier = Modifier.padding(Dimens.cardPadding),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Check,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(22.dp),
                    )
                    Spacer(Modifier.size(10.dp))
                    Text("联系我的主治医生（已保存）", fontSize = 15.sp, color = Color(0xFF1B2230))
                }
            }

            Spacer(Modifier.height(24.dp))

            YyjCard(modifier = Modifier.fillMaxWidth()) {
                Text("就诊时可以带上", fontSize = 15.sp, fontWeight = FontWeight.Medium, color = Color(0xFF1B2230))
                Spacer(Modifier.height(16.dp))
                listOfNotNull(
                    report?.let { "已录入的检查报告原文（${it.date} ${it.type}）" },
                    "症状开始时间与最近变化记录",
                    "正在使用的药物与既有医嘱",
                ).forEach { item ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            tint = Color(0xFF1E9E5A),
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(Modifier.size(10.dp))
                        Text(item, fontSize = 14.sp, color = Color(0xFF1B2230), lineHeight = 20.sp)
                    }
                    Spacer(Modifier.height(14.dp))
                }
            }

            AlertBar(
                text = "此提示由临床审定规则触发，不是诊断结论；请以医生的评估为准。",
                type = AlertType.INFO,
            )
            Spacer(Modifier.height(24.dp))

            TextButton(onClick = { onNavigate("A13") }) {
                Text("我已知晓，继续查看已审核科普与复诊摘要", color = Primary, fontSize = 14.sp)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

private fun showToast(context: android.content.Context, message: String) {
    android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_SHORT).show()
}
