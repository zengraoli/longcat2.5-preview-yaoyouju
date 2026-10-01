package com.yaoyouju.app.feature.fallback

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.EmergencyTips
import com.yaoyouju.app.core.network.apiCall
import kotlinx.coroutines.launch

data class FallbackUiState(
    val errorCode: String = "ANL-503",
    val showEmergency: Boolean = false,
    val emergency: EmergencyTips = EmergencyTips(
        title = "出现以下情况请及时就医",
        redFlags = emptyList(),
        note = "本提示不构成诊断；如症状持续或加重，请前往正规医疗机构就诊。",
    ),
)

class FallbackViewModel : ViewModel() {

    var state by mutableStateOf(FallbackUiState())
        private set

    init {
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
