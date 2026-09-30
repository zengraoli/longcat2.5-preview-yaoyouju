package com.yaoyouju.app.feature.qa

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AddFollowupQuestionRequest
import com.yaoyouju.app.data.AskRequest
import com.yaoyouju.app.data.CreateQaSessionRequest
import com.yaoyouju.app.data.QaMessage
import kotlinx.coroutines.launch

data class QaUiState(
    val loading: Boolean = true,
    val contextText: String = "正在加载…",
    val messages: List<QaMessage> = emptyList(),
    val outOfScopeMessageIds: Set<String> = emptySet(),
    val explainedCount: Int = 0,
    val input: String = "",
    val sending: Boolean = false,
    val quickQuestions: List<String> = listOf("复诊时该怎么描述？", "哪些变化要提前就医？", "保守治疗一般多久？"),
)

class QaViewModel : ViewModel() {

    var state by mutableStateOf(QaUiState())
        private set

    private var sessionId: String? = null

    fun loadSession() {
        viewModelScope.launch {
            val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
            val episode = episodes.firstOrNull()
            if (episode == null) {
                state = state.copy(loading = false, contextText = "尚未建立病程，可先自由提问")
                return@launch
            }
            AppGraph.appState.currentEpisode = episode
            val analysis = runCatching { apiCall { AppGraph.api.getLatestAnalysis(episode.id) } }.getOrNull()
            if (analysis == null) {
                state = state.copy(loading = false, contextText = "尚未生成分析，可先自由提问")
                return@launch
            }
            AppGraph.appState.latestAnalysis = analysis
            if (sessionId == null) {
                val sessions = runCatching { apiCall { AppGraph.api.listQaSessions() } }.getOrNull().orEmpty()
                val session = sessions.firstOrNull { it.analysisId == analysis.id } ?: sessions.firstOrNull()
                if (session != null) {
                    sessionId = session.id
                    val history = runCatching { apiCall { AppGraph.api.getQaSession(session.id) } }.getOrNull()
                    state = state.copy(
                        loading = false,
                        messages = history?.messages.orEmpty(),
                        explainedCount = history?.messages.orEmpty().count { it.role == "user" },
                        contextText = "本轮基于：${BeijingTime.today()} 当前情况 + 一页分析 v${analysis.version}",
                    )
                } else {
                    val created = runCatching {
                        apiCall {
                            AppGraph.api.createQaSession(
                                CreateQaSessionRequest(analysis.id, "报告术语解释", analysis.episodeId),
                            )
                        }
                    }.getOrNull()
                    sessionId = created?.id
                    state = state.copy(
                        loading = false,
                        contextText = "本轮基于：${BeijingTime.today()} 当前情况 + 一页分析 v${analysis.version}",
                    )
                }
            } else {
                state = state.copy(
                    loading = false,
                    contextText = "本轮基于：${BeijingTime.today()} 当前情况 + 一页分析 v${analysis.version}",
                )
            }
        }
    }

    fun onInputChange(value: String) {
        state = state.copy(input = value)
    }

    fun ask(text: String) {
        val question = text.trim()
        if (question.isEmpty() || state.sending) return
        viewModelScope.launch {
            state = state.copy(sending = true, input = "")
            try {
                if (sessionId == null) {
                    val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
                    val created = apiCall {
                        AppGraph.api.createQaSession(CreateQaSessionRequest(null, "自由提问", episodes.firstOrNull()?.id))
                    }
                    sessionId = created?.id
                    state = state.copy(contextText = "基于通用上下文（未关联具体分析）")
                }
                val id = sessionId ?: return@launch
                state = state.copy(
                    messages = state.messages + QaMessage(
                        id = "u-${System.currentTimeMillis()}",
                        role = "user",
                        content = question,
                        createdAt = BeijingTime.nowIso(),
                    ),
                )
                val result = apiCall { AppGraph.api.ask(id, AskRequest(question)) }
                if (result == null) {
                    AppGraph.appState.toast("回答失败，请稍后再试")
                    return@launch
                }
                val outOfScope = result.outOfScope.isNotEmpty()
                state = state.copy(
                    messages = state.messages + result.message,
                    outOfScopeMessageIds = if (outOfScope) {
                        state.outOfScopeMessageIds + result.message.id
                    } else {
                        state.outOfScopeMessageIds
                    },
                    explainedCount = state.messages.count { it.role == "user" },
                )
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            } finally {
                state = state.copy(sending = false)
            }
        }
    }

    fun addFollowupQuestion(question: String) {
        val id = sessionId ?: return
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.addFollowupQuestion(id, AddFollowupQuestionRequest(question)) }
                AppGraph.appState.toast("已加入复诊问题")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }
}
