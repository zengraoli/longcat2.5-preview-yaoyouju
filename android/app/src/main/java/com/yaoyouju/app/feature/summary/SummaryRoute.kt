package com.yaoyouju.app.feature.summary

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.core.components.TabDestination

/** A12 路由：导出后由用户自行决定是否分享。 */
@Composable
fun SummaryRoute(onSelectTab: (TabDestination) -> Unit) {
    val vm: SummaryViewModel = viewModel()
    val context = LocalContext.current
    LaunchedEffect(Unit) { vm.load() }
    SummaryScreen(
        state = vm.state,
        onSelectTab = onSelectTab,
        onSelectSummaryTab = vm::selectTab,
        onCorrect = vm::startCorrect,
        onCorrectTextChange = vm::setCorrectText,
        onSaveCorrect = vm::saveCorrection,
        onCancelCorrect = vm::cancelCorrect,
        onExport = { format ->
            vm.export(format) { text ->
                when (format) {
                    "文本" -> copyToClipboard(context, text)
                    "PDF" -> shareText(context, text)
                    else -> com.yaoyouju.app.AppGraph.appState.toast("演示版暂不支持生成图片，请使用复制文本")
                }
            }
        },
    )
}

private fun copyToClipboard(context: Context, text: String) {
    val manager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    manager.setPrimaryClip(ClipData.newPlainText("复诊交接摘要", text))
    com.yaoyouju.app.AppGraph.appState.toast("已复制文本")
}

private fun shareText(context: Context, text: String) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, "复诊交接摘要")
        putExtra(Intent.EXTRA_TEXT, text)
    }
    runCatching { context.startActivity(Intent.createChooser(intent, "导出复诊交接摘要")) }
}
