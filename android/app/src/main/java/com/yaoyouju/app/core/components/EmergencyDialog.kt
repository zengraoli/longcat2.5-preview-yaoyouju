package com.yaoyouju.app.core.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** 就医提示数据 */
data class EmergencyTips(
    val title: String,
    val redFlags: List<String>,
    val note: String,
)

/**
 * 就医提示的本地兜底内容：服务不可达时也必须能看到红旗清单（产品红线 3）。
 * 与 server /safety/tips 的 SAFETY_TIPS 保持一致。
 */
object LocalSafetyTips {
    val redFlags: List<String> = listOf(
        "大小便功能异常或鞍区麻木",
        "进行性下肢肌力下降",
        "夜间痛醒伴体重明显下降",
        "外伤后腰部剧痛",
        "发热伴腰痛",
        "疼痛剧烈、止痛药无法缓解",
        "有肿瘤病史又出现新发腰痛",
    )

    fun tips(): EmergencyTips = EmergencyTips(
        title = "出现以下情况请及时就医",
        redFlags = redFlags,
        note = "本提示不构成诊断；如症状持续或加重，请前往正规医疗机构就诊。",
    )
}

/** 就医提示弹层：无需登录，任意页面可达 */
@Composable
fun EmergencyDialog(
    tips: EmergencyTips,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit = onDismiss,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0x66000000))
            .clickable { onDismiss() },
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
            Text(text = tips.title, style = MaterialTheme.typography.titleSmall, color = AppColors.Text1)
            Column(modifier = Modifier.padding(top = 12.dp)) {
                tips.redFlags.forEach { item ->
                    Row(
                        modifier = Modifier.padding(bottom = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text(text = "•", color = AppColors.Error, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = item,
                            color = AppColors.Text1,
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }
            Text(
                text = tips.note,
                color = AppColors.Text2,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp, bottom = 16.dp),
            )
            AppButton(text = "我知道了", onClick = onConfirm, block = true)
        }
    }
}
