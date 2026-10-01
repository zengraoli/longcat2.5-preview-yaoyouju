package com.yaoyouju.app.feature.analysis

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.TabDestination

/** A07 路由 */
@Composable
fun AnalysisRoute(
    analysisId: String,
    onBack: () -> Unit,
    onCompare: () -> Unit,
    onTimeline: () -> Unit,
    onSummary: () -> Unit,
    onContents: () -> Unit,
    onFallback: () -> Unit,
    onContentDetail: (String) -> Unit,
    onFeedback: () -> Unit,
    onSelectTab: (TabDestination) -> Unit,
) {
    val vm: AnalysisViewModel = viewModel()
    LaunchedEffect(analysisId) {
        if (analysisId.isNotBlank()) vm.start(analysisId) else vm.loadLatest()
    }
    AnalysisScreen(
        state = vm.state,
        onBack = onBack,
        onCompare = onCompare,
        onTimeline = onTimeline,
        onSummary = onSummary,
        onContents = onContents,
        onFallback = onFallback,
        onContentDetail = onContentDetail,
        onFeedback = vm::submitFeedback,
        onReportError = onFeedback,
        onToggleQuestion = vm::toggleQuestion,
        onAddQuestions = vm::addQuestionsToFollowup,
        onSelectTab = onSelectTab,
        onShare = { AppGraph.appState.toast("分享：演示版请使用复诊摘要导出") },
        onMore = { AppGraph.appState.toast("更多：可在复诊摘要中导出或打印") },
    )
}
