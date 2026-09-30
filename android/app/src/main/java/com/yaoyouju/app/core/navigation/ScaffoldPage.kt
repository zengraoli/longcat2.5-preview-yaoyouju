package com.yaoyouju.app.core.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** 设计稿页面标题（用于二级页顶部栏与占位页） */
object PageTitles {
    val map = mapOf(
        Routes.Login to "启动 · 登录与授权",
        Routes.Confirm to "当前关键变化确认",
        Routes.RedFlag to "就医提示",
        Routes.Confusion to "选择主要困惑",
        Routes.Report to "录入报告与既有医嘱",
        Routes.Verify to "核对结构化信息",
        Routes.Analysis to "一页理性分析",
        Routes.ReportCompare to "原文对照",
        Routes.Qa to "问与解释",
        Routes.Timeline to "病程时间线",
        Routes.Record to "记录今天",
        Routes.Summary to "复诊摘要",
        Routes.Contents to "审核内容库",
        Routes.Home to "当前情况",
        Routes.ContentDetail to "视频详情",
        Routes.Feedback to "反馈与错误举报",
        Routes.Mine to "我的 · 数据与授权",
        Routes.Fallback to "服务不可用",
    )
}

/** 页面骨架：顶部栏 + 内容区（二级页统一用它） */
@Composable
fun ScaffoldPage(
    code: String,
    onBack: (() -> Unit)? = null,
    trailing: @Composable (() -> Unit)? = null,
    content: @Composable (androidx.compose.foundation.layout.ColumnScope.() -> Unit),
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppColors.Bg)
            .padding(horizontal = AppDimens.PageMargin),
    ) {
        TopBar(title = PageTitles.map[code] ?: code, onBack = onBack, trailing = { trailing?.invoke() })
        content()
    }
}

/** 占位页：T43 只搭骨架，各页在 T44–T50 逐个还原。 */
@Composable
fun PlaceholderScreen(code: String, onBack: (() -> Unit)? = null) {
    ScaffoldPage(code = code, onBack = onBack) {
        Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
            Text(
                text = "${PageTitles.map[code] ?: code}\n（$code）",
                color = AppColors.Text3,
                textAlign = TextAlign.Center,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            )
        }
    }
}
