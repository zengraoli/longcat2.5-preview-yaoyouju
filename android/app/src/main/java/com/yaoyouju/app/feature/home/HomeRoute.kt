package com.yaoyouju.app.feature.home

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.TabDestination

/** A14 路由：连接 ViewModel 与导航。 */
@Composable
fun HomeRoute(
    onSelectTab: (TabDestination) -> Unit,
    onConfirm: () -> Unit,
    onConfusion: () -> Unit,
    onRecord: () -> Unit,
    onReport: () -> Unit,
    onQa: () -> Unit,
    onSummary: () -> Unit,
    onAnalysis: (String) -> Unit,
    onContentDetail: (String) -> Unit,
) {
    val vm: HomeViewModel = viewModel()
    LaunchedEffect(Unit) { vm.load() }
    HomeScreen(
        state = vm.state,
        onSelectTab = onSelectTab,
        onConfirm = onConfirm,
        onRecord = onRecord,
        onReport = onReport,
        onQa = onQa,
        onSummary = onSummary,
        onAnalysis = { vm.state.analysis?.id?.let(onAnalysis) },
        onContentDetail = { onContentDetail(it.id) },
        onContents = {},
        onShowEmergency = vm::setShowEmergency,
        onDismissPending = vm::dismissPending,
        onConfusion = onConfusion,
        onNotification = { AppGraph.appState.toast("通知：演示版暂无新通知") },
        onAvatar = { onSelectTab(TabDestination.Mine) },
    )
}
