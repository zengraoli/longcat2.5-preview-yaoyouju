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
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.Cancel
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yaoyouju.app.data.TokenStore
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.BottomNavBar
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Warn
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

private fun maskPhone(phone: String?): String =
    if (phone != null && phone.length == 11) phone.replace(Regex("(\\d{3})\\d{4}(\\d{4})"), "$1****$2") else "尚未确认"

/** A17 我的：身份、数据与授权、分享与社区、服务信息、退出登录。 */
@Composable
fun MineScreen(
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val maskedPhone = remember { maskPhone(TokenStore.getPhone()) }
    var consentTime by remember { mutableStateOf("") }
    var dialog by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        runCatching { ApiClient.api.getConsent().unwrap() }.onSuccess { list ->
            val health = list.firstOrNull { it.scope == "健康信息处理" && it.granted }
            health?.grantedAt?.let { consentTime = it.take(10) }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Bg)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 96.dp),
    ) {
        // 头部
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("我的", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { Toast.makeText(context, "设置（演示）", Toast.LENGTH_SHORT).show() }) {
                Icon(Icons.Filled.Settings, contentDescription = "设置", tint = Text2)
            }
        }

        // 身份信息
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(com.yaoyouju.app.ui.theme.PrimaryLight, CircleShape),
                    contentAlignment = Alignment.Center,
                ) { Text("U", color = Primary, fontSize = 22.sp, fontWeight = FontWeight.SemiBold) }
                Spacer(Modifier.width(14.dp))
                Column {
                    Text(
                        "$maskedPhone（匿名内部标识 U-8F3K…，分析内容与身份信息分离存储）",
                        fontWeight = FontWeight.Medium,
                        fontSize = 14.sp,
                        color = Text1,
                        lineHeight = 21.sp,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text("手机号仅用于登录与找回，不进入分析内容。", color = Text3, fontSize = 12.sp)
                }
            }
        }
        Spacer(Modifier.height(14.dp))

        // 数据与授权
        MenuCard(title = "数据与授权") {
            MenuItem(
                icon = Icons.Outlined.Shield,
                title = "我的同意记录",
                desc = "健康信息处理：${if (consentTime.isNotEmpty()) "已同意 $consentTime" else "尚未确认"} · 分享/产品改进：未开启",
                trailing = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("可撤回", color = com.yaoyouju.app.ui.theme.Ok, fontSize = 12.sp,
                            modifier = Modifier
                                .background(com.yaoyouju.app.ui.theme.OkTint, RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("›", color = Text3, fontSize = 18.sp)
                    }
                },
                onClick = { Toast.makeText(context, "见上方“我的同意记录”", Toast.LENGTH_SHORT).show() },
            )
            MenuItem(
                icon = Icons.Outlined.Cancel,
                title = "撤回“处理健康信息”的同意",
                desc = "撤回后停止个性化分析，已审核科普与已导出摘要仍可用",
                onClick = { dialog = "revoke" },
            )
            MenuItem(
                icon = Icons.Outlined.Download,
                title = "导出我的全部数据",
                desc = "可读格式（PDF / JSON），包含病程、报告原文与分析版本",
                onClick = { Toast.makeText(context, "数据导出为演示功能", Toast.LENGTH_SHORT).show() },
            )
            MenuItem(
                icon = Icons.Outlined.Delete,
                title = "删除账户与数据",
                desc = "覆盖公开卡片、索引、向量、缓存与派生摘要",
                danger = true,
                onClick = { dialog = "delete" },
            )
        }
        Spacer(Modifier.height(14.dp))

        // 分享与社区
        MenuCard(title = "分享与社区") {
            MenuItem(
                icon = Icons.Outlined.Groups,
                title = "案例投稿（二期）",
                desc = "单独授权 · 预览 · 去除第三方信息 · 人工审核 · 可撤回",
                trailing = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("尚未开放", color = Text3, fontSize = 12.sp,
                            modifier = Modifier
                                .background(Bg, RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("›", color = Text3, fontSize = 18.sp)
                    }
                },
                onClick = {},
            )
        }
        Spacer(Modifier.height(14.dp))

        // 服务信息
        MenuCard(title = "服务信息") {
            MenuItem(
                icon = Icons.Outlined.Info,
                title = "服务范围与不做的事",
                desc = "不作诊断、不给手术判断、不调整药物、不生成严重程度总分",
                onClick = { dialog = "boundary" },
            )
            MenuItem(
                icon = Icons.Outlined.Warning,
                title = "紧急就医提示",
                desc = "无需登录，网络异常时也可查看",
                danger = true,
                onClick = { dialog = "emergency" },
            )
            MenuItem(
                icon = Icons.Outlined.Description,
                title = "临床审定与来源说明",
                desc = "谁审核了内容、依据是什么、如何举报错误",
                onClick = { dialog = "sources" },
            )
            MenuItem(
                icon = Icons.Filled.Settings,
                title = "版本信息",
                desc = "App v0.1.0 · 分析模型 M-2609 · 内容库 2026-09",
                onClick = { dialog = "version" },
            )
        }

        // 退出登录
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding)
                .height(48.dp)
                .background(Surface, RoundedCornerShape(10.dp))
                .clickable { dialog = "logout" },
            contentAlignment = Alignment.Center,
        ) {
            Text("退出登录", fontSize = 16.sp, color = Text1)
        }
        Spacer(Modifier.height(14.dp))

        AlertBar(
            text = "删除会覆盖公开卡片、搜索索引、向量、缓存和派生摘要；备份与依法需要保留的信息按政策管理，不承诺瞬时全网删除。",
            type = AlertType.WARN,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        BottomNavBar(currentRoute = "A17", onTabSelected = onNavigate)
    }

    when (dialog) {
        "revoke" -> ConfirmDialog(
            title = "撤回同意",
            content = "撤回后停止个性化分析，已审核科普与已导出摘要仍可用。确定撤回？",
            confirmText = "撤回",
            onConfirm = {
                dialog = null
                scope.launch {
                    runCatching { ApiClient.api.revokeConsent(mapOf("scope" to "健康信息处理")).unwrap() }
                        .onSuccess { Toast.makeText(context, "已撤回授权", Toast.LENGTH_SHORT).show() }
                        .onFailure { Toast.makeText(context, it.message ?: "撤回失败", Toast.LENGTH_SHORT).show() }
                }
            },
            onDismiss = { dialog = null },
        )
        "delete" -> ConfirmDialog(
            title = "确认删除",
            content = "此操作将删除你的所有数据，且不可恢复。确定继续吗？",
            confirmText = "删除",
            onConfirm = {
                dialog = null
                Toast.makeText(context, "演示环境未实际删除", Toast.LENGTH_SHORT).show()
            },
            onDismiss = { dialog = null },
        )
        "emergency" -> InfoDialog(
            title = "紧急就医提示",
            content = "如果您出现大小便失禁、下肢无力、剧烈疼痛等症状，请立即拨打 120 或前往最近的医院急诊。",
            onDismiss = { dialog = null },
        )
        "boundary" -> InfoDialog(
            title = "服务范围与不做的事",
            content = "本产品不作诊断、不给手术判断、不调整药物、不生成严重程度总分。",
            onDismiss = { dialog = null },
        )
        "sources" -> InfoDialog(
            title = "临床审定与来源说明",
            content = "内容由临床审核人员审定；每条解释带来源与版本；错误可通过“反馈与举报”提交。",
            onDismiss = { dialog = null },
        )
        "version" -> InfoDialog(
            title = "版本信息",
            content = "App v0.1.0 · 分析模型 M-2609 · 内容库 2026-09",
            onDismiss = { dialog = null },
        )
        "logout" -> ConfirmDialog(
            title = "退出登录",
            content = "确定退出当前账户？",
            confirmText = "退出",
            onConfirm = {
                dialog = null
                TokenStore.clear()
                onLogout()
            },
            onDismiss = { dialog = null },
        )
    }
}

@Composable
private fun MenuCard(title: String, content: @Composable () -> Unit) {
    YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
        Text(title, color = Text3, fontSize = 13.sp)
        Spacer(Modifier.height(8.dp))
        content()
    }
}

@Composable
private fun MenuItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    desc: String,
    danger: Boolean = false,
    trailing: (@Composable () -> Unit)? = null,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = if (danger) Error else Text2,
            modifier = Modifier.size(20.dp),
        )
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Medium, fontSize = 15.sp, color = if (danger) Error else Text1)
            Spacer(Modifier.height(3.dp))
            Text(desc, color = Text3, fontSize = 12.sp, lineHeight = 18.sp)
        }
        trailing?.invoke()
    }
}

@Composable
private fun ConfirmDialog(
    title: String,
    content: String,
    confirmText: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1) },
        text = { Text(content, fontSize = 14.sp, color = Text2) },
        confirmButton = {
            TextButton(onClick = onConfirm) { Text(confirmText, color = Error, fontSize = 14.sp) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("取消", color = Text2, fontSize = 14.sp) }
        },
    )
}

@Composable
private fun InfoDialog(
    title: String,
    content: String,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1) },
        text = { Text(content, fontSize = 14.sp, color = Text2) },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("我知道了", color = Primary, fontSize = 14.sp) }
        },
    )
}
