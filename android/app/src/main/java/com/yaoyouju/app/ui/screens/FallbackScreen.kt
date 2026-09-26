package com.yaoyouju.app.ui.screens

import android.widget.Toast
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material.icons.outlined.WifiOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.SecondaryButton
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.ErrorTint
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.PrimaryLight
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Warn
import com.yaoyouju.app.ui.theme.WarnTint

/** A18 服务回退：模型不可用时的降级页，核心功能仍可用 + 紧急就医入口。 */
@Composable
fun FallbackScreen(
    onBack: () -> Unit,
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    var showEmergency by remember { mutableStateOf(false) }

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
            Text("一页分析", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
        }

        // 离线图标
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 28.dp),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .background(WarnTint, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Outlined.WifiOff, contentDescription = null, tint = Warn, modifier = Modifier.size(34.dp))
            }
        }
        Text(
            "本次无法完成个性化解释",
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            color = Text1,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(14.dp))
        Text(
            "模型或来源校验暂时不可用。我们不会无限重试，也不会重复计费。你已核对的信息已经保存，稍后可以直接生成分析。",
            color = Text2,
            fontSize = 14.sp,
            lineHeight = 24.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
        )
        Spacer(Modifier.height(18.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            StatusTag("错误码 ANL-503", TagType.MUTED)
            StatusTag("已保存核对信息", TagType.OK)
            StatusTag("未计费", TagType.OK)
        }
        Spacer(Modifier.height(28.dp))

        Text(
            "现在仍然可以使用",
            fontSize = 15.sp,
            fontWeight = FontWeight.Medium,
            color = Text1,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(10.dp))
        AvailabilityCard(icon = Icons.Filled.PlayArrow, title = "已审核科普", desc = "8 个视频/图文，含字幕与文字替代，不依赖模型")
        AvailabilityCard(icon = Icons.Outlined.Description, title = "复诊摘要", desc = "基于你已有的记录与报告原文生成，可导出")
        AvailabilityCard(icon = Icons.Filled.MonitorHeart, title = "病程记录", desc = "继续记录今天；数据只保存在你的账户")
        Spacer(Modifier.height(Dimens.gapL))

        AlertBar(
            text = "低带宽下本页与核心文字仍可阅读；网络异常时也能看到基础求助说明。",
            type = AlertType.INFO,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(14.dp))

        // 紧急就医（不依赖网络）
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding)
                .background(ErrorTint, RoundedCornerShape(Dimens.cardRadius))
                .clickable { showEmergency = true }
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Outlined.Warning, contentDescription = null, tint = Error, modifier = Modifier.size(22.dp))
            Spacer(Modifier.width(12.dp))
            Text("出现严重症状？查看就医提示（不依赖网络）", color = Error, fontSize = 14.sp, fontWeight = FontWeight.Medium)
        }
        Spacer(Modifier.height(24.dp))

        SecondaryButton(
            text = "稍后重试（约 2 分钟后可用）",
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
            onClick = { onNavigate("A14") },
        )
        Spacer(Modifier.height(16.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onNavigate("A14") }
                .padding(12.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text("返回当前情况", color = Primary, fontSize = 14.sp)
        }
    }

    if (showEmergency) {
        AlertDialog(
            onDismissRequest = { showEmergency = false },
            title = { Text("紧急就医提示", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1) },
            text = { Text("如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。", fontSize = 14.sp, color = Text2) },
            confirmButton = {
                TextButton(onClick = { showEmergency = false }) { Text("我知道了", color = Primary, fontSize = 14.sp) }
            },
        )
    }
}

@Composable
private fun AvailabilityCard(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, desc: String) {
    YyjCard(
        modifier = Modifier
            .padding(horizontal = Dimens.pagePadding, vertical = 6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(PrimaryLight, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center,
            ) { Icon(icon, contentDescription = null, tint = Primary, modifier = Modifier.size(20.dp)) }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Medium, fontSize = 15.sp, color = Text1)
                Spacer(Modifier.height(2.dp))
                Text(desc, color = Text3, fontSize = 12.sp, lineHeight = 18.sp)
            }
            StatusTag("可用", TagType.OK)
        }
    }
}
