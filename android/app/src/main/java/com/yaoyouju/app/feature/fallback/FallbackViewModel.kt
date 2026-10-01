package com.yaoyouju.app.feature.fallback

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.EmergencyTips
import com.yaoyouju.app.core.components.LocalSafetyTips
import com.yaoyouju.app.core.network.apiCall
import kotlinx.coroutines.launch

data class FallbackUiState(
    val errorCode: String = "",
    val showEmergency: Boolean = false,
    val emergency: EmergencyTips = LocalSafetyTips.tips(),
)

class FallbackViewModel : ViewModel() {

    var state by mutableStateOf(FallbackUiState())
        private set

    init {
        // 错误码由进入回退页前设置（分析失败 ANL-503 / 网络不可达 NET-5002），不再固定显示
        state = state.copy(errorCode = AppGraph.appState.fallbackErrorCode)
        viewModelScope.launch {
            runCatching { apiCall { AppGraph.api.getSafetyTips() } }.getOrNull()?.let { tips ->
                state = state.copy(emergency = EmergencyTips(tips.title, tips.redFlags, tips.note))
            }
        }
    }

    fun setShowEmergency(show: Boolean) {
        state = state.copy(showEmergency = show)
    }
}
