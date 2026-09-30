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
    val selectedText: String = "你选择的变化（记录见病程）",
    val reportHint: String = "",
    val showHospitalDialog: Boolean = false,
    val doctorSaved: Boolean = true,
)

class RedFlagViewModel : ViewModel() {

    var state by mutableStateOf(RedFlagUiState())
        private set

    init {
        val selected = AppGraph.appState.redFlagSelected
        state = state.copy(
            selectedText = if (selected.isNotEmpty()) selected.joinToString("、") else "你选择的变化（记录见病程）",
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
