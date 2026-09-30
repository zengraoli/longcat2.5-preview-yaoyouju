package com.yaoyouju.app.feature.compare

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel

/** A08 路由 */
@Composable
fun CompareRoute(onBack: () -> Unit) {
    val vm: CompareViewModel = viewModel()
    LaunchedEffect(Unit) { vm.load() }
    CompareScreen(
        state = vm.state,
        onBack = onBack,
        onSelectTab = vm::selectTab,
        onPrev = vm::prev,
        onNext = vm::next,
        evidenceTitle = vm::evidenceTitle,
    )
}
