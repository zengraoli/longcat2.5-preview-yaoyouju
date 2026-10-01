package com.yaoyouju.app.feature.contents

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.data.ContentItem
import kotlinx.coroutines.launch

val CONTENT_CATEGORIES = listOf("全部", "报告术语", "节段位置", "医生会观察什么", "信息来源怎么看", "生活影响")

data class ContentsUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val category: String = "全部",
    val recommended: List<ContentItem> = emptyList(),
    val all: List<ContentItem> = emptyList(),
    val filtered: List<ContentItem> = emptyList(),
    val query: String = "",
)

class ContentsViewModel : ViewModel() {

    var state by mutableStateOf(ContentsUiState())
        private set

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true, error = null)
            val publishedResult = runCatching { apiCall { AppGraph.api.listPublishedContents() } }
            val failure = publishedResult.exceptionOrNull()
            if (failure is com.yaoyouju.app.core.network.ApiException && failure.isOffline) {
                com.yaoyouju.app.AppGraph.appState.fallbackErrorCode = "NET-5002"
                state = state.copy(loading = false, error = failure.message)
                return@launch
            }
            val published = publishedResult.getOrNull().orEmpty()
            val recommended = runCatching { apiCall { AppGraph.api.recommendedContents() } }
                .getOrNull().orEmpty().ifEmpty { published.take(2) }
            state = state.copy(
                loading = false,
                recommended = recommended,
                all = published,
                filtered = applyFilter(published, state.category, state.query),
            )
        }
    }

    fun selectCategory(category: String) {
        state = state.copy(category = category, filtered = applyFilter(state.all, category, state.query))
    }

    fun setQuery(query: String) {
        state = state.copy(query = query, filtered = applyFilter(state.all, state.category, query))
    }

    private fun applyFilter(items: List<ContentItem>, category: String, query: String): List<ContentItem> {
        return items.filter { item ->
            matchesCategory(item, category) &&
                (query.isBlank() || item.title.contains(query, ignoreCase = true))
        }
    }

    private fun matchesCategory(item: ContentItem, category: String): Boolean {
        if (category == "全部") return true
        val haystack = listOfNotNull(item.title, item.applicableScope, item.notApplicable).joinToString(" ")
        val keywords = when (category) {
            "报告术语" -> listOf("术语", "报告", "影像", "椎间盘", "硬膜囊", "节段")
            "节段位置" -> listOf("节段", "位置", "L5", "S1")
            "医生会观察什么" -> listOf("观察", "复诊", "查体", "就医", "红旗")
            "信息来源怎么看" -> listOf("来源", "证据", "术语")
            "生活影响" -> listOf("生活", "久坐", "睡眠", "搬", "活动", "姿势", "训练")
            else -> emptyList()
        }
        return keywords.isEmpty() || keywords.any { haystack.contains(it) }
    }
}
