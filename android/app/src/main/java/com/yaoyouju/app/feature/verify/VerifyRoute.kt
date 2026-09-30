package com.yaoyouju.app.feature.verify

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel

/** A06 路由 */
@Composable
fun VerifyRoute(
    onBack: () -> Unit,
    onTask: (String) -> Unit,
    onRedFlag: () -> Unit,
) {
    val vm: VerifyViewModel = viewModel()
    LaunchedEffect(Unit) { vm.load() }
    VerifyScreen(
        state = vm.state,
        onBack = onBack,
        onCorrectReport = { vm.setShowCorrectDialog(true) },
        onResolveConflict = vm::resolveConflict,
        onGenerate = { vm.generateAnalysis(onTask = onTask, onRedFlag = onRedFlag) },
        onDismissCorrectDialog = { vm.setShowCorrectDialog(false) },
        onCorrectTextChange = vm::setCorrectText,
        onSaveCorrection = vm::saveCorrection,
    )
}
