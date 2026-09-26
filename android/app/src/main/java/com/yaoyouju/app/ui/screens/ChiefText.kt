package com.yaoyouju.app.ui.screens

import com.yaoyouju.app.data.api.CareEvent
import com.yaoyouju.app.data.api.Episode

/** 关键变化确认答案（与 App 端 utils/chief.ts 同逻辑） */
internal data class ChangeAnswers(
    val change: String = "尚未确认",
    val redFlags: List<String> = emptyList(),
    val side: String = "尚未确认",
    val onset: String = "尚未确认",
)

internal fun parseChangeText(raw: String?): ChangeAnswers {
    if (raw.isNullOrEmpty()) return ChangeAnswers()
    fun get(key: String): String =
        Regex("$key：([^；]*)").find(raw)?.groupValues?.get(1)?.trim().orEmpty()
    val change = get("变化")
    val flags = get("红旗项")
    val side = get("侧别")
    val onset = get("开始日期")
    return ChangeAnswers(
        change = if (change.isNotEmpty() && change != "尚未确认") change else "尚未确认",
        redFlags = if (flags.isEmpty() || flags == "无") emptyList() else flags.split("、").filter { it.isNotEmpty() },
        side = if (side.isNotEmpty() && side != "尚未确认") side else "尚未确认",
        onset = if (onset.isNotEmpty() && onset != "尚未确认") onset else "尚未确认",
    )
}

private fun bowelStatus(change: ChangeAnswers): String = when {
    change.redFlags.any { it.contains("大小便") } -> "有（已确认）"
    change.redFlags.contains("以上都没有") -> "没有（已确认）"
    else -> "尚未确认"
}

private fun legStatus(log: CareEvent?, analysisUnknown: List<String>): String {
    val leg = log?.legChange
    if (leg != null && leg != "尚未确认") return "$leg（已确认）"
    if (analysisUnknown.any { it.contains("腿部无力") }) return "尚未回答（尚未确认）"
    return "尚未确认"
}

/** A07 “你描述”段落 */
internal fun buildSelfDescription(change: ChangeAnswers): String {
    if (change.change == "尚未确认" && change.side == "尚未确认") {
        return "你描述：尚未确认。可在“当前情况-生成分析”中回答 4 个关键问题后自动生成。"
    }
    val bowel = bowelStatus(change).removeSuffix("（已确认）")
    return "你描述：最近变化为“${change.change}”；主要在${change.side}；大小便/鞍区${bowel}；症状开始时间${change.onset}。"
}

/** A12 复诊摘要“主要症状与变化”段落 */
internal fun buildChiefText(
    change: ChangeAnswers,
    episode: Episode?,
    lastLog: CareEvent?,
    analysisUnknown: List<String>,
): String {
    val onset = if (change.onset != "尚未确认") {
        change.onset
    } else {
        episode?.onsetDate?.let { "约 ${it.take(7)}" } ?: "尚未确认"
    }
    val parts = mutableListOf<String>()
    parts += "目前腰痛开始时间：$onset"
    parts += "最近变化：${change.change}"
    parts += "主要在：${change.side}"
    val sit = lastLog?.sitMinutes
    parts += "每天能坐约：${if (sit != null) "$sit 分钟" else "尚未确认"}"
    val worry = lastLog?.topWorry
    parts += if (!worry.isNullOrEmpty()) "最近担心：$worry" else "最近担心的事：尚未记录"
    parts += "腿部无力：${legStatus(lastLog, analysisUnknown).replace("（已确认）", "").replace("（尚未确认）", "").replace("尚未回答", "尚未回答")}"
    parts += "大小便/鞍区：${bowelStatus(change).replace("（已确认）", "")}"
    return parts.joinToString("；")
}
