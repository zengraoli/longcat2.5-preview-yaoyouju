package com.yaoyouju.app.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.ChangeStore
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.DangerButton
import com.yaoyouju.app.ui.components.EmergencyDialog
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.Surface

/**
 * A03 就医提示。红旗信号直接提示，不被登录、付费、上传或长问卷阻断；
 * 网络异常时也可查看（文案中不含需联网获取的内容）。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RedflagScreen(
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    var symptoms by remember { mutableStateOf<List<String>>(emptyList()) }
    var showDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        symptoms = ChangeStore.loadRedFlags(context)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("需要及时寻求专业帮助", fontSize = 17.sp, fontWeight = FontWeight.SemiBold) },
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
                text = if (symptoms.isNotEmpty()) {
                    "你刚才选择了：${symptoms.joinToString("、")}。这类变化需要医生及时评估，本产品无法替你判断严重程度，本轮不会生成个性化分析。"
                } else {
                    "出现严重症状（如大小便失禁、下肢无力、剧烈疼痛）时，请立即就医。本产品无法替你判断严重程度，不会生成个性化分析。"
                },
                type = AlertType.ERROR,
            )

            Spacer(Modifier.height(24.dp))

            DangerButton(
                text = "拨打 120 / 前往急诊",
                onClick = { /* 演示环境不唤起系统拨号 */ },
            )

            Spacer(Modifier.height(16.dp))

            OutlinedCard(
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Close,
                        contentDescription = null,
                        tint = Error,
                        modifier = Modifier.size(24.dp),
                    )
                    Spacer(Modifier.size(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("查找附近医院", fontSize = 15.sp, fontWeight = FontWeight.Medium)
                        Text(
                            "请在地图应用中搜索附近医院",
                            color = com.yaoyouju.app.ui.theme.Text3,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            OutlinedCard(
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Close,
                        contentDescription = null,
                        tint = Error,
                        modifier = Modifier.size(24.dp),
                    )
                    Spacer(Modifier.size(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("联系我的主治医生（已保存）", fontSize = 15.sp, fontWeight = FontWeight.Medium)
                        Text(
                            "演示环境无已保存联系方式",
                            color = com.yaoyouju.app.ui.theme.Text3,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            YyjCard(modifier = Modifier.fillMaxWidth()) {
                Text("就诊时可以带上", fontSize = 15.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(12.dp))
                listOf(
                    "已录入的检查报告原文（2026-08-30 腰椎MRI）",
                    "症状开始时间与最近变化记录",
                    "正在使用的药物与既有医嘱",
                ).forEach { item ->
                    Row(verticalAlignment = Alignment.Top) {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            tint = com.yaoyouju.app.ui.theme.Ok,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(Modifier.size(10.dp))
                        Text(item, fontSize = 14.sp, color = com.yaoyouju.app.ui.theme.Text1, lineHeight = 22.sp)
                    }
                    Spacer(Modifier.height(14.dp))
                }
            }

            Spacer(Modifier.height(16.dp))

            YyjCard(modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.Check,
                        contentDescription = null,
                        tint = com.yaoyouju.app.ui.theme.Primary,
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(Modifier.size(8.dp))
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

            androidx.compose.material3.TextButton(onClick = { onNavigate("A13") }) {
                Text("我已知晓，继续查看已审核科普与复诊摘要", color = androidx.compose.ui.graphics.Color(0xFF0F6E74), fontSize = 14.sp)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}
