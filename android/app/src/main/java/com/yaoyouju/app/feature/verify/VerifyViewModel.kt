package com.yaoyouju.app.feature.verify

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
import com.yaoyouju.app.data.CorrectEventRequest
import com.yaoyouju.app.data.CreateAnalysisRequest
import kotlinx.coroutines.launch

data class VerifyTermRow(val label: String, val text: String, val pos: String)

data class VerifyRow(val label: String, val text: String, val status: String)

data class VerifyUiState(
    val loading: Boolean = true,
    val reportDate: String = "",
    val reportRawText: String = "",
    val terms: List<VerifyTermRow> = emptyList(),
    val conflict: String = "",
    val selfSide: String = "",
    val reportEventId: String? = null,
    val symptoms: List<VerifyRow> = emptyList(),
    val advices: List<VerifyRow> = emptyList(),
    val showCorrectDialog: Boolean = false,
    val correctText: String = "",
    val submitting: Boolean = false,
)

class VerifyViewModel : ViewModel() {

    var state by mutableStateOf(VerifyUiState())
        private set

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true)
            val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
            val episode = episodes.firstOrNull()
            if (episode == null) {
                state = state.copy(loading = false)
                return@launch
            }
            AppGraph.appState.currentEpisode = episode
            val timeline = runCatching { apiCall { AppGraph.api.timeline(episode.id) } }.getOrNull()
            val events = timeline?.events.orEmpty()

            val reportEvent = events.reversed().firstOrNull { it.eventType == "报告" && !it.rawText.isNullOrBlank() }
            val rawText = reportEvent?.rawText.orEmpty()

            val symptoms = buildSymptomRows(events, timeline?.symptomLogs.orEmpty())

            val advices = events.filter { it.eventType == "医嘱" && !it.rawText.isNullOrBlank() }
                .map { VerifyRow("医嘱", it.rawText.orEmpty(), it.verifyStatus) }

            val reportSide = extractSide(rawText)
            val selfText = events.filter { it.sourceType == "自述" && !it.rawText.isNullOrBlank() }
                .joinToString("，") { it.rawText.orEmpty() }
            val selfSide = extractSide(selfText)
            val conflict = if (
                reportSide != null && selfSide != null &&
                reportSide != selfSide && reportSide != "双侧" && selfSide != "双侧"
            ) {
                "报告写的是「$reportSide」，你的自述是「$selfSide」"
            } else {
                ""
            }

            state = state.copy(
                loading = false,
                reportDate = reportEvent?.occurredAt?.let { BeijingTime.date(it) }.orEmpty(),
                reportRawText = rawText,
                terms = extractTerms(rawText),
                conflict = conflict,
                selfSide = selfSide.orEmpty(),
                reportEventId = reportEvent?.id,
                symptoms = symptoms,
                advices = advices,
            )
        }
    }

    fun setShowCorrectDialog(show: Boolean) {
        state = state.copy(showCorrectDialog = show, correctText = if (show) state.reportRawText else state.correctText)
    }

    fun setCorrectText(text: String) {
        state = state.copy(correctText = text)
    }

    fun saveCorrection() {
        val id = state.reportEventId ?: return
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.correctEvent(id, CorrectEventRequest(rawText = state.correctText)) }
                state = state.copy(
                    reportRawText = state.correctText,
                    terms = extractTerms(state.correctText),
                    showCorrectDialog = false,
                )
                AppGraph.appState.toast("已保存")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun resolveConflict(choice: String) {
        val id = state.reportEventId ?: return
        val episodeId = AppGraph.appState.episodeId ?: return
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.correctEvent(id, CorrectEventRequest(verifyStatus = "已确认")) }
                apiCall {
                    AppGraph.api.addEvent(
                        episodeId,
                        AddEventRequest(
                            eventType = "行动",
                            occurredAt = BeijingTime.nowIso(),
                            sourceType = "自述",
                            rawText = "侧别确认：$choice（报告与自述不一致，已按本人确认）",
                            verifyStatus = "已确认",
                        ),
                    )
                }
                state = state.copy(conflict = "")
                AppGraph.appState.toast("已记录：$choice")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun generateAnalysis(onTask: (String) -> Unit, onRedFlag: () -> Unit) {
        val episodeId = AppGraph.appState.episodeId ?: return
        viewModelScope.launch {
            state = state.copy(submitting = true)
            try {
                // 只把阳性/不确定的描述交给安全规则：阴性回答（“没有/无”）不应被当成红旗
                val negatives = setOf("尚未确认", "没有", "无", "未回答", "报告未提及")
                val text = (
                    state.symptoms.filter { it.text.isNotBlank() && it.text !in negatives }.map { "${it.label}${it.text}" } +
                        state.advices.filter { it.text.isNotBlank() && it.text !in negatives }.map { it.text }
                    ).joinToString("，")
                val result = apiCall {
                    AppGraph.api.createAnalysis(CreateAnalysisRequest(episodeId, text.ifBlank { null }))
                }
                if (result == null) {
                    AppGraph.appState.toast("生成失败，请稍后重试")
                    return@launch
                }
                AppGraph.appState.lastSafety = result.safety
                val taskId = result.taskId
                if (result.status == "blocked" || taskId == null) {
                    AppGraph.appState.redFlagSelected = result.safety.redFlags.map { it.name }
                    onRedFlag()
                    return@launch
                }
                onTask(taskId)
            } catch (e: ApiException) {
                if (e.isRedFlag || e.isOutOfScope) {
                    onRedFlag()
                } else {
                    AppGraph.appState.toast(e.message)
                }
            } finally {
                state = state.copy(submitting = false)
            }
        }
    }

    /** 把已录入的信息整理成设计稿 A06 里的“症状与变化”结构化行 */
    private fun buildSymptomRows(
        events: List<com.yaoyouju.app.data.CareEvent>,
        logs: List<com.yaoyouju.app.data.SymptomLog>,
    ): List<VerifyRow> {
        val rows = mutableListOf<VerifyRow>()
        val confirmText = events.lastOrNull {
            it.eventType == "症状" && it.rawText?.contains("当前关键变化确认") == true
        }?.rawText.orEmpty()
        fun part(key: String): String? =
            Regex("$key：([^；]+)").find(confirmText)?.groupValues?.get(1)?.trim()?.takeIf { it.isNotBlank() }

        if (confirmText.contains("开始日期记不清")) {
            rows += VerifyRow("症状开始", "记不清具体日期", "尚未确认")
        } else {
            (part("开始时间") ?: part("开始日期"))?.let { rows += VerifyRow("症状开始", it, "尚未确认") }
        }
        part("与上次相比")?.let { rows += VerifyRow("最近变化", it, "已确认") }
        part("疼痛涉及")?.let { rows += VerifyRow("疼痛侧别", it, "已确认") }

        val leg = logs.lastOrNull { it.legChange != null }?.legChange?.raw
        if (!leg.isNullOrBlank()) {
            rows += if (leg == "尚未确认") {
                VerifyRow("腿部无力", "尚未回答", "尚未确认")
            } else {
                VerifyRow("腿部无力", leg, "已确认")
            }
        }

        part("红旗项")?.let { flags ->
            val hasBowel = flags.contains("大小便") || flags.contains("鞍区")
            rows += VerifyRow("大小便/鞍区", if (hasBowel) "有" else "没有", "已确认")
        }

        AppGraph.appState.selectedConfusions.lastOrNull()?.let { rows += VerifyRow("主要困惑", it, "已确认") }

        // 没有结构化信息时，退回展示原始自述
        if (rows.isEmpty()) {
            events.filter { it.eventType == "症状" && !it.rawText.isNullOrBlank() }
                .forEach { rows += VerifyRow("症状", it.rawText.orEmpty(), it.verifyStatus) }
        }
        return rows
    }

    /** 从原文中提取关键术语与原文位置 */
    private fun extractTerms(rawText: String): List<VerifyTermRow> {
        if (rawText.isBlank()) return emptyList()
        val lines = rawText.split("\n")
        fun lineOf(term: String): Int {
            val index = lines.indexOfFirst { it.contains(term) }
            return if (index >= 0) index + 1 else 1
        }
        val segments = rawText
            .split(Regex("[；;。\\n]"))
            .flatMap { it.split(Regex("[，,]")) }
            .map { it.trim() }
            .filter { it.isNotEmpty() }
        fun clauseOf(term: String): String = segments.firstOrNull { it.contains(term) } ?: term

        val rows = mutableListOf<VerifyTermRow>()
        listOf("L5/S1", "硬膜囊受压").forEachIndexed { index, term ->
            if (rawText.contains(term)) {
                rows += VerifyTermRow(
                    label = if (index == 0) "关键术语" else "",
                    text = clauseOf(term),
                    pos = "原文第${lineOf(term)}行",
                )
            }
        }
        if (rawText.contains("神经根受压")) {
            rows += VerifyTermRow("神经根", "报告写“${clauseOf("神经根受压")}”", "原文第${lineOf("神经根受压")}行")
        }
        return rows
    }

    /** 从原文中提取侧别（左侧 / 右侧 / 双侧） */
    private fun extractSide(text: String): String? {
        if (Regex("双侧|两边").containsMatchIn(text)) return "双侧"
        if (Regex("左侧|左边").containsMatchIn(text)) return "左侧"
        if (Regex("右侧|右边").containsMatchIn(text)) return "右侧"
        return null
    }
}
