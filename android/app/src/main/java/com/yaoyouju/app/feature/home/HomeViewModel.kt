package com.yaoyouju.app.feature.home

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.EmergencyTips
import com.yaoyouju.app.core.components.LocalSafetyTips
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AnalysisResult
import com.yaoyouju.app.data.CareEvent
import com.yaoyouju.app.data.ContentItem
import com.yaoyouju.app.data.Episode
import kotlinx.coroutines.launch

data class HomeUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val episode: Episode? = null,
    val subtitle: String = "本次发作",
    val pendingItems: List<String> = emptyList(),
    val pendingDismissed: Boolean = false,
    val analysis: AnalysisResult? = null,
    val recommended: List<ContentItem> = emptyList(),
    val followupQuestionCount: Int = 0,
    val followupDate: String = "",
    val daysUntil: Long = 0,
    val maskedPhone: String? = null,
    val showEmergency: Boolean = false,
    val emergency: EmergencyTips = LocalSafetyTips.tips(),
)

class HomeViewModel : ViewModel() {

    var state by mutableStateOf(HomeUiState())
        private set

    fun dismissPending() {
        state = state.copy(pendingDismissed = true)
    }

    fun setShowEmergency(show: Boolean) {
        state = state.copy(showEmergency = show)
    }

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            val episodesResult = runCatching { apiCall { AppGraph.api.listEpisodes() } }
            val failure = episodesResult.exceptionOrNull()
            if (failure is ApiException && failure.isOffline) {
                AppGraph.appState.fallbackErrorCode = "NET-5002"
                state = state.copy(loading = false, error = failure.message)
                return@launch
            }
            val episodes = episodesResult.getOrNull().orEmpty()
            val episode = episodes.firstOrNull()
            AppGraph.appState.currentEpisode = episode

            var analysis: AnalysisResult? = null
            var timeline: com.yaoyouju.app.data.TimelineResult? = null
            val pending = mutableListOf<String>()
            var questionCount = 0
            var followupDate = ""
            var daysUntil = 0L

            if (episode != null) {
                analysis = runCatching { apiCall { AppGraph.api.getLatestAnalysis(episode.id) } }.getOrNull()
                AppGraph.appState.latestAnalysis = analysis

                questionCount = runCatching { apiCall { AppGraph.api.previewSummary(episode.id) } }
                    .getOrNull()?.questions?.size ?: 0

                timeline = runCatching { apiCall { AppGraph.api.timeline(episode.id) } }.getOrNull()
                timeline?.events?.forEach { event ->
                    if (event.verifyStatus == "尚未确认" && !event.rawText.isNullOrBlank()) {
                        pending += event.rawText.take(30) + if (event.rawText.length > 30) "…" else ""
                    }
                }
                timeline?.symptomLogs?.forEach { log ->
                    if (log.legChange?.raw == "尚未确认") pending += "今天是否有腿部麻木或无力：尚未确认"
                    if (log.plannedActivityDone?.raw == "尚未确认") pending += "能否完成原本计划的活动：尚未确认"
                }
                followupDate = parseFollowupDate(timeline?.events.orEmpty()) ?: ""
                if (followupDate.isNotBlank()) {
                    daysUntil = maxOf(0L, BeijingTime.daysUntil(followupDate))
                }
            }

            val recommended = runCatching { apiCall { AppGraph.api.listPublishedContents() } }
                .getOrNull().orEmpty().take(2)

            val emergency = runCatching { apiCall { AppGraph.api.getSafetyTips() } }
                .getOrNull()?.let { EmergencyTips(it.title, it.redFlags, it.note) } ?: state.emergency

            state = state.copy(
                loading = false,
                episode = episode,
                subtitle = buildSubtitle(episode, timeline?.events.orEmpty(), timeline?.symptomLogs.orEmpty()),
                analysis = analysis,
                pendingItems = pending,
                followupQuestionCount = questionCount,
                followupDate = followupDate,
                daysUntil = daysUntil,
                recommended = recommended,
                maskedPhone = AppGraph.session.maskedPhone,
                emergency = emergency,
            )
        }
    }

    /** 副标题：本次发作 · 第 N 周 · 上次记录：昨天 */
    private fun buildSubtitle(
        episode: Episode?,
        events: List<CareEvent>,
        logs: List<com.yaoyouju.app.data.SymptomLog>,
    ): String {
        if (episode == null) return "还没有病程"
        val parts = mutableListOf("本次发作")
        val onset = episode.onsetDate
        if (!onset.isNullOrBlank()) {
            val start = runCatching { java.time.LocalDate.parse(onset.take(10)) }.getOrNull()
            if (start != null) {
                val today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Shanghai"))
                val weeks = java.time.temporal.ChronoUnit.WEEKS.between(start, today) + 1
                if (weeks > 0) parts += "第 $weeks 周"
            }
        }
        val lastAt = (events.map { it.occurredAt } + logs.mapNotNull { it.occurredAt }).maxOrNull()
        if (!lastAt.isNullOrBlank()) {
            val relative = BeijingTime.relativeDay(lastAt)
            if (relative.isNotBlank()) parts += "上次记录：$relative"
        }
        return parts.joinToString(" · ")
    }

    /**
     * 从医嘱中解析计划复诊日期：优先用医嘱里写的复诊时间（显式日期），
     * 其次按“N 周后复查 / N 个月后复查”从医嘱日期推算。
     */
    private fun parseFollowupDate(events: List<CareEvent>): String? {
        for (event in events) {
            if (event.eventType != "医嘱" || event.rawText.isNullOrBlank()) continue
            val text = event.rawText
            // 1) 显式日期：2026-11-08 复诊 / 11月8日复诊 / 2026年11月8日
            explicitFollowupDate(text)?.let { return it }
            // 2) N 周后复查：按医嘱本身的日期 + N 周推算，而不是“今天 + N 周”
            val weeks = Regex("(\\d+)\\s*周后复查").find(text)?.groupValues?.get(1)?.toIntOrNull()
            if (weeks != null) {
                return BeijingTime.plusDaysFrom(event.occurredAt, weeks * 7L)
            }
            // 3) N 个月后复查
            val months = Regex("(\\d+)\\s*个月后复查").find(text)?.groupValues?.get(1)?.toIntOrNull()
            if (months != null) {
                val base = runCatching {
                    java.time.Instant.parse(event.occurredAt.let {
                        if (it.length == 10) "${it}T00:00:00Z" else it
                    }).atZone(java.time.ZoneId.of("Asia/Shanghai")).toLocalDate()
                }.getOrElse { java.time.LocalDate.now(java.time.ZoneId.of("Asia/Shanghai")) }
                return base.plusMonths(months.toLong()).toString()
            }
        }
        return null
    }

    /** 医嘱文本里的显式复诊日期（yyyy-MM-dd 或 M月d日 / yyyy年M月d日） */
    private fun explicitFollowupDate(text: String): String? {
        val iso = Regex("(\\d{4})-(\\d{1,2})-(\\d{1,2})").find(text)
        if (iso != null) {
            val (y, m, d) = iso.destructured
            return runCatching {
                java.time.LocalDate.of(y.toInt(), m.toInt(), d.toInt()).toString()
            }.getOrNull()
        }
        val cn = Regex("(\\d{4})年(\\d{1,2})月(\\d{1,2})日|(\\d{1,2})月(\\d{1,2})日").find(text)
        if (cn != null) {
            val groups = cn.groupValues
            return if (groups[1].isNotBlank()) {
                runCatching {
                    java.time.LocalDate.of(groups[1].toInt(), groups[2].toInt(), groups[3].toInt()).toString()
                }.getOrNull()
            } else {
                // 只有月日：年份取医嘱日期所在年（若已过则取明年）
                val today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Shanghai"))
                runCatching {
                    val candidate = java.time.LocalDate.of(today.year, groups[4].toInt(), groups[5].toInt())
                    if (candidate.isBefore(today)) candidate.plusYears(1) else candidate
                }.getOrNull()?.toString()
            }
        }
        return null
    }
}
