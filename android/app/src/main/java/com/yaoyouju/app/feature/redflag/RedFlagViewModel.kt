package com.yaoyouju.app.feature.redflag

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import kotlinx.coroutines.launch

data class RedFlagUiState(
    val hasSelection: Boolean = false,
    val selectedText: String = "",
    /** 红旗来自 A02 用户勾选还是系统检测，决定提示文案 */
    val fromSelection: Boolean = false,
    val reportHint: String = "",
    val showHospitalDialog: Boolean = false,
)

class RedFlagViewModel : ViewModel() {

    var state by mutableStateOf(RedFlagUiState())
        private set

    init {
        val selected = AppGraph.appState.redFlagSelected
        state = state.copy(
            hasSelection = selected.isNotEmpty(),
            selectedText = selected.joinToString("、"),
            fromSelection = AppGraph.appState.redFlagFromSelection,
        )
        loadReportHint()
    }

    private fun loadReportHint() {
        viewModelScope.launch {
            val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
            val episode = episodes.firstOrNull() ?: return@launch
            val timeline = runCatching { apiCall { AppGraph.api.timeline(episode.id) } }.getOrNull() ?: return@launch
            val report = timeline.events.reversed().firstOrNull { it.eventType == "报告" && !it.rawText.isNullOrBlank() }
                ?: return@launch
            state = state.copy(
                reportHint = "已录入的检查报告原文（${BeijingTime.date(report.occurredAt)}）",
            )
        }
    }

    fun setShowHospitalDialog(show: Boolean) {
        state = state.copy(showHospitalDialog = show)
    }

    fun contactDoctor() {
        AppGraph.appState.toast("可在复诊时联系你的主治医生")
    }
}
