package com.yaoyouju.app.feature.report

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
import com.yaoyouju.app.data.CreateEpisodeRequest
import com.yaoyouju.app.data.CreateReportRequest
import kotlinx.coroutines.launch

enum class ReportTab(val label: String) {
    Paste("粘贴文字（推荐）"),
    Ocr("拍照提取"),
    Skip("暂不录入"),
}

val EXAM_TYPES = listOf("MRI", "CT", "X光", "超声")
val ADVICE_OPTIONS = listOf("保守治疗", "复查时间", "用药", "康复建议", "手术评估")

data class ReportUiState(
    val tab: ReportTab = ReportTab.Paste,
    val reportText: String = "",
    val reportDate: String = "",
    val examTypeIndex: Int = 0,
    val hospital: String = "",
    val ocrText: String = "",
    val adviceText: String = "",
    val advice: List<String> = emptyList(),
    val submitting: Boolean = false,
    val showDatePicker: Boolean = false,
    val showExamTypePicker: Boolean = false,
)

class ReportViewModel : ViewModel() {

    var state by mutableStateOf(ReportUiState())
        private set

    fun selectTab(tab: ReportTab) {
        state = state.copy(tab = tab)
    }

    fun onReportTextChange(value: String) {
        state = state.copy(reportText = value)
    }

    fun onReportDateChange(value: String) {
        state = state.copy(reportDate = value)
    }

    fun selectExamType(index: Int) {
        state = state.copy(examTypeIndex = index, showExamTypePicker = false)
    }

    fun onHospitalChange(value: String) {
        state = state.copy(hospital = value)
    }

    fun onAdviceTextChange(value: String) {
        state = state.copy(adviceText = value)
    }

    fun toggleAdvice(option: String) {
        val list = state.advice.toMutableList()
        if (list.contains(option)) list.remove(option) else list.add(option)
        state = state.copy(advice = list)
    }

    fun setShowDatePicker(show: Boolean) {
        state = state.copy(showDatePicker = show)
    }

    fun setShowExamTypePicker(show: Boolean) {
        state = state.copy(showExamTypePicker = show)
    }

    fun runOcr() {
        viewModelScope.launch {
            try {
                val result = apiCall { AppGraph.api.ocr(emptyMap()) }
                val text = result?.get("text")?.let { element ->
                    runCatching { (element as kotlinx.serialization.json.JsonPrimitive).content }.getOrNull()
                }.orEmpty()
                val disabledElement = result?.get("disabled")
                val disabled = (disabledElement as? kotlinx.serialization.json.JsonPrimitive)?.content == "true"
                if (disabled) {
                    AppGraph.appState.toast("拍照提取功能已暂时关闭，请粘贴报告文字。")
                    return@launch
                }
                state = state.copy(ocrText = text, reportText = if (state.reportText.isBlank()) text else state.reportText)
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    private suspend fun ensureEpisodeId(): String? {
        val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
        if (episodes.isNotEmpty()) {
            AppGraph.appState.currentEpisode = episodes.first()
            return episodes.first().id
        }
        val created = runCatching {
            apiCall {
                AppGraph.api.createEpisode(
                    CreateEpisodeRequest("腰痛", state.reportDate.ifBlank { null }, "尚未确认"),
                )
            }
        }.getOrNull() ?: return null
        return created.id
    }

    fun submit(onDone: () -> Unit) {
        viewModelScope.launch {
            state = state.copy(submitting = true)
            try {
                val episodeId = ensureEpisodeId()
                if (episodeId == null) {
                    AppGraph.appState.toast("无法建立病程，请稍后重试")
                    return@launch
                }
                val reportText = state.reportText.trim()
                if (reportText.isNotEmpty()) {
                    val event = apiCall {
                        AppGraph.api.addEvent(
                            episodeId,
                            AddEventRequest(
                                eventType = "报告",
                                occurredAt = BeijingTime.nowIso(),
                                sourceType = "报告原文",
                                rawText = reportText,
                            ),
                        )
                    }
                    if (event != null) {
                        apiCall {
                            AppGraph.api.createReport(
                                CreateReportRequest(
                                    careEventId = event.id,
                                    reportDate = state.reportDate.ifBlank { null },
                                    sourceType = "报告原文",
                                    rawText = reportText,
                                ),
                            )
                        }
                    }
                }
                val adviceText = state.adviceText.trim()
                if (adviceText.isNotEmpty()) {
                    apiCall {
                        AppGraph.api.addEvent(
                            episodeId,
                            AddEventRequest(
                                eventType = "医嘱",
                                occurredAt = BeijingTime.nowIso(),
                                sourceType = "医生记录",
                                rawText = adviceText,
                                verifyStatus = "尚未确认",
                            ),
                        )
                    }
                }
                onDone()
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            } finally {
                state = state.copy(submitting = false)
            }
        }
    }
}
