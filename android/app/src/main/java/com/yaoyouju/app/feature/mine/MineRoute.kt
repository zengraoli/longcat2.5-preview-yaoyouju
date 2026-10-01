package com.yaoyouju.app.feature.mine

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.TabDestination

/** A17 路由 */
@Composable
fun MineRoute(
    onSelectTab: (TabDestination) -> Unit,
    onLoggedOut: () -> Unit,
    onFeedback: () -> Unit,
) {
    val vm: MineViewModel = viewModel()
    val context = LocalContext.current
    LaunchedEffect(Unit) { vm.load() }
    MineScreen(
        state = vm.state,
        onSelectTab = onSelectTab,
        onShowEmergency = vm::setShowEmergency,
        onShowConsents = vm::setShowConsents,
        onRequestRevoke = vm::requestRevokeHealthConsent,
        onGrantConsent = vm::grantHealthConsent,
        onExport = { vm.exportData { text -> copyToClipboard(context, text) } },
        onDeleteAccount = { vm.setShowDeleteConfirm(true) },
        onConfirmDelete = { vm.deleteAccount(onLoggedOut) },
        onDismissDeleteConfirm = { vm.setShowDeleteConfirm(false) },
        onConfirmRevoke = vm::revokeHealthConsent,
        onDismissRevokeConfirm = vm::dismissRevokeHealthConsent,
        onLogout = { vm.logout(onLoggedOut) },
        onFeedback = onFeedback,
        onInfo = { AppGraph.appState.toast(it) },
    )
}

private fun copyToClipboard(context: Context, text: String) {
    val manager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    manager.setPrimaryClip(ClipData.newPlainText("我的数据", text))
    AppGraph.appState.toast("已复制导出数据")
}
