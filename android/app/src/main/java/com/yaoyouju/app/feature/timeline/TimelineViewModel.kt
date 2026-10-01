package com.yaoyouju.app.feature.timeline

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AddEventRequest
import com.yaoyouju.app.data.CareEvent
import com.yaoyouju.app.data.Episode
import com.yaoyouju.app.data.SymptomLog
import kotlinx.coroutines.launch

enum class TimelineTone { Ok, Info, Warn, Neutral }

data class TimelineItem(
    val id: String,
    val dateLabel: String,
    val typeLabel: String,
    val tone: TimelineTone,
    val text: String,
    val tags: List<String>,
    val eventId: String?,
    val filterKey: String,
)

data class ChartBar(val heightFraction: Float, val warn: Boolean)

data class TimelineUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val episode: Episode? = null,
    val onsetLabel: String = "尚未确认",
    val recordCount: Int = 0,
    val reportCount: Int = 0,
    val analysisCount: Int = 0,
    val questionCount: Int = 0,
    val chart: List<ChartBar> = emptyList(),
    val chartStart: String = "",
    val chartEnd: String = "",
    val items: List<TimelineItem> = emptyList(),
    val filter: String = "全部",
    val showFilter: Boolean = false,
    val showAdd: Boolean = false,
    val addTypeIndex: Int = 0,
    val addDate: String = "",
    val addText: String = "",
)

val TIMELINE_FILTERS = listOf("全部", "报告", "症状", "医嘱", "行动")
val EVENT_TYPES = listOf("症状", "报告", "医嘱", "行动", "结局")

class TimelineViewModel : ViewModel() {

    var state by mutableStateOf(TimelineUiState())
        private set

    fun toggleFilterPanel() {
        state = state.copy(showFilter = !state.showFilter)
    }

    fun selectFilter(filter: String) {
        state = state.copy(filter = filter)
    }

    fun setShowAdd(show: Boolean) {
        state = state.copy(showAdd = show, addDate = if (show && state.addDate.isBlank()) BeijingTime.today() else state.addDate)
    }

    fun setAddTypeIndex(index: Int) {
        state = state.copy(addTypeIndex = index)
    }

    fun setAddDate(date: String) {
        state = state.copy(addDate = date)
    }

    fun setAddText(text: String) {
        state = state.copy(addText = text)
    }

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            val episodesResult = runCatching { apiCall { AppGraph.api.listEpisodes() } }
            val failure = episodesResult.exceptionOrNull()
            if (failure is ApiException && failure.isOffline) {
                state = state.copy(loading = false, error = failure.message)
                return@launch
            }
            val episodes = episodesResult.getOrNull().orEmpty()
            val episode = episodes.firstOrNull()
            if (episode == null) {
                state = state.copy(loading = false)
                return@launch
            }
            AppGraph.appState.currentEpisode = episode
            val timeline = runCatching { apiCall { AppGraph.api.timeline(episode.id) } }.getOrNull()
            val events = timeline?.events.orEmpty()
            val logs = timeline?.symptomLogs.orEmpty()
            val analysis = runCatching { apiCall { AppGraph.api.getLatestAnalysis(episode.id) } }.getOrNull()
            val questions = runCatching { apiCall { AppGraph.api.previewSummary(episode.id) } }
                .getOrNull()?.questions?.size ?: 0

            state = state.copy(
                loading = false,
                episode = episode,
                onsetLabel = episode.onsetDate?.let { "$it（${episode.onsetCertainty}）" } ?: "尚未确认",
                recordCount = events.size,
                reportCount = events.count { it.eventType == "报告" },
                analysisCount = analysis?.version ?: 0,
                questionCount = questions,
                chart = buildChart(logs),
                chartStart = BeijingTime.plusDays(-13),
                chartEnd = BeijingTime.today(),
                items = buildItems(events, logs, analysis?.createdAt, analysis?.version ?: 0, analysis?.modelReleaseId.orEmpty()),
            )
        }
    }

    private fun buildChart(logs: List<SymptomLog>): List<ChartBar> {
        val days = (13 downTo 0).map { offset -> BeijingTime.plusDays(-offset.toLong()) }
        val minutesByDay = mutableMapOf<String, Int>()
        logs.forEach { log ->
            val day = BeijingTime.date(log.occurredAt)
            val minutes = log.sitMinutes?.raw?.toIntOrNull()
            if (minutes != null && day.isNotBlank()) minutesByDay[day] = minutes
        }
        // 没有任何有效记录时不画满 0 值柱子
        if (minutesByDay.isEmpty()) return emptyList()
        return days.map { day ->
            val minutes = minutesByDay[day]
            if (minutes == null) {
                ChartBar(0.04f, false)
            } else {
                ChartBar(minOf(1f, minutes / 90f).coerceAtLeast(0.06f), minutes < 15)
            }
        }
    }

    private fun buildItems(
        events: List<CareEvent>,
        logs: List<SymptomLog>,
        analysisCreatedAt: String?,
        analysisVersion: Int,
        modelReleaseId: String,
    ): List<TimelineItem> {
        val logByEventId = logs.associateBy { it.careEventId }
        val items = mutableListOf<TimelineItem>()

        if (analysisVersion > 0 && !analysisCreatedAt.isNullOrBlank()) {
            val reportDate = events.reversed().firstOrNull { it.eventType == "报告" }?.occurredAt?.let { BeijingTime.date(it) }
            val text = buildString {
                append("生成于模型 $modelReleaseId")
                if (reportDate != null) append("；使用报告 $reportDate")
                if (logs.isNotEmpty()) append(" 与 ${logs.size} 条症状记录。") else append("。")
            }
            items += TimelineItem(
                id = "analysis-$analysisVersion",
                dateLabel = dateLabel(analysisCreatedAt),
                typeLabel = "一页分析 v$analysisVersion",
                tone = TimelineTone.Info,
                text = text,
                tags = listOf("系统生成", "可查看当时版本"),
                eventId = null,
                filterKey = "分析",
            )
        }

        events.forEach { event ->
            val log = logByEventId[event.id]
            val answered = log != null && listOf(
                log.sitMinutes?.raw, log.plannedActivityDone?.raw, log.sleepImpact?.raw,
                log.topWorry?.raw, log.legChange?.raw, log.changeVsYesterday?.raw, log.activitiesDone?.raw,
            ).any { !it.isNullOrBlank() && it != "尚未确认" }
            val hasUnknown = log != null && listOf(
                log.legChange?.raw, log.plannedActivityDone?.raw, log.sitMinutes?.raw,
            ).any { it.isNullOrBlank() || it == "尚未确认" }
            items += TimelineItem(
                id = event.id,
                dateLabel = dateLabel(event.occurredAt),
                typeLabel = typeLabelOf(event.eventType),
                tone = when {
                    event.sourceType == "报告原文" -> TimelineTone.Info
                    event.eventType == "症状" && answered && !hasUnknown -> TimelineTone.Ok
                    event.verifyStatus == "尚未确认" && !(event.eventType == "症状" && answered) -> TimelineTone.Warn
                    else -> TimelineTone.Ok
                },
                text = eventText(event, log),
                tags = if (event.eventType == "症状" && log != null) {
                    listOf(event.sourceType, if (hasUnknown) "尚未确认" else "已确认")
                } else {
                    listOf(event.sourceType, event.verifyStatus)
                },
                eventId = event.id,
                filterKey = event.eventType,
            )
        }

        return items.sortedByDescending { it.dateLabel }
    }

    private fun dateLabel(iso: String): String {
        val date = BeijingTime.date(iso)
        val relative = BeijingTime.relativeDay(iso)
        return when {
            relative == "今天" -> "$date · 今天"
            relative == "昨天" -> "$date · 昨天"
            else -> date
        }
    }

    private fun typeLabelOf(eventType: String): String = when (eventType) {
        "症状" -> "症状记录"
        "报告" -> "检查报告"
        "医嘱" -> "医生建议"
        "行动" -> "采取行动"
        "结局" -> "结局"
        else -> eventType
    }

    private fun toneOf(event: CareEvent): TimelineTone = when {
        event.sourceType == "报告原文" -> TimelineTone.Info
        event.verifyStatus == "尚未确认" -> TimelineTone.Warn
        else -> TimelineTone.Ok
    }

    private fun eventText(event: CareEvent, log: SymptomLog?): String {
        if (event.eventType == "症状" && log != null) {
            val parts = mutableListOf<String>()
            log.changeVsYesterday?.raw?.takeIf { it != "尚未确认" }?.let { parts += "与昨天相比：$it" }
            log.topWorry?.raw?.takeIf { it != "尚未确认" }?.let { parts += "最担心：$it" }
            log.legChange?.raw?.takeIf { it != "尚未确认" }?.let { parts += "腿部麻木或无力：$it" }
            log.plannedActivityDone?.raw?.takeIf { it != "尚未确认" }?.let { parts += "计划活动：$it" }
            log.sitMinutes?.raw?.takeIf { it != "尚未确认" }?.let { parts += "能坐约 $it 分钟" }
            log.sleepImpact?.raw?.takeIf { it != "尚未确认" }?.let { parts += "睡眠影响：$it/3" }
            log.activitiesDone?.raw?.takeIf { it != "尚未确认" }?.let { parts += "今天做了：$it" }
            if (parts.isNotEmpty()) return parts.joinToString("；")
        }
        return event.rawText ?: "（无原文）"
    }

    fun addEvent(onRedFlag: () -> Unit) {
        val episodeId = state.episode?.id ?: return
        val text = state.addText.trim()
        if (text.isEmpty()) {
            AppGraph.appState.toast("请填写记录内容")
            return
        }
        viewModelScope.launch {
            try {
                val type = EVENT_TYPES[state.addTypeIndex]
                apiCall {
                    AppGraph.api.addEvent(
                        episodeId,
                        AddEventRequest(
                            eventType = type,
                            occurredAt = "${state.addDate}T12:00:00+08:00",
                            sourceType = if (type == "报告") "报告原文" else "自述",
                            rawText = text,
                        ),
                    )
                }
                state = state.copy(showAdd = false, addText = "")
                AppGraph.appState.toast("已保存")
                load()
                val safety = runCatching { apiCall { AppGraph.api.checkSafety(mapOf("text" to text, "source" to "event")) } }
                    .getOrNull()
                if (safety != null && !safety.passed && safety.redFlags.isNotEmpty()) {
                    AppGraph.appState.redFlagSelected = safety.redFlags.map { it.name }
                    onRedFlag()
                }
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun deleteEvent(eventId: String) {
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.deleteEvent(eventId) }
                AppGraph.appState.toast("已删除")
                load()
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }
}
