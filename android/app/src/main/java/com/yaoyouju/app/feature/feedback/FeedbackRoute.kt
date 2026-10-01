package com.yaoyouju.app.feature.feedback

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.AppGraph

/** A16 路由：source 为空时自动取最新分析；content:<id> 时关联到内容库条目 */
@Composable
fun FeedbackRoute(source: String = "", onBack: () -> Unit) {
    val vm: FeedbackViewModel = viewModel()
    LaunchedEffect(source) { vm.load(source) }
    FeedbackScreen(
        state = vm.state,
        onBack = onBack,
        onSelectTab = vm::selectTab,
        onToggleProblemType = vm::toggleProblemType,
        onDescriptionChange = vm::setDescription,
        onToggleAuthorized = vm::toggleAuthorized,
        onSelectHelpType = vm::selectHelpType,
        onSubmit = { vm.submit(onBack) },
        onCancel = onBack,
        onAddScreenshot = { AppGraph.appState.toast("添加截图：演示版暂不支持上传，可在描述中说明") },
    )
}
