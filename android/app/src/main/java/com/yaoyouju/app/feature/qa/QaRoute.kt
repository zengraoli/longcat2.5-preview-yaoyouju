package com.yaoyouju.app.feature.qa

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.core.components.TabDestination

/** A09 路由 */
@Composable
fun QaRoute(onSelectTab: (TabDestination) -> Unit) {
    val vm: QaViewModel = viewModel()
    LaunchedEffect(Unit) { vm.loadSession() }
    QaScreen(
        state = vm.state,
        onSelectTab = onSelectTab,
        onInputChange = vm::onInputChange,
        onSend = { vm.ask(vm.state.input) },
        onQuickAsk = { vm.ask(it) },
        onAddFollowup = vm::addFollowupQuestion,
    )
}
