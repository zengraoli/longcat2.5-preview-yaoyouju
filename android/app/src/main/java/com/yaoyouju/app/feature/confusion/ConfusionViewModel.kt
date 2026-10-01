package com.yaoyouju.app.feature.confusion

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.ViewModel
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.AppIcons

/** 主要困惑选项（文案与设计稿 A04 一致） */
data class ConfusionOption(
    val key: String,
    val title: String,
    val desc: String,
    val icon: ImageVector,
)

val CONFUSION_OPTIONS = listOf(
    ConfusionOption("report", "报告术语", "看懂报告里写的是什么、哪些结论不能得出", AppIcons.Report),
    ConfusionOption("course", "病程变化", "这段时间的变化意味着什么、哪些值得记录", AppIcons.Course),
    ConfusionOption("followup", "复诊准备", "复诊时该问什么、带什么、怎么描述", AppIcons.Followup),
    ConfusionOption("life", "生活影响", "日常活动、工作与睡眠要注意什么", AppIcons.Life),
)

val FORMAT_OPTIONS = listOf("简短要点", "详细说明", "带图示视频", "先看原文对照")

data class ConfusionUiState(
    val selected: String = "report",
    val formats: List<String> = listOf("简短要点", "带图示视频"),
)

class ConfusionViewModel : ViewModel() {
    var state by mutableStateOf(ConfusionUiState())
        private set

    fun select(key: String) {
        state = state.copy(selected = key)
        CONFUSION_OPTIONS.firstOrNull { it.key == key }?.let { option ->
            com.yaoyouju.app.AppGraph.appState.selectedConfusions = listOf(option.title)
        }
    }

    fun toggleFormat(option: String) {
        val list = state.formats.toMutableList()
        if (list.contains(option)) list.remove(option) else list.add(option)
        state = state.copy(formats = list)
    }

    /**
     * 主要困惑与解释方式只保存在会话状态（select 时已写入），供分析与核对页使用；
     * 不再写成一条“症状”病程事件——否则它会出现在复诊摘要“当前情况”与首页待确认列表里，
     * 让用户误以为这是自己报告的症状。
     */
    fun proceed(onDone: () -> Unit) {
        onDone()
    }
}
