package com.yaoyouju.app.feature.analysis

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel

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
) {
    val vm: AnalysisViewModel = viewModel()
    LaunchedEffect(analysisId) {
        if (analysisId.isNotBlank()) vm.start(analysisId)
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
        onReportError = vm::reportError,
        onToggleQuestion = vm::toggleQuestion,
        onAddQuestions = vm::addQuestionsToFollowup,
    )
}
