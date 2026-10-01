package com.yaoyouju.app.feature.summary

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.FileProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.yaoyouju.app.core.components.TabDestination
import java.io.File

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
                    "PDF" -> exportPdf(context, text)
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

/** 用 Android PdfDocument 生成真正的 PDF 文件，再通过 FileProvider 分享。 */
private fun exportPdf(context: Context, text: String) {
    runCatching {
        val document = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4
        val titlePaint = Paint().apply {
            textSize = 16f
            isFakeBoldText = true
        }
        val bodyPaint = Paint().apply { textSize = 11f }
        val margin = 40f
        val lineHeight = bodyPaint.textSize * 1.5f
        val pageHeight = 842f

        var page = document.startPage(pageInfo)
        var canvas = page.canvas
        var y = margin + 20f
        canvas.drawText("复诊交接摘要（演示导出）", margin, y, titlePaint)
        y += 28f

        // 正文：按行绘制，超页自动分页
        for (line in text.split("\n")) {
            if (y > pageHeight - margin) {
                document.finishPage(page)
                page = document.startPage(pageInfo)
                canvas = page.canvas
                y = margin + 20f
            }
            canvas.drawText(line, margin, y, bodyPaint)
            y += lineHeight
        }
        document.finishPage(page)

        val dir = File(context.cacheDir, "exports").apply { mkdirs() }
        val file = File(dir, "复诊交接摘要.pdf")
        file.outputStream().use { document.writeTo(it) }
        document.close()
        val uri: Uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, "复诊交接摘要")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "导出复诊交接摘要"))
    }.onFailure {
        com.yaoyouju.app.AppGraph.appState.toast("PDF 导出失败：${it.message}")
    }
}
