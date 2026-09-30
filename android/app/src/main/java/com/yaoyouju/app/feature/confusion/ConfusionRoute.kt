package com.yaoyouju.app.feature.confusion

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel

/** A04 路由 */
@Composable
fun ConfusionRoute(
    onBack: () -> Unit,
    onNext: () -> Unit,
) {
    val vm: ConfusionViewModel = viewModel()
    ConfusionScreen(
        state = vm.state,
        onBack = onBack,
        onSelect = vm::select,
        onToggleFormat = vm::toggleFormat,
        onNext = onNext,
    )
}
