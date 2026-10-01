package com.yaoyouju.app.feature.fallback

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel

/** A18 路由 */
@Composable
fun FallbackRoute(
    onBack: () -> Unit,
    onContents: () -> Unit,
    onSummary: () -> Unit,
    onTimeline: () -> Unit,
) {
    val vm: FallbackViewModel = viewModel()
    FallbackScreen(
        state = vm.state,
        onBack = onBack,
        onShowEmergency = vm::setShowEmergency,
        onContents = onContents,
        onSummary = onSummary,
        onTimeline = onTimeline,
        onRetry = onBack,
    )
}
