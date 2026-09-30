package com.yaoyouju.app.feature.contentdetail

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.ContentDetail
import com.yaoyouju.app.data.RetellRequest
import kotlinx.coroutines.launch

data class ContentDetailUiState(
    val loading: Boolean = true,
    val detail: ContentDetail? = null,
    val retell: String = "",
    val submitted: Boolean = false,
    val expandedSubtitle: Boolean = true,
    val feedback: String? = null,
)

class ContentDetailViewModel : ViewModel() {

    var state by mutableStateOf(ContentDetailUiState())
        private set

    fun load(id: String) {
        if (id.isBlank()) {
            state = state.copy(loading = false)
            return
        }
        viewModelScope.launch {
            state = state.copy(loading = true)
            val detail = runCatching { apiCall { AppGraph.api.getContentDetail(id) } }.getOrNull()
            state = state.copy(loading = false, detail = detail)
        }
    }

    fun setRetell(text: String) {
        state = state.copy(retell = text)
    }

    fun toggleSubtitle() {
        state = state.copy(expandedSubtitle = !state.expandedSubtitle)
    }

    fun submitRetell() {
        val detail = state.detail ?: return
        if (state.retell.isBlank()) {
            AppGraph.appState.toast("请先写一句你的理解")
            return
        }
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.submitRetell(detail.id, RetellRequest(state.retell)) }
                state = state.copy(submitted = true)
                AppGraph.appState.toast("已提交")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun feedback(option: String) {
        state = state.copy(feedback = option)
        AppGraph.appState.toast(if (option == "内容有误（举报）") "已记录举报" else "感谢反馈")
    }

    fun reviewDate(): String {
        val reviews = state.detail?.reviews.orEmpty()
        val date = reviews.firstOrNull()?.reviewedAt ?: state.detail?.publishedAt
        return BeijingTime.date(date).take(7)
    }
}
