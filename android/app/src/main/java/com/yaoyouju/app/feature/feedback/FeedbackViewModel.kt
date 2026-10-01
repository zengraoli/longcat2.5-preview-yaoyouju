package com.yaoyouju.app.feature.feedback

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AnalysisResult
import com.yaoyouju.app.data.ContentDetail
import com.yaoyouju.app.data.ErrorReportRequest
import com.yaoyouju.app.data.HelpFeedbackRequest
import kotlinx.coroutines.launch

enum class FeedbackTab(val label: String) {
    Help("帮助类型反馈"),
    Error("错误举报"),
}

val PROBLEM_TYPES = listOf(
    "事实错误",
    "与我的报告不符",
    "越界（给了不该给的判断）",
    "缺少重要就医提示",
    "看不懂",
    "左右侧/日期混淆",
    "隐私问题",
    "其他",
)
val HELP_TYPES = listOf("看懂了", "知道下一步", "都不好，问题没解决")

data class FeedbackUiState(
    val loading: Boolean = true,
    val tab: FeedbackTab = FeedbackTab.Error,
    val analysis: AnalysisResult? = null,
    /** 从视频详情进入时关联的内容（视频/图文） */
    val content: ContentDetail? = null,
    val problemTypes: List<String> = emptyList(),
    val description: String = "",
    val authorized: Boolean = true,
    val helpType: String? = null,
    val submitting: Boolean = false,
    val contentLabel: String = "",
    val versionLabel: String = "",
    val timeLabel: String = "",
) {
    /** 关联对象 id：优先内容，其次分析；都没有时为空（仍可提交反馈） */
    val targetId: String? get() = content?.id ?: analysis?.id
}

class FeedbackViewModel : ViewModel() {

    var state by mutableStateOf(FeedbackUiState())
        private set

    /**
     * @param source 来源参数："" = 自动取最新分析；"analysis:<id>" = 指定分析；"content:<id>" = 指定内容
     */
    fun load(source: String = "") {
        viewModelScope.launch {
            state = state.copy(loading = true)
            // 从视频详情进入：关联到这条内容，而不是用户最新的一页分析
            val contentId = source.removePrefix("content:").takeIf { source.startsWith("content:") }
            val analysisId = source.removePrefix("analysis:").takeIf { source.startsWith("analysis:") }
            if (contentId != null) {
                val detail = runCatching { apiCall { AppGraph.api.getContentDetail(contentId) } }.getOrNull()
                state = state.copy(
                    loading = false,
                    content = detail,
                    contentLabel = detail?.title ?: "暂无关联内容",
                    versionLabel = "已审核 v${detail?.auditVersion ?: 1}",
                    timeLabel = BeijingTime.dateTime(detail?.publishedAt),
                )
                return@launch
            }
            val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
            val episode = episodes.firstOrNull()
            val analysis = if (analysisId != null) {
                // 通过最新分析列表无法按 id 直接取，尝试从会话关联的分析中找；找不到就退回最新分析
                runCatching { apiCall { AppGraph.api.getLatestAnalysis(episode?.id ?: "") } }.getOrNull()
                    ?.takeIf { it.id == analysisId }
            } else if (episode != null) {
                runCatching { apiCall { AppGraph.api.getLatestAnalysis(episode.id) } }.getOrNull()
            } else {
                AppGraph.appState.latestAnalysis
            }
            state = state.copy(
                loading = false,
                analysis = analysis,
                contentLabel = contentLabelOf(analysis),
                versionLabel = versionLabelOf(analysis),
                timeLabel = BeijingTime.dateTime(analysis?.createdAt),
            )
        }
    }

    private fun contentLabelOf(analysis: AnalysisResult?): String {
        if (analysis == null) return "暂无关联分析"
        val explanations = analysis.sections.explanation
        val index = explanations.indexOfFirst { item ->
            listOf("硬膜囊受压", "神经根受压", "椎间盘突出", "L5/S1").any { item.text.contains(it) }
        }.takeIf { it >= 0 } ?: explanations.indices.firstOrNull()
        if (index == null) return "一页分析 v${analysis.version}"
        val term = listOf("硬膜囊受压", "神经根受压", "椎间盘突出", "L5/S1")
            .firstOrNull { explanations[index].text.contains(it) }
        return if (term != null) {
            "一页分析 v${analysis.version} · ②-${index + 1} “$term” 解释"
        } else {
            "一页分析 v${analysis.version} · ②-${index + 1} 解释"
        }
    }

    private fun versionLabelOf(analysis: AnalysisResult?): String {
        if (analysis == null) return "—"
        val ruleset = analysis.retrievalSnapshot.rulesetVersion.ifBlank { "R-4" }
        val contentLib = analysis.retrievalSnapshot.contentLibVersion
            .ifBlank { analysis.contentLibVersion.orEmpty() }
            .ifBlank { "—" }
        return "分析 v${analysis.version} · 模型 ${analysis.modelReleaseId} · 科普 $contentLib · 检索策略 $ruleset"
    }

    fun selectTab(tab: FeedbackTab) {
        state = state.copy(tab = tab)
    }

    fun toggleProblemType(type: String) {
        val list = state.problemTypes.toMutableList()
        if (list.contains(type)) list.remove(type) else list.add(type)
        state = state.copy(problemTypes = list)
    }

    fun setDescription(text: String) {
        state = state.copy(description = text)
    }

    fun toggleAuthorized() {
        state = state.copy(authorized = !state.authorized)
    }

    fun selectHelpType(type: String) {
        state = state.copy(helpType = type)
    }

    fun submit(onDone: () -> Unit) {
        val targetId = state.targetId
        if (targetId == null) {
            AppGraph.appState.toast("暂无可反馈的对象")
            return
        }
        val isContent = state.content != null
        viewModelScope.launch {
            state = state.copy(submitting = true)
            try {
                when (state.tab) {
                    FeedbackTab.Help -> {
                        val helpType = state.helpType
                        if (helpType == null) {
                            AppGraph.appState.toast("请选择帮助类型")
                            return@launch
                        }
                        apiCall {
                            AppGraph.api.createHelpFeedback(
                                HelpFeedbackRequest(
                                    analysisId = if (isContent) null else targetId,
                                    contentId = if (isContent) targetId else null,
                                    helpType = helpType,
                                    unsolvedQuestion = state.description.ifBlank { null },
                                ),
                            )
                        }
                        AppGraph.appState.toast("感谢反馈")
                    }

                    FeedbackTab.Error -> {
                        if (state.description.isBlank()) {
                            AppGraph.appState.toast("请填写具体描述")
                            return@launch
                        }
                        apiCall {
                            AppGraph.api.createErrorReport(
                                ErrorReportRequest(
                                    analysisId = if (isContent) null else targetId,
                                    contentId = if (isContent) targetId else null,
                                    description = state.description,
                                    severity = "中",
                                    problemTypes = state.problemTypes,
                                    authorized = state.authorized,
                                ),
                            )
                        }
                        AppGraph.appState.toast("已提交举报")
                    }
                }
                onDone()
            } catch (e: ApiException) {
                // 同意撤回等错误已由全局处理器提示，不再重复弹服务端原文
                if (!e.isConsentMissing) AppGraph.appState.toast(e.message)
            } finally {
                state = state.copy(submitting = false)
            }
        }
    }
}
