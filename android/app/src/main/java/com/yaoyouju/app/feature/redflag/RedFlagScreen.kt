package com.yaoyouju.app.feature.redflag

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A03 就医提示（R03 安全与范围流程） */
@Composable
fun RedFlagScreen(
    state: RedFlagUiState,
    onBack: () -> Unit,
    onCall120: () -> Unit,
    onFindHospital: () -> Unit,
    onContactDoctor: () -> Unit,
    onSummary: () -> Unit,
    onContents: () -> Unit,
    onDismissHospitalDialog: () -> Unit,
) {
    Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = AppDimens.PageMargin)
                .padding(bottom = 32.dp),
        ) {
            TopBar(title = "需要及时寻求专业帮助", onBack = onBack)

            // 就医提示卡片
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(AppColors.tint(AppColors.Error, 0.08f), RoundedCornerShape(AppDimens.RadiusCard))
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(
                    imageVector = AppIcons.Warning,
                    contentDescription = null,
                    tint = AppColors.Error,
                    modifier = Modifier.size(22.dp),
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "建议尽快就医",
                        color = AppColors.Error,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium,
                    )
                    Text(
                        text = "你刚才选择了：${state.selectedText}。这类变化需要医生及时评估，本产品无法替你判断严重程度，本轮不会生成个性化分析。",
                        color = AppColors.Error,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                    Text(
                        text = "本页在网络异常时也可查看。",
                        color = AppColors.Error.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
            }

            AppButton(
                text = "拨打 120 / 前往急诊",
                onClick = onCall120,
                type = AppButtonType.Danger,
                block = true,
                modifier = Modifier.padding(top = 12.dp),
            )
            AppButton(
                text = "查找附近医院",
                onClick = onFindHospital,
                type = AppButtonType.Secondary,
                block = true,
                modifier = Modifier.padding(top = 10.dp),
            )
            AppButton(
                text = "联系我的主治医生（已保存）",
                onClick = onContactDoctor,
                type = AppButtonType.Secondary,
                block = true,
                modifier = Modifier.padding(top = 10.dp),
            )

            AppCard(modifier = Modifier.padding(top = 12.dp)) {
                Text(text = "就诊时可以带上", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                if (state.reportHint.isNotBlank()) {
                    BringItem(state.reportHint)
                }
                BringItem("症状开始时间与最近变化记录")
                BringItem("正在使用的药物与既有医嘱")
            }

            AppButton(
                text = "生成一页“就诊交接”摘要（仅整理已有信息）",
                onClick = onSummary,
                type = AppButtonType.Soft,
                block = true,
                modifier = Modifier.padding(top = 12.dp),
            )

            TipBar(
                text = "此提示由临床审定规则触发，不是诊断结论；请以医生的评估为准。",
                type = TipBarType.Info,
                modifier = Modifier.padding(top = 12.dp),
            )

            Text(
                text = "我已知晓，继续查看已审核科普与复诊摘要",
                color = AppColors.Primary,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onContents() }
                    .padding(vertical = 20.dp),
            )
        }

        if (state.showHospitalDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0x66000000))
                    .clickable { onDismissHospitalDialog() },
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    modifier = Modifier
                        .padding(32.dp)
                        .widthIn(max = 420.dp)
                        .background(AppColors.Surface, RoundedCornerShape(AppDimens.RadiusCard))
                        .clickable(enabled = false) {}
                        .padding(20.dp),
                ) {
                    Text(text = "查找附近医院", color = AppColors.Text1, style = MaterialTheme.typography.titleSmall)
                    Text(
                        text = "请前往正规医疗机构急诊；如症状严重，请拨打 120 由急救车转运。本演示不提供实时定位与医院推荐。",
                        color = AppColors.Text2,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
                    )
                    AppButton(text = "我知道了", onClick = onDismissHospitalDialog, block = true)
                }
            }
        }
    }
}

@Composable
private fun BringItem(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = AppIcons.Check,
            contentDescription = null,
            tint = AppColors.Ok,
            modifier = Modifier.size(18.dp),
        )
        Text(text = text, color = AppColors.Text1, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
    }
}
