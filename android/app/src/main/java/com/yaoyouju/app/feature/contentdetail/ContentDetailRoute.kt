package com.yaoyouju.app.feature.contentdetail

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.AppGraph

/** A15 路由 */
@Composable
fun ContentDetailRoute(contentId: String, onBack: () -> Unit, onReportContent: () -> Unit) {
    val vm: ContentDetailViewModel = viewModel()
    LaunchedEffect(contentId) { vm.load(contentId) }
    ContentDetailScreen(
        state = vm.state,
        onBack = onBack,
        onRetellChange = vm::setRetell,
        onSubmitRetell = vm::submitRetell,
        onToggleSubtitle = vm::toggleSubtitle,
        onFeedback = vm::feedback,
        onReportContent = onReportContent,
        onShare = { AppGraph.appState.toast("分享：演示版暂不调用外部应用") },
        reviewDate = vm.reviewDate(),
    )
}
