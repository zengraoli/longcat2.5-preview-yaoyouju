package com.yaoyouju.app.feature.confirm

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.store.EpisodeSupport
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AddEventRequest
import kotlinx.coroutines.launch

val CHANGE_OPTIONS = listOf("加重", "差不多", "减轻", "尚未确认")
val RED_FLAG_OPTIONS = listOf(
    "大小便控制异常",
    "会阴区或鞍区麻木",
    "双腿进行性无力",
    "发热、夜间痛持续不缓解或体重明显下降",
)
val SIDE_OPTIONS = listOf("左侧", "右侧", "双侧", "尚未确认")
val ONSET_OPTIONS = listOf("记不清", "约1周内", "约1个月内", "超过3个月")

data class ConfirmUiState(
    val step: Int = 1,
    val change: String = "",
    val redFlags: List<String> = emptyList(),
    val noneSelected: Boolean = false,
    val uncertain: Boolean = false,
    val side: String = "",
    val onset: String = "",
    val onsetDate: String = "",
    val submitting: Boolean = false,
    val showDatePicker: Boolean = false,
)

class ConfirmViewModel : ViewModel() {

    var state by mutableStateOf(ConfirmUiState())
        private set

    fun selectChange(value: String) {
        state = state.copy(change = value)
    }

    fun toggleRedFlag(option: String) {
        val list = state.redFlags.toMutableList()
        if (list.contains(option)) list.remove(option) else list.add(option)
        state = state.copy(redFlags = list, noneSelected = if (list.isNotEmpty()) false else state.noneSelected)
    }

    /** 勾选红旗项的当下立即进入就医提示（不等“下一步”、不依赖网络） */
    fun selectRedFlag(option: String, onRedFlag: () -> Unit) {
        val list = state.redFlags.toMutableList()
        if (list.contains(option)) {
            list.remove(option)
            state = state.copy(redFlags = list)
            return
        }
        list.add(option)
        state = state.copy(redFlags = list, noneSelected = false)
        AppGraph.appState.redFlagSelected = list
        AppGraph.appState.redFlagFromSelection = true
        viewModelScope.launch { saveRedFlagEvent(list) }
        onRedFlag()
    }

    fun toggleNone() {
        val next = !state.noneSelected
        state = state.copy(noneSelected = next, redFlags = if (next) emptyList() else state.redFlags)
    }

    fun toggleUncertain() {
        state = state.copy(uncertain = !state.uncertain)
    }

    fun selectSide(value: String) {
        state = state.copy(side = value)
    }

    fun selectOnset(value: String) {
        state = state.copy(onset = value)
    }

    fun setOnsetDate(value: String) {
        state = state.copy(onsetDate = value)
    }

    fun setShowDatePicker(show: Boolean) {
        state = state.copy(showDatePicker = show)
    }

    /** 下一步：先做本地红旗判断（离线也能命中）；否则再做服务端安全预检。 */
    fun next(onRedFlag: () -> Unit, onContinue: () -> Unit) {
        if (state.redFlags.isNotEmpty()) {
            AppGraph.appState.redFlagSelected = state.redFlags
            AppGraph.appState.redFlagFromSelection = true
            viewModelScope.launch { saveRedFlagEvent(state.redFlags) }
            onRedFlag()
            return
        }
        val text = buildList {
            if (state.change.isNotBlank()) add("症状${state.change}")
            addAll(state.redFlags)
            if (state.side.isNotBlank()) add("疼痛涉及${state.side}")
            if (state.onset == "记不清") add("开始时间记不清")
        }.joinToString("，")

        viewModelScope.launch {
            state = state.copy(submitting = true)
            val safety = runCatching { apiCall { AppGraph.api.checkSafety(mapOf("text" to text, "source" to "confirm")) } }
                .getOrNull()
            if (safety != null && !safety.passed && safety.redFlags.isNotEmpty()) {
                AppGraph.appState.redFlagSelected = safety.redFlags.map { it.name }
                AppGraph.appState.lastSafety = safety
                saveRedFlagEvent(state.redFlags)
                state = state.copy(submitting = false)
                onRedFlag()
                return@launch
            }
            saveConfirmEvent()
            state = state.copy(submitting = false)
            onContinue()
        }
    }

    private suspend fun currentEpisodeId(): String? = runCatching { EpisodeSupport.ensureEpisodeId() }.getOrNull()

    private suspend fun saveRedFlagEvent(flags: List<String>) {
        runCatching {
            val episodeId = AppGraph.appState.episodeId ?: currentEpisodeId() ?: return@runCatching
            apiCall {
                AppGraph.api.addEvent(
                    episodeId,
                    AddEventRequest(
                        eventType = "症状",
                        occurredAt = BeijingTime.nowIso(),
                        sourceType = "自述",
                        rawText = "确认时选择的红旗项：${flags.joinToString("、")}",
                        verifyStatus = "尚未确认",
                    ),
                )
            }
        }
    }

    private suspend fun saveConfirmEvent() {
        runCatching {
            val parts = buildList {
                if (state.change.isNotBlank()) add("与上次相比：${state.change}")
                if (state.side.isNotBlank()) add("疼痛涉及：${state.side}")
                if (state.onsetDate.isNotBlank()) add("开始日期：${state.onsetDate}")
                if (state.onset == "记不清") add("开始日期记不清")
                if (state.onset.isNotBlank() && state.onset != "记不清") add("开始时间：${state.onset}")
                if (state.noneSelected) add("红旗项：以上都没有")
                else if (state.redFlags.isNotEmpty()) add("红旗项：${state.redFlags.joinToString("、")}")
            }.joinToString("；")
            if (parts.isBlank()) return@runCatching
            val episodeId = currentEpisodeId() ?: return@runCatching
            apiCall {
                AppGraph.api.addEvent(
                    episodeId,
                    AddEventRequest(
                        eventType = "症状",
                        occurredAt = BeijingTime.nowIso(),
                        sourceType = "自述",
                        rawText = "当前关键变化确认：$parts",
                        verifyStatus = "尚未确认",
                    ),
                )
            }
        }
    }
}
