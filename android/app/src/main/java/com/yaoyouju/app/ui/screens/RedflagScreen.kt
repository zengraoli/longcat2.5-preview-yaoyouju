package com.yaoyouju.app.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.ErrorTint
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Surface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RedflagScreen(
    onBack: () -> Unit,
    onGoContent: () -> Unit,
) {
    val context = LocalContext.current

    fun dial120() {
        runCatching {
            context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:120")))
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("需要及时寻求专业帮助", fontSize = 17.sp, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
                    }
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
                .padding(horizontal = 16.dp),
        ) {
            AlertBar(
                text = "建议尽快就医：你刚才选择了需要医生及时评估的症状。这类变化需要医生及时评估，本产品无法替你判断严重程度，本轮不会生成个性化分析。本页在网络异常时也可查看。",
                type = AlertType.ERROR,
            )

            Spacer(Modifier.height(16.dp))

            Button(
                onClick = { dial120() },
                shape = RoundedCornerShape(10.dp),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Error),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
            ) {
                Text("拨打 120 / 前往急诊", fontSize = 16.sp, fontWeight = FontWeight.Medium)
            }

            Spacer(Modifier.height(12.dp))

            OutlinedCard(
                onClick = { },
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("查找附近医院", fontSize = 15.sp, modifier = Modifier.padding(18.dp))
            }

            Spacer(Modifier.height(12.dp))

            OutlinedCard(
                onClick = { },
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("联系我的主治医生（已保存）", fontSize = 15.sp, modifier = Modifier.padding(18.dp))
            }

            Spacer(Modifier.height(24.dp))

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("就诊时可以带上", fontSize = 15.sp, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.height(16.dp))
                    listOf(
                        "已录入的检查报告原文（2026-08-30 腰椎MRI）",
                        "症状开始时间与最近变化记录",
                        "正在使用的药物与既有医嘱",
                    ).forEach { item ->
                        Row(verticalAlignment = Alignment.Top) {
                            Text("✓", color = Color(0xFF1E9E5A), fontSize = 15.sp, modifier = Modifier.padding(end = 10.dp, top = 2.dp))
                            Text(item, fontSize = 14.sp, color = Text1)
                        }
                        Spacer(Modifier.height(14.dp))
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            Card(
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = com.yaoyouju.app.ui.theme.PrimaryLight),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(16.dp)) {
                    Icon(
                        imageVector = Icons.Filled.Check,
                        contentDescription = null,
                        tint = com.yaoyouju.app.ui.theme.Primary,
                        modifier = Modifier.padding(end = 10.dp),
                    )
                    Text(
                        "生成一页“就诊交接”摘要（仅整理已有信息）",
                        color = com.yaoyouju.app.ui.theme.Primary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            AlertBar(
                text = "此提示由临床审定规则触发，不是诊断结论；请以医生的评估为准。",
                type = AlertType.INFO,
            )

            Spacer(Modifier.height(24.dp))

            TextButton(onClick = onGoContent) {
                Text("我已知晓，继续查看已审核科普与复诊摘要", color = Primary, fontSize = 14.sp)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}
