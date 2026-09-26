package com.yaoyouju.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import com.yaoyouju.app.ui.components.PrimaryButton
import com.yaoyouju.app.ui.components.SelectableChip
import com.yaoyouju.app.ui.components.StatusTag
import com.yaoyouju.app.ui.components.TagType
import com.yaoyouju.app.ui.components.YyjCard
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.Border
import com.yaoyouju.app.ui.theme.Dimens
import com.yaoyouju.app.ui.theme.Primary
import com.yaoyouju.app.ui.theme.PrimaryLight
import com.yaoyouju.app.ui.theme.Surface
import com.yaoyouju.app.ui.theme.Text1
import com.yaoyouju.app.ui.theme.Text2
import com.yaoyouju.app.ui.theme.Text3

private const val SUBTITLE_TEXT =
    "脊柱由一节节椎骨组成，腰椎有 5 节，从上到下叫 L1 到 L5；L5 下面是骶骨 S1。两节骨头之间的软骨叫椎间盘，“L5/S1”就是第 5 腰椎和第 1 骶椎之间的那个椎间盘……"

/** A15 视频详情：示意播放器 + 适用范围 + 文字替代 + 复述与反馈。 */
@Composable
fun VideoScreen(
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    var content by remember { mutableStateOf<ContentItem?>(null) }
    var reasonText by remember { mutableStateOf("为什么推荐给你：你的报告中提到了与该内容相关的术语。示意图不是你的真实病变，不能据此判断本人病因。") }
    var playing by remember { mutableStateOf(false) }
    var subtitleOpen by remember { mutableStateOf(true) }
    var retell by remember { mutableStateOf("") }
    var feedback by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        runCatching { ApiClient.api.getEpisodes().unwrap() }.onSuccess { episodes ->
            val episodeId = episodes.firstOrNull()?.id ?: return@onSuccess
            runCatching { ApiClient.api.getReportsByEpisode(episodeId).unwrap() }
                .onSuccess { reports ->
                    val date = reports.firstOrNull()?.get("report_date").orEmpty()
                    if (date.isNotEmpty()) {
                        reasonText = "为什么推荐给你：你的报告（$date）提到了与该内容相关的术语。示意图不是你的真实病变，不能据此判断本人病因。"
                    }
                }
        }
        runCatching { ApiClient.api.getPublishedContents().unwrap() }
            .onSuccess { list ->
                content = list.firstOrNull { it.id == ContentPicker.selectedId } ?: list.firstOrNull()
            }
    }

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
            Text("审核视频", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Text1)
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { Toast.makeText(context, "分享（演示）", Toast.LENGTH_SHORT).show() }) {
                Icon(Icons.Filled.Share, contentDescription = "分享", tint = Text2)
            }
        }

        // 播放区
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimens.pagePadding)
                .background(Color(0xFF2B3440), RoundedCornerShape(12.dp)),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .background(Surface, CircleShape)
                        .clickable { playing = !playing },
                    contentAlignment = Alignment.Center,
                ) {
                    if (!playing) {
                        Icon(Icons.Filled.PlayArrow, contentDescription = "播放", tint = Primary, modifier = Modifier.size(32.dp))
                    } else {
                        Text("暂停", color = Primary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Text("示意动画：L5/S1 节段位置（非本人影像）", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text("0:00 / 2:10", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(3.dp)
                        .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(2.dp)),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(if (playing) 0.3f else 0f)
                            .height(3.dp)
                            .background(Surface, RoundedCornerShape(2.dp)),
                    )
                }
                Text(
                    "CC 开",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 11.sp,
                    modifier = Modifier
                        .background(Color.Transparent)
                        .border(1.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp),
                )
            }
        }
        Spacer(Modifier.height(14.dp))

        // 标题与标签
        Column(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Text(content?.title ?: "腰椎节段位置：L5/S1 在哪里", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = Text1)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusTag("已审核 v2", TagType.OK)
                StatusTag("临床审定 · 2026-08", TagType.MUTED)
            }
            Spacer(Modifier.height(8.dp))
            Text("依据：指南 G-03 · 科普 #12", color = Text2, fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusTag("字幕", TagType.INFO)
                StatusTag("文字替代", TagType.INFO)
            }
        }
        Spacer(Modifier.height(Dimens.gapL))

        // 推荐理由
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Row(verticalAlignment = Alignment.Top) {
                Icon(Icons.Filled.PlayArrow, contentDescription = null, tint = Primary, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(10.dp))
                Text(reasonText, color = Text1, fontSize = 13.sp, lineHeight = 20.sp)
            }
        }
        Spacer(Modifier.height(14.dp))

        // 适用范围
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Text("适用范围", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.Top) {
                Text("适用", color = Text2, fontSize = 13.sp, modifier = Modifier.width(48.dp))
                Text(
                    content?.applicableScope ?: "想了解报告中“L5/S1”“节段”等术语的含义",
                    color = Text1,
                    fontSize = 14.sp,
                    lineHeight = 22.sp,
                )
            }
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.Top) {
                Text("不适用", color = Text2, fontSize = 13.sp, modifier = Modifier.width(48.dp))
                Text(
                    content?.notApplicable ?: "判断自己的突出程度、是否需要手术、康复动作选择",
                    color = Text1,
                    fontSize = 14.sp,
                    lineHeight = 22.sp,
                )
            }
        }
        Spacer(Modifier.height(14.dp))

        // 文字替代
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("文字替代（全文）", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1, modifier = Modifier.weight(1f))
                Text(
                    if (subtitleOpen) "收起" else "展开",
                    color = Text3,
                    fontSize = 13.sp,
                    modifier = Modifier.clickable { subtitleOpen = !subtitleOpen },
                )
            }
            if (subtitleOpen) {
                Spacer(Modifier.height(10.dp))
                Text(SUBTITLE_TEXT, color = Text1, fontSize = 14.sp, lineHeight = 26.sp)
            }
        }
        Spacer(Modifier.height(14.dp))

        // 看完复述
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Text("看完后，用一句话说说你理解了什么（可选）", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
            Spacer(Modifier.height(4.dp))
            Text("这用来检查视频有没有造成新的误解，不是考试，也不会影响你的分析结果。", color = Text3, fontSize = 12.sp)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = retell,
                onValueChange = { retell = it },
                placeholder = { Text("例如：L5/S1 是腰椎最下面那个椎间盘的位置…", color = Text3, fontSize = 14.sp) },
                singleLine = true,
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = Surface,
                    focusedContainerColor = Surface,
                    unfocusedBorderColor = Border,
                    focusedBorderColor = Primary,
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(12.dp))
            PrimaryButton(
                text = "提交",
                onClick = {
                    if (retell.trim().isEmpty()) {
                        Toast.makeText(context, "请填写复述内容", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "已提交，谢谢反馈", Toast.LENGTH_SHORT).show()
                        retell = ""
                    }
                },
                modifier = Modifier.width(100.dp),
            )
        }
        Spacer(Modifier.height(14.dp))

        // 反馈
        YyjCard(modifier = Modifier.padding(horizontal = Dimens.pagePadding)) {
            Text("这条内容对你有帮助吗？", fontWeight = FontWeight.Medium, fontSize = 16.sp, color = Text1)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("看懂了", "没看懂", "内容有误（举报）").forEach { opt ->
                    SelectableChip(text = opt, selected = feedback == opt, onClick = { feedback = opt })
                }
            }
        }
    }
}
