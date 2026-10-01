package com.yaoyouju.app.feature.feedback

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel

/** A16 路由 */
@Composable
fun FeedbackRoute(onBack: () -> Unit) {
    val vm: FeedbackViewModel = viewModel()
    LaunchedEffect(Unit) { vm.load() }
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
    )
}
