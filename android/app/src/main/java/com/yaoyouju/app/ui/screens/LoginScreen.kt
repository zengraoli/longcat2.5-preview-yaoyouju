package com.yaoyouju.app.ui.screens

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.TokenStore
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.data.api.ConsentRequest
import com.yaoyouju.app.ui.components.EmergencyDialog
import com.yaoyouju.app.ui.components.EmergencyBar
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.ErrorTint
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.PrimaryLight
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val features = listOf(
    "看懂报告" to "术语解释＋原文对照",
    "记录病程" to "低负担，保留来源",
    "准备复诊" to "一页摘要，可导出",
)

/**
 * A01 启动 · 登录与授权。
 * 手机号验证码登录；单独同意处理敏感健康信息；紧急求助入口不被登录阻断。
 */
@Composable
fun LoginScreen(
    onLoggedIn: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var phone by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var countdown by remember { mutableIntStateOf(0) }
    var agreement by remember { mutableStateOf(false) }
    var healthConsent by remember { mutableStateOf(false) }
    var showEmergency by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(countdown) {
        if (countdown > 0) {
            delay(1000)
            countdown--
        }
    }

    fun sendCode() {
        if (phone.length != 11) {
            errorMsg = "请输入正确的手机号"
            return
        }
        errorMsg = null
        scope.launch {
            runCatching<Map<String, Boolean>> { ApiClient.api.sendCode(mapOf("phone" to phone)).unwrap() }
                .onSuccess { countdown = 60 }
                .onFailure { errorMsg = it.message ?: "发送失败" }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg)
            .padding(horizontal = Dimens.pagePadding)
            .verticalScroll(rememberScrollState()),
    ) {
        // 紧急求助入口（不被登录阻断）
        Row(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 24.dp)
                .clickable { showEmergency = true },
        ) {
            Text("紧急求助", color = Error, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 96.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // 应用图标
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .background(Primary, RoundedCornerShape(18.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text("腰", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(16.dp))
            Text("腰有据", color = Primary, fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Text("腰痛理解与复诊助手", color = Text2, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            Text("帮助你理解检查报告、整理病程、准备复诊", color = Text3, fontSize = 12.sp)

            Spacer(Modifier.height(40.dp))
            // 三大价值
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                features.forEach { (title, desc) ->
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(PrimaryLight, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(title, color = Primary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                        Spacer(Modifier.height(4.dp))
                        Text(desc, color = Text2, fontSize = 10.sp, lineHeight = 14.sp)
                    }
                }
            }

            Spacer(Modifier.height(32.dp))
            // 登录表单
            OutlinedTextField(
                value = phone,
                onValueChange = { if (it.length <= 11) phone = it },
                label = { Text("手机号", color = Text2, fontSize = 13.sp) },
                placeholder = { Text("请输入手机号", color = Text3) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = code,
                    onValueChange = { if (it.length <= 6) code = it },
                    label = { Text("验证码", color = Text2, fontSize = 13.sp) },
                    placeholder = { Text("6 位验证码", color = Text3) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                Button(
                    onClick = { sendCode() },
                    enabled = countdown == 0,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryLight, contentColor = Primary),
                    modifier = Modifier.height(48.dp),
                ) {
                    Text(if (countdown > 0) "${countdown}s" else "获取验证码", fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(24.dp))
            PrimaryButton(
                text = "登录 / 注册",
                enabled = phone.length == 11 && code.length == 6 && healthConsent && !loading,
                onClick = {
                    loading = true
                    errorMsg = null
                    scope.launch {
                        val result = runCatching {
                            ApiClient.api.login(mapOf("phone" to phone, "code" to code)).unwrap()
                        }
                        result.onSuccess { data ->
                            TokenStore.saveToken(data.token)
                            TokenStore.savePhone(phone)
                            runCatching { ApiClient.api.grantConsent(ConsentRequest(listOf("健康信息处理"))) }
                            onLoggedIn()
                        }.onFailure {
                            errorMsg = it.message ?: "登录失败"
                        }
                        loading = false
                    }
                },
            )

            Spacer(Modifier.height(20.dp))
            // 协议勾选
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = agreement,
                    onCheckedChange = { agreement = it },
                    colors = CheckboxDefaults.colors(checkedColor = Primary),
                )
                Text("我已阅读并同意《用户协议》《隐私政策》", color = Text2, fontSize = 12.sp)
            }
            // 单独同意卡
            Card(
                shape = RoundedCornerShape(Dimens.cardRadius),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Checkbox(
                        checked = healthConsent,
                        onCheckedChange = { healthConsent = it },
                        colors = CheckboxDefaults.colors(checkedColor = Primary),
                    )
                    Text(
                        "单独同意：处理我的健康信息（含检查报告、症状记录，属敏感个人信息）。可随时在“我的-数据与授权”撤回。",
                        color = Text2,
                        fontSize = 12.sp,
                        lineHeight = 18.sp,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))
            AlertBar(
                text = "本产品帮助你理解资料与准备复诊，不代替医生诊断，不提供处方或手术判断。",
                type = com.yaoyouju.app.ui.components.AlertType.INFO,
            )
            Spacer(Modifier.height(16.dp))
            EmergencyBar(
                text = "出现严重症状？无需登录，立即查看就医提示",
                onClick = { showEmergency = true },
            )
            Spacer(Modifier.height(32.dp))
        }

        errorMsg?.let {
            Text(it, color = Error, fontSize = 13.sp, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        }
    }

    if (showEmergency) {
        EmergencyDialog(onDismiss = { showEmergency = false })
    }
}
