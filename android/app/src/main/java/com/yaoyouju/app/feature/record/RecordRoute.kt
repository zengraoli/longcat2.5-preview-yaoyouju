package com.yaoyouju.app.feature.record

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel

/** A11 路由 */
@Composable
fun RecordRoute(
    onBack: () -> Unit,
    onSaved: () -> Unit,
) {
    val vm: RecordViewModel = viewModel()
    RecordScreen(
        state = vm.state,
        onBack = onBack,
        onSelectSit = vm::selectSit,
        onSelectPlanned = vm::selectPlanned,
        onSelectSleep = vm::selectSleep,
        onSelectChange = vm::selectChange,
        onSelectLeg = vm::selectLeg,
        onToggleActivity = vm::toggleActivity,
        onTopWorryChange = vm::setTopWorry,
        onSave = { vm.save(onSaved) },
    )
}
