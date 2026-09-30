package com.yaoyouju.app.feature.timeline

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.core.components.TabDestination

/** A10 路由 */
@Composable
fun TimelineRoute(
    onSelectTab: (TabDestination) -> Unit,
    onRedFlag: () -> Unit,
) {
    val vm: TimelineViewModel = viewModel()
    LaunchedEffect(Unit) { vm.load() }
    TimelineScreen(
        state = vm.state,
        onSelectTab = onSelectTab,
        onToggleFilter = vm::toggleFilterPanel,
        onSelectFilter = vm::selectFilter,
        onShowAdd = vm::setShowAdd,
        onAddTypeIndex = vm::setAddTypeIndex,
        onAddDate = vm::setAddDate,
        onAddText = vm::setAddText,
        onSaveEvent = { vm.addEvent(onRedFlag) },
        onDeleteEvent = vm::deleteEvent,
    )
}
