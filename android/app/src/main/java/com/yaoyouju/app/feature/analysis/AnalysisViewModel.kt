package com.yaoyouju.app.feature.analysis

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.data.AnalysisResult
import com.yaoyouju.app.data.ErrorReportRequest
import com.yaoyouju.app.data.HelpFeedbackRequest
import com.yaoyouju.app.data.SaveSummaryRequest
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class AnalysisUiState(
    val loading: Boolean = true,
    val status: String = "",
    val reason: String = "",
    val result: AnalysisResult? = null,
    val selectedQuestions: Set<Int> = emptySet(),
    val feedbackGiven: String? = null,
    val followupAdded: Boolean = false,
    val submitting: Boolean = false,
)

class AnalysisViewModel : ViewModel() {

    var state by mutableStateOf(AnalysisUiState())
        private set

    private var pollJob: Job? = null

    /** 轮询分析任务，完成后展示一页分析 */
    fun start(taskId: String) {
        pollJob?.cancel()
        pollJob = viewModelScope.launch {
            repeat(90) {
                val res = runCatching { apiCall { AppGraph.api.getAnalysis(taskId) } }.getOrNull()
                if (res != null) {
                    when {
                        res.status == "完成" && res.analysis != null -> {
                            val result = res.analysis
                            AppGraph.appState.latestAnalysis = result
                            state = state.copy(
                                loading = false,
                                status = res.status,
                                result = result,
                                selectedQuestions = result.sections.next.indices.toSet(),
                            )
                            return@launch
                        }

                        res.status == "失败" -> {
                            state = state.copy(
                                loading = false,
                                status = res.status,
                                reason = res.reason ?: "分析生成失败",
                            )
                            return@launch
                        }

                        else -> state = state.copy(loading = false, status = res.status)
                    }
                }
                delay(2000)
            }
        }
    }

    override fun onCleared() {
        pollJob?.cancel()
        super.onCleared()
    }

    fun toggleQuestion(index: Int) {
        val set = state.selectedQuestions.toMutableSet()
        if (set.contains(index)) set.remove(index) else set.add(index)
        state = state.copy(selectedQuestions = set)
    }

    fun submitFeedback(helpType: String) {
        val analysis = state.result ?: return
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.createHelpFeedback(HelpFeedbackRequest(analysis.id, helpType)) }
                state = state.copy(feedbackGiven = helpType)
                AppGraph.appState.toast("感谢反馈")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun reportError() {
        val analysis = state.result ?: return
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.createErrorReport(ErrorReportRequest(analysis.id, "用户报告错误", "中")) }
                AppGraph.appState.toast("已提交举报")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    /** 把勾选的问题加入复诊问题清单（保留来源，不自动改写成事实） */
    fun addQuestionsToFollowup() {
        val episodeId = AppGraph.appState.episodeId ?: return
        val result = state.result ?: return
        val questions = result.sections.next
            .filterIndexed { index, _ -> state.selectedQuestions.contains(index) }
            .map { it.text }
        if (questions.isEmpty()) {
            AppGraph.appState.toast("请先选择要加入的问题")
            return
        }
        viewModelScope.launch {
            state = state.copy(submitting = true)
            try {
                val content = apiCall { AppGraph.api.previewSummary(episodeId) }
                if (content == null) {
                    AppGraph.appState.toast("加载复诊摘要失败")
                    return@launch
                }
                val merged = (content.questions + questions).distinct()
                apiCall {
                    AppGraph.api.saveSummary(SaveSummaryRequest(episodeId, content.copy(questions = merged)))
                }
                state = state.copy(followupAdded = true)
                AppGraph.appState.toast("已加入复诊问题清单")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            } finally {
                state = state.copy(submitting = false)
            }
        }
    }
}
