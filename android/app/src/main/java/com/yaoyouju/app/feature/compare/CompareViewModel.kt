package com.yaoyouju.app.feature.compare

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AnalysisCitation
import com.yaoyouju.app.data.AnalysisSection
import kotlinx.coroutines.launch

enum class CompareTab(val label: String) {
    ByExplanation("按解释查看"),
    ByTerm("按术语查看"),
}

data class TermDef(val name: String, val def: String)

data class CompareUiState(
    val loading: Boolean = true,
    val tab: CompareTab = CompareTab.ByExplanation,
    val explanations: List<AnalysisSection> = emptyList(),
    val citations: List<AnalysisCitation> = emptyList(),
    val rawText: String = "",
    val reportDate: String = "",
    val examType: String = "检查报告",
    val sideConflict: Boolean = false,
    val index: Int = 0,
    val terms: List<TermDef> = emptyList(),
) {
    val current: AnalysisSection? get() = explanations.getOrNull(index)

    /** 本条解释对应的原文行号 */
    val currentLine: Int
        get() {
            val text = current?.text.orEmpty()
            val lines = rawText.split("\n")
            val matched = TERM_NAMES.firstOrNull { text.contains(it) && rawText.contains(it) }
            val idx = if (matched != null) lines.indexOfFirst { it.contains(matched) } else -1
            // 设计稿按 0 基行号标注（第 2 行 = 第三行）
            return if (idx >= 0) idx else index
        }
}

val TERM_NAMES = listOf("硬膜囊受压", "神经根受压", "椎间盘突出", "椎间盘膨出", "L5/S1", "L4/5")

private val TERM_DEFS = listOf(
    TermDef("硬膜囊", "包裹脊髓和神经根的膜性结构在影像上的名称。"),
    TermDef("神经根", "从脊髓分出、经椎间孔走行的神经起始段。"),
    TermDef("椎间盘突出", "椎间盘内容物超出椎体边缘的影像描述，程度与症状不一定对应。"),
)

class CompareViewModel : ViewModel() {

    var state by mutableStateOf(CompareUiState())
        private set

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true)
            val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
            val episode = episodes.firstOrNull() ?: run {
                state = state.copy(loading = false)
                return@launch
            }
            val analysis = runCatching { apiCall { AppGraph.api.getLatestAnalysis(episode.id) } }.getOrNull()
            val timeline = runCatching { apiCall { AppGraph.api.timeline(episode.id) } }.getOrNull()
            val reportEvent = timeline?.events.orEmpty().reversed()
                .firstOrNull { it.eventType == "报告" && !it.rawText.isNullOrBlank() }
            val rawText = reportEvent?.rawText.orEmpty()
            val reportSide = extractSide(rawText)
            val selfText = timeline?.events.orEmpty()
                .filter { it.sourceType == "自述" && !it.rawText.isNullOrBlank() }
                .joinToString("，") { it.rawText.orEmpty() }
            val selfSide = extractSide(selfText)
            val conflict = reportSide != null && selfSide != null &&
                reportSide != selfSide && reportSide != "双侧" && selfSide != "双侧"

            state = state.copy(
                loading = false,
                explanations = analysis?.sections?.explanation.orEmpty(),
                citations = analysis?.citations.orEmpty(),
                rawText = rawText,
                reportDate = reportEvent?.occurredAt?.let { BeijingTime.date(it) }.orEmpty(),
                examType = examTypeOf(rawText),
                sideConflict = conflict,
                terms = TERM_DEFS.filter { rawText.contains(it.name) },
            )
        }
    }

    fun selectTab(tab: CompareTab) {
        state = state.copy(tab = tab)
    }

    fun prev() {
        if (state.index > 0) state = state.copy(index = state.index - 1)
    }

    fun next() {
        if (state.index < state.explanations.size - 1) state = state.copy(index = state.index + 1)
    }

    fun evidenceTitle(source: String?): String {
        if (source.isNullOrBlank()) return "系统生成"
        val citation = state.citations.firstOrNull { it.evidenceDocId == source }
        if (!citation?.evidenceDocTitle.isNullOrBlank()) return citation!!.evidenceDocTitle!!
        return "证据库"
    }

    private fun extractSide(text: String): String? {
        if (Regex("双侧|两边").containsMatchIn(text)) return "双侧"
        if (Regex("左侧|左边").containsMatchIn(text)) return "左侧"
        if (Regex("右侧|右边").containsMatchIn(text)) return "右侧"
        return null
    }

    private fun examTypeOf(rawText: String): String = when {
        rawText.contains("MRI") -> "腰椎MRI"
        rawText.contains("CT") -> "CT"
        rawText.contains("X光") || rawText.contains("X线") -> "X光"
        rawText.contains("超声") -> "超声"
        else -> "检查报告"
    }
}
