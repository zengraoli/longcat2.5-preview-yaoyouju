package com.yaoyouju.app.ui.screens

import android.app.DatePickerDialog
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Calendar
import com.yaoyouju.app.ui.components.DateField
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.SecondaryButton
import com.yaoyouju.app.ui.components.SelectField
import com.yaoyouju.app.ui.components.TextLink

private val Primary = Color(0xFF0F6E74)
private val Surface = Color(0xFFFFFFFF)
private val BorderC = Color(0xFFE4E8EE)
private val Text1 = Color(0xFF1B2230)
private val Text2 = Color(0xFF5C6675)
private val Warn = Color(0xFFC77700)

private val tabs = listOf("粘贴文字（推荐）", "拍照提取", "暂不录入")
private val typeOptions = listOf("MRI", "CT", "X光", "超声", "其他")

/**
 * A05 录入报告与医嘱（可选）：优先粘贴文字；记录来源类型与日期；可跳过。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportScreen(
    onNavigate: (String) -> Unit,
) {
    var tab by remember { mutableStateOf(0) }
    var rawText by remember { mutableStateOf("腰椎MRI平扫：L4/5椎间盘轻度膨出；L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能…（示例文本，仅用于演示）") }
    var reportDate by remember { mutableStateOf("2026-08-30") }
    var typeIndex by remember { mutableStateOf(0) }
    var hospital by remember { mutableStateOf("") }
    var doctorAdvice by remember { mutableStateOf("") }

    val context = LocalContext.current

    fun openDatePicker() {
        val c = Calendar.getInstance()
        DatePickerDialog(
            context,
            { _, y, m, d ->
                reportDate = "%04d-%02d-%02d".format(y, m + 1, d)
            },
            c.get(Calendar.YEAR),
            c.get(Calendar.MONTH),
            c.get(Calendar.DAY_OF_MONTH),
        ).show()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("录入报告与医嘱（可选）") },
                navigationIcon = {
                    Button(onClick = { onNavigate("A02") }) { Text("返回") }
                },
                actions = { Text("第 3 / 4 步", modifier = Modifier.padding(end = 12.dp)) },
            )
        },
        containerColor = Color(0xFFF4F6F8),
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                tabs.forEachIndexed { i, label ->
                    val selected = tab == i
                    Button(
                        onClick = { tab = i },
                        modifier = Modifier.weight(1f).padding(horizontal = 4.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selected) Primary else Surface,
                            contentColor = if (selected) Color.White else Primary,
                        ),
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (selected) Primary else BorderC),
                    ) { Text(label, fontSize = 12.sp) }
                }
            }

            Spacer(Modifier.height(4.dp))

            Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Surface)) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("检查报告原文", fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Text1)
                        Spacer(Modifier.width(8.dp))
                        Text("来源：报告原文", fontSize = 12.sp, color = Color(0xFF2F6FD8))
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = rawText,
                        onValueChange = { rawText = it },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 6,
                        shape = RoundedCornerShape(10.dp),
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("报告日期", color = Text2, fontSize = 13.sp)
                            OutlinedTextField(
                                value = reportDate,
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth().clickable { openDatePicker() },
                                shape = RoundedCornerShape(10.dp),
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text("检查类型", color = Text2, fontSize = 13.sp)
                            OutlinedTextField(
                                value = typeOptions[typeIndex],
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                            )
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("检查机构（可选）", color = Text2, fontSize = 13.sp)
                    OutlinedTextField(
                        value = hospital,
                        onValueChange = { hospital = it },
                        placeholder = { Text("如：XX市人民医院") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                    )
                }
            }

            Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Surface)) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("医生已经给出的建议（可选）", fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Text1)
                        Spacer(Modifier.width(8.dp))
                        Text("来源：自述", fontSize = 12.sp, color = Color(0xFFC77700))
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = doctorAdvice,
                        onValueChange = { doctorAdvice = it },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 4,
                        shape = RoundedCornerShape(10.dp),
                    )
                    Spacer(Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("保守治疗", "复查时间", "用药", "康复建议", "手术评估").forEach { c ->
                            Button(
                                onClick = { doctorAdvice = (doctorAdvice + "；" + c).trimStart('；') },
                                colors = ButtonDefaults.buttonColors(containerColor = Surface, contentColor = Text1),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderC),
                                shape = RoundedCornerShape(10.dp),
                            ) { Text(c, fontSize = 13.sp) }
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFE7F0FE))) {
                Text(
                    "原文仅用于对照解释，每个关键解释都可回看原文。本产品不做影像读片诊断，也不会把报告中未描述的内容写成“已排除”。",
                    modifier = Modifier.padding(14.dp),
                    color = Text2,
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                )
            }

            Spacer(Modifier.height(16.dp))

            PrimaryButton(text = if (tab == 0) "下一步：核对信息" else "下一步", onClick = {
                if (tab != 0) {
                    run {
                        onNavigate("A06")
                    }
                } else {
                    onNavigate("A06")
                }
            })
            OutlinedButton(onClick = { onNavigate("A06") }) {
                Text("跳过，先不录入报告", color = Primary)
            }
        }
    }
}
