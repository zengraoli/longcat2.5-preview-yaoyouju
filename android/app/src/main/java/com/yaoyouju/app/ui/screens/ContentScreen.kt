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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.yaoyouju.app.data.ContentPicker
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.data.api.ContentItem
import com.yaoyouju.app.data.api.unwrap
import com.yaoyouju.app.ui.components.AlertBar
import com.yaoyouju.app.ui.components.AlertType
import com.yaoyouju.app.ui.components.BottomNavBar
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Error
import com.yaoyouju.app.ui.theme.ErrorTint
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3
import com.yaoyouju.app.ui.theme.Warn
import com.yaoyouju.app.ui.theme.WarnTint

private val FILTERS = listOf("全部", "报告术语", "节段位置", "医生会观察什么", "信息来源怎么看", "生活影响")

/** A13 审核内容库：分类条 + 推荐 + 全部内容，点击进入视频详情。 */
@Composable
fun ContentScreen(
    onBack: () -> Unit,
    onNavigate: (String) -> Unit,
) {
    val context = LocalContext.current
    var items by remember { mutableStateOf<List<ContentItem>>(emptyList()) }
    var activeFilter by remember { mutableStateOf("全部") }

    LaunchedEffect(Unit) {
        runCatching { ApiClient.api.getPublishedContents().unwrap() }
            .onSuccess { items = it }
    }

    fun openVideo(item: ContentItem) {
        ContentPicker.selectedId = item.id
        onNavigate("A15")
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
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "返回")
            }
            Text("审核内容库", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { Toast.makeText(context, "搜索（演示）", Toast.LENGTH_SHORT).show() }) {
                Icon(Icons.Filled.Search, contentDescription = "搜索", tint = Text2)
            }
        }

        // 分类条（与 App 端一致：仅切换选中态，不过滤）
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            FILTERS.forEach { f ->
                val selected = activeFilter == f
                Box(
                    modifier = Modifier
                        .height(34.dp)
                        .background(if (selected) Primary else Color.Transparent, RoundedCornerShape(17.dp))
                        .clickable { activeFilter = f }
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        f,
                        color = if (selected) Color.White else Text2,
                        fontSize = 13.sp,
                        fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
                    )
                }
            }
        }
        Spacer(Modifier.height(Dimens.gapL))

        AlertBar(
            text = "这里的内容都经过临床审定，附字幕与文字替代。示意图不是你的真实病变，不能据此判断本人病因。",
            type = AlertType.INFO,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(Dimens.gapL))

        // 为你推荐
        Text(
            "为你推荐（原因：你的报告提到 L5/S1、硬膜囊受压）",
            fontSize = 14.sp,
            color = Text1,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(10.dp))
        items.firstOrNull()?.let { recommend ->
            YyjCard(
                modifier = Modifier
                    .padding(horizontal = Dimens.pagePadding)
                    .clickable { openVideo(recommend) },
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ContentThumb(item = recommend)
                    Spacer(Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(recommend.title, fontWeight = FontWeight.Medium, fontSize = 15.sp, color = Text1)
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            StatusTag("已审核 v1", TagType.OK)
                            StatusTag("适用：${scopeLabel(recommend.applicableScope)}", TagType.MUTED)
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(Dimens.gapL))

        Text(
            "全部内容（${items.size} / 12）",
            fontSize = 14.sp,
            color = Text1,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        Spacer(Modifier.height(10.dp))
        items.forEach { item ->
            val dimmed = item.currentStatus == "已撤回或已下线"
            YyjCard(
                modifier = Modifier
                    .padding(horizontal = Dimens.pagePadding, vertical = 6.dp)
                    .clickable { openVideo(item) },
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ContentThumb(item = item)
                    Spacer(Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            item.title,
                            fontWeight = FontWeight.Medium,
                            fontSize = 15.sp,
                            color = if (dimmed) Text3 else Text1,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            if (item.type == "视频") "视频 · 2:10 · 字幕" else "图文 · 3 分钟阅读",
                            color = Text3,
           
                            fontSize = 12.sp,
                        )
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            val statusType = when (item.currentStatus) {
                                "已发布" -> TagType.OK
                                "更正中" -> TagType.ERROR
                                else -> TagType.WARN
                            }
                            StatusTag(statusLabel(item.currentStatus), statusType)
                            StatusTag("适用：${scopeLabel(item.applicableScope)}", TagType.MUTED)
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(Dimens.gapL))

        AlertBar(
            text = "本库不包含实时生成的个性化查体或训练处方；康复动作内容待专业设计与审定后再加入。",
            type = AlertType.WARN,
            modifier = Modifier.padding(horizontal = Dimens.pagePadding),
        )
        BottomNavBar(currentRoute = "A13", onTabSelected = onNavigate)
    }
}

@Composable
private fun ContentThumb(item: ContentItem) {
    Box(
        modifier = Modifier
            .size(width = 56.dp, height = 42.dp)
            .background(Color(0xFFDDE5EA), RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            if (item.type == "视频") Icons.Filled.PlayArrow else Icons.Filled.Image,
            contentDescription = null,
            tint = Primary,
            modifier = Modifier.size(22.dp),
        )
    }
}

private fun statusLabel(status: String): String = when (status) {
    "已发布" -> "已审核 v1"
    else -> status
}

/** 适用范围归类（与 App 端 scopeLabel 同逻辑） */
private fun scopeLabel(scope: String?): String {
    if (scope.isNullOrEmpty()) return "报告术语"
    if (scope.contains("L5/S1") || scope.contains("节段")) return "节段位置"
    if (scope.contains("信息来源")) return "信息来源"
    if (scope.contains("生活") || scope.contains("日常")) return "生活影响"
    if (scope.contains("复诊")) return "医生会观察什么"
    return "报告术语"
}
