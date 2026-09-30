package com.yaoyouju.app.feature.contents

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.core.components.TabDestination

/** A13 路由 */
@Composable
fun ContentsRoute(
    onSelectTab: (TabDestination) -> Unit,
    onBack: () -> Unit,
    onOpenDetail: (String) -> Unit,
) {
    val vm: ContentsViewModel = viewModel()
    LaunchedEffect(Unit) { vm.load() }
    var searchVisible by remember { mutableStateOf(false) }
    ContentsScreen(
        state = vm.state,
        onSelectTab = onSelectTab,
        onBack = onBack,
        onSelectCategory = vm::selectCategory,
        onQueryChange = vm::setQuery,
        onToggleSearch = { searchVisible = !searchVisible },
        onOpenDetail = onOpenDetail,
        showSearch = searchVisible,
    )
}
