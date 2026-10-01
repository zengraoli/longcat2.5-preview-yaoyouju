package com.yaoyouju.app.feature.compare

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.AppCard
import com.yaoyouju.app.core.components.AppIcons
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.components.TopBar
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.AppDimens

/** A08 原文对照（R02） */
@Composable
fun CompareScreen(
    state: CompareUiState,
    onBack: () -> Unit,
    onSelectTab: (CompareTab) -> Unit,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    evidenceTitle: (String?) -> String,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AppColors.Bg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = AppDimens.PageMargin)
            .padding(bottom = 32.dp),
    ) {
        TopBar(title = "原文对照", onBack = onBack)

        // 查看方式
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            CompareTab.entries.forEach { tab ->
                val active = state.tab == tab
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(
                            if (active) AppColors.Surface else AppColors.Bg,
                            RoundedCornerShape(AppDimens.RadiusButton),
                        )
                        .border(
                            1.dp,
                            if (active) AppColors.Border else AppColors.Border,
                            RoundedCornerShape(AppDimens.RadiusButton),
                        )
                        .clickable { onSelectTab(tab) }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = tab.label,
                        color = if (active) AppColors.Text1 else AppColors.Text2,
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }
        }

        // 解释卡片
        if (state.tab == CompareTab.ByExplanation && state.current != null) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .background(AppColors.PrimaryLight, RoundedCornerShape(AppDimens.RadiusCard))
                    .padding(16.dp),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "解释②-${state.index + 1}",
                        color = AppColors.Primary,
                        style = MaterialTheme.typography.labelLarge,
                    )
                    Text(
                        text = if (state.currentLine > 0) "对应原文：第 ${state.currentLine} 行" else "对应原文：报告未提及",
                        color = AppColors.Text2,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Text(
                    text = state.current?.text.orEmpty(),
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 8.dp),
                )
                Text(
                    text = "来源：${evidenceTitle(state.current?.source)}",
                    color = AppColors.Ok,
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.padding(top = 6.dp),
                )
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    AppButton(text = "‹ 上一条", onClick = onPrev, type = AppButtonType.Secondary, modifier = Modifier.weight(1f))
                    AppButton(text = "下一条 ›", onClick = onNext, type = AppButtonType.Secondary, modifier = Modifier.weight(1f))
                }
            }
        }

        // 报告原文
        AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = AppIcons.Report,
                        contentDescription = null,
                        tint = AppColors.Text1,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(
                        text = "报告原文${if (state.reportDate.isNotBlank()) " · ${state.reportDate}" else ""} · ${state.examType}",
                        color = AppColors.Text1,
                        style = MaterialTheme.typography.titleSmall,
                    )
                }
                StatusTag(label = "未修改")
            }
            HighlightedReport(state = state)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp)
                    .border(0.dp, AppColors.Border),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    LegendItem(AppColors.Primary, "本条解释引用")
                    if (state.sideConflict) {
                        LegendItem(AppColors.Warn, "与你描述侧别不一致，需确认")
                    }
                }
            }
        }

        // 本段涉及的术语
        if (state.tab == CompareTab.ByTerm) {
            AppCard(modifier = Modifier.padding(bottom = AppDimens.CardGap)) {
                Text(
                    text = "本段涉及的术语",
                    color = AppColors.Text1,
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
                if (state.terms.isEmpty()) {
                    Text(text = "报告中未识别到术语", color = AppColors.Text3, style = MaterialTheme.typography.labelMedium)
                } else {
                    state.terms.forEach { term ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Text(
                                text = term.name,
                                color = AppColors.Primary,
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.padding(end = 4.dp),
                            )
                            Text(
                                text = term.def,
                                color = AppColors.Text1,
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }
                }
            }
        }

        TipBar(
            text = "报告中没有描述的内容（例如是否存在神经根水肿）不会被写成“已排除”，而会标为“报告未提及”。",
            type = TipBarType.Warn,
        )

        AppButton(
            text = "返回一页分析",
            onClick = onBack,
            type = AppButtonType.Secondary,
            block = true,
            modifier = Modifier.padding(top = 16.dp),
        )
    }
}

@Composable
private fun LegendItem(color: androidx.compose.ui.graphics.Color, text: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(8.dp).background(color, CircleShape))
        Text(text = text, color = AppColors.Text2, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun HighlightedReport(state: CompareUiState) {
    val rawText = state.rawText.ifBlank { "暂无报告原文" }
    val tealTerms = remember(state.current, rawText) {
        TERM_NAMES.filter { term ->
            rawText.contains(term) && state.current?.text?.contains(term) == true
        }
    }
    val warnTerms = remember(state.sideConflict, rawText) {
        if (state.sideConflict) {
            listOf("左侧", "右侧", "左边", "右边").filter { rawText.contains(it) }
        } else {
            emptyList()
        }
    }
    val annotated: AnnotatedString = remember(rawText, tealTerms, warnTerms) {
        val isTeal = BooleanArray(rawText.length)
        val isWarn = BooleanArray(rawText.length)
        fun mark(target: BooleanArray, term: String) {
            var i = rawText.indexOf(term)
            while (i >= 0) {
                for (j in i until minOf(i + term.length, rawText.length)) target[j] = true
                i = rawText.indexOf(term, i + 1)
            }
        }
        tealTerms.forEach { mark(isTeal, it) }
        warnTerms.forEach { mark(isWarn, it) }
        for (i in isTeal.indices) if (isWarn[i]) isTeal[i] = false

        buildAnnotatedString {
            var i = 0
            while (i < rawText.length) {
                val teal = isTeal[i]
                val warn = isWarn[i]
                var j = i
                while (j < rawText.length && isTeal[j] == teal && isWarn[j] == warn) j++
                val segment = rawText.substring(i, j)
                when {
                    warn -> withStyle(
                        SpanStyle(color = AppColors.Warn, fontWeight = FontWeight.Medium),
                    ) { append(segment) }

                    teal -> withStyle(
                        SpanStyle(color = AppColors.Primary, fontWeight = FontWeight.Medium),
                    ) { append(segment) }

                    else -> append(segment)
                }
                i = j
            }
        }
    }
    Text(
        text = annotated,
        color = AppColors.Text1,
        style = MaterialTheme.typography.bodyMedium,
        lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.25f,
    )
}
