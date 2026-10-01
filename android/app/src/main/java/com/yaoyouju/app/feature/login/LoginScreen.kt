package com.yaoyouju.app.feature.login

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppCheckbox
import com.yaoyouju.app.core.components.AppTextField
import com.yaoyouju.app.core.components.EmergencyBar
import com.yaoyouju.app.core.components.EmergencyDialog
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A01 启动 · 登录与授权（设计稿 375 宽） */
@Composable
fun LoginScreen(
    state: LoginUiState,
    onPhoneChange: (String) -> Unit,
    onCodeChange: (String) -> Unit,
    onToggleAgreed: () -> Unit,
    onToggleConsented: () -> Unit,
    onSendCode: () -> Unit,
    onLogin: () -> Unit,
    onShowEmergency: (Boolean) -> Unit,
) {
    Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = AppDimens.PageMargin)
                .padding(bottom = 32.dp),
        ) {
            // 品牌区
            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 48.dp, bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .background(AppColors.Primary, RoundedCornerShape(20.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(text = "腰", color = AppColors.Surface, fontSize = 32.sp, fontWeight = FontWeight.Medium)
                }
                Text(
                    text = "腰有据",
                    color = AppColors.Text1,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 16.dp),
                )
                Text(
                    text = "腰痛理解与复诊助手",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }

            // 三项价值说明
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {                FeatureCard("看懂报告", "术语解释＋原文对照", Modifier.weight(1f))
                FeatureCard("记录病程", "低负担，保留来源", Modifier.weight(1f))
                FeatureCard("准备复诊", "一页摘要，可导出", Modifier.weight(1f))
            }

            // 登录表单
            Text(text = "手机号", color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(bottom = 6.dp))
            AppTextField(
                value = state.phone,
                onValueChange = onPhoneChange,
                placeholder = "请输入手机号",
                keyboardType = KeyboardType.Phone,
                maxLength = 11,
            )
            Text(text = "验证码", color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 12.dp, bottom = 6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                AppTextField(
                    value = state.code,
                    onValueChange = onCodeChange,
                    placeholder = "6位验证码",
                    keyboardType = KeyboardType.Number,
                    maxLength = 6,
                    modifier = Modifier.weight(1f),
                )
                Text(
                    text = if (state.countdown > 0) "${state.countdown}s" else "获取验证码",
                    color = if (state.countdown > 0) AppColors.Text3 else AppColors.Primary,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier
                        .height(AppDimens.MinTouch)
                        .clickable(enabled = state.countdown == 0) { onSendCode() }
                        .padding(horizontal = 4.dp)
                        .wrapContentCenter(),
                )
            }

            AppButton(
                text = "登录 / 注册",
                onClick = onLogin,
                block = true,
                enabled = !state.loading,
                modifier = Modifier.padding(top = 16.dp),
            )

            // 用户协议勾选（高亮框）
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp)
                    .background(AppColors.PrimaryLight, RoundedCornerShape(AppDimens.RadiusCard))
                    .border(1.dp, AppColors.Primary, RoundedCornerShape(AppDimens.RadiusCard))
                    .clickable { onToggleAgreed() }
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                AppCheckbox(checked = state.agreed, onToggle = onToggleAgreed)
                Text(
                    text = "我已阅读并同意《用户协议》《隐私政策》",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier.weight(1f),
                )
            }

            // 单独同意：健康信息
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp)
                    .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
                    .clickable { onToggleConsented() }
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                AppCheckbox(checked = state.consented, onToggle = onToggleConsented, modifier = Modifier.padding(top = 2.dp))
                Text(
                    text = "单独同意：处理我的健康信息（含检查报告、症状记录，属敏感个人信息）。可随时在“我的-数据与授权”撤回。",
                    color = AppColors.Text2,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.weight(1f),
                )
            }

            TipBar(
                text = "本产品帮助你理解资料与准备复诊，不代替医生诊断，不提供处方或手术判断。",
                type = TipBarType.Info,
                modifier = Modifier.padding(top = 12.dp),
            )

            EmergencyBar(
                onClick = { onShowEmergency(true) },
                modifier = Modifier.padding(top = 12.dp),
            )
        }

        if (state.showEmergency) {
            EmergencyDialog(tips = state.emergency, onDismiss = { onShowEmergency(false) })
        }
    }
}

@Composable
private fun FeatureCard(title: String, desc: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
            .padding(horizontal = 2.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = title,
            color = AppColors.Primary,
            style = MaterialTheme.typography.labelLarge,
            textAlign = TextAlign.Center,
            maxLines = 1,
        )
        Text(
            text = desc,
            color = AppColors.Text2,
            style = MaterialTheme.typography.labelSmall,
            // 屏幕比设计稿窄（360dp）时用 10sp 保持一行，避免“原文对/照”式断词
            fontSize = 10.sp,
            textAlign = TextAlign.Center,
            maxLines = 1,
            modifier = Modifier.padding(top = 2.dp),
        )
    }
}

/** 让文本在固定高度内垂直居中 */
private fun Modifier.wrapContentCenter(): Modifier = this.wrapContentHeight(Alignment.CenterVertically)
