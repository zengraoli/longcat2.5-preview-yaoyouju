package com.yaoyouju.app.feature.confirm

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel

/** A02 路由 */
@Composable
fun ConfirmRoute(
    onBack: () -> Unit,
    onRedFlag: () -> Unit,
    onContinue: () -> Unit,
    onSkip: () -> Unit,
) {
    val vm: ConfirmViewModel = viewModel()
    ConfirmScreen(
        state = vm.state,
        onBack = onBack,
        onSelectChange = vm::selectChange,
        onToggleRedFlag = { option -> vm.selectRedFlag(option, onRedFlag) },
        onToggleNone = vm::toggleNone,
        onToggleUncertain = vm::toggleUncertain,
        onSelectSide = vm::selectSide,
        onSelectOnset = vm::selectOnset,
        onSetOnsetDate = vm::setOnsetDate,
        onShowDatePicker = vm::setShowDatePicker,
        onNext = { vm.next(onRedFlag = onRedFlag, onContinue = onContinue) },
        onSkip = onSkip,
    )
}
