package com.yaoyouju.app.feature.summary

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.ExportRequest
import com.yaoyouju.app.data.SaveSummaryRequest
import com.yaoyouju.app.data.SummaryContent
import com.yaoyouju.app.data.SummaryEntry
import kotlinx.coroutines.launch

enum class SummaryTab(val label: String) {
    Doc("一页交接摘要"),
    Questions("问题清单"),
    Bring("带什么"),
}

data class SummarySection(val key: String, val title: String, val items: List<SummaryEntry>)

data class SummaryUiState(
    val loading: Boolean = true,
    val tab: SummaryTab = SummaryTab.Doc,
    val content: SummaryContent? = null,
    val sections: List<SummarySection> = emptyList(),
    val summaryId: String? = null,
    val correctingKey: String? = null,
    val correctText: String = "",
    val exporting: Boolean = false,
    val today: String = BeijingTime.today(),
) {
    val questions: List<String> get() = content?.questions.orEmpty()
}

class SummaryViewModel : ViewModel() {

    var state by mutableStateOf(SummaryUiState())
        private set

    fun selectTab(tab: SummaryTab) {
        state = state.copy(tab = tab)
    }

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
            val content = runCatching { apiCall { AppGraph.api.previewSummary(episode.id) } }.getOrNull()
            state = state.copy(loading = false, content = content, sections = toSections(content))
        }
    }

    private fun toSections(content: SummaryContent?): List<SummarySection> {
        if (content == null) return emptyList()
        return listOf(
            SummarySection("当前情况", "当前情况", content.current),
            SummarySection("报告要点", "相关检查原文", content.report),
            SummarySection("医嘱要点", "已经接受的专业建议", content.advice),
            SummarySection("尚未确认", "尚未确认", content.unconfirmed),
            SummarySection("下一步", "下一步", content.next),
        )
    }

    fun startCorrect(key: String) {
        val section = state.sections.firstOrNull { it.key == key }
        state = state.copy(correctingKey = key, correctText = section?.items?.firstOrNull()?.text.orEmpty())
    }

    fun setCorrectText(text: String) {
        state = state.copy(correctText = text)
    }

    fun cancelCorrect() {
        state = state.copy(correctingKey = null, correctText = "")
    }

    fun saveCorrection() {
        val key = state.correctingKey ?: return
        val content = state.content ?: return
        val updated = when (key) {
            "当前情况" -> content.copy(current = replaceFirst(content.current, state.correctText))
            "报告要点" -> content.copy(report = replaceFirst(content.report, state.correctText))
            "医嘱要点" -> content.copy(advice = replaceFirst(content.advice, state.correctText))
            "尚未确认" -> content.copy(unconfirmed = replaceFirst(content.unconfirmed, state.correctText))
            "下一步" -> content.copy(next = replaceFirst(content.next, state.correctText))
            else -> content
        }
        state = state.copy(content = updated, sections = toSections(updated), correctingKey = null)
        persist()
    }

    private fun replaceFirst(items: List<SummaryEntry>, text: String): List<SummaryEntry> {
        if (items.isEmpty()) return listOf(SummaryEntry(text))
        return items.mapIndexed { index, entry -> if (index == 0) entry.copy(text = text) else entry }
    }

    /** 保存摘要并返回导出结果 */
    fun export(format: String, onText: (String) -> Unit) {
        val episodeId = AppGraph.appState.episodeId ?: return
        val content = state.content ?: return
        viewModelScope.launch {
            state = state.copy(exporting = true)
            try {
                val saved = apiCall { AppGraph.api.saveSummary(SaveSummaryRequest(episodeId, content)) }
                val id = saved?.id ?: return@launch
                state = state.copy(summaryId = id)
                val result = apiCall { AppGraph.api.exportSummary(id, ExportRequest(format)) }
                val text = result?.text.orEmpty()
                onText(text)
            } catch (e: ApiException) {
                // 同意撤回等错误已由全局处理器提示，不再重复弹服务端原文
                if (!e.isConsentMissing) AppGraph.appState.toast(e.message)
            } finally {
                state = state.copy(exporting = false)
            }
        }
    }

    private fun persist() {
        val episodeId = AppGraph.appState.episodeId ?: return
        val content = state.content ?: return
        viewModelScope.launch {
            runCatching {
                val saved = apiCall { AppGraph.api.saveSummary(SaveSummaryRequest(episodeId, content)) }
                if (saved != null) state = state.copy(summaryId = saved.id)
            }
        }
    }
}
