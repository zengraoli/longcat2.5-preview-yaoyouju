package com.yaoyouju.app.feature.record

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.AddSymptomLogRequest
import com.yaoyouju.app.data.CreateEpisodeRequest
import kotlinx.coroutines.launch

val SIT_OPTIONS = listOf("<15分钟", "15-30", "30-60", ">60分钟")
val SIT_MINUTES = mapOf("<15分钟" to 10, "15-30" to 22, "30-60" to 45, ">60分钟" to 70)
val PLANNED_OPTIONS = listOf("能", "部分", "不能")
val SLEEP_OPTIONS = listOf(0 to "没影响", 1 to "偶尔醒", 2 to "常醒", 3 to "几乎没睡")
val CHANGE_OPTIONS = listOf("加重", "差不多", "减轻")
val LEG_OPTIONS = listOf("有", "没有", "尚未确认")
val ACTIVITY_OPTIONS = listOf("步行", "热敷", "按医嘱用药", "休息", "康复练习", "工作/久坐", "其他")

data class RecordUiState(
    val date: String = BeijingTime.today(),
    val sitMinutes: String? = null,
    val plannedActivityDone: String? = null,
    val sleepImpact: Int? = null,
    val changeVsYesterday: String? = null,
    val legChange: String? = null,
    val activities: List<String> = emptyList(),
    val topWorry: String = "",
    val submitting: Boolean = false,
)

class RecordViewModel : ViewModel() {

    var state by mutableStateOf(RecordUiState())
        private set

    fun selectSit(value: String) {
        state = state.copy(sitMinutes = if (value.isBlank() || state.sitMinutes == value) null else value)
    }

    fun selectPlanned(value: String) {
        state = state.copy(plannedActivityDone = if (value.isBlank() || state.plannedActivityDone == value) null else value)
    }

    fun selectSleep(value: Int) {
        state = state.copy(sleepImpact = if (state.sleepImpact == value) null else value)
    }

    fun selectChange(value: String) {
        state = state.copy(changeVsYesterday = if (value.isBlank() || state.changeVsYesterday == value) null else value)
    }

    fun selectLeg(value: String) {
        state = state.copy(legChange = value)
    }

    fun toggleActivity(value: String) {
        val list = state.activities.toMutableList()
        if (list.contains(value)) list.remove(value) else list.add(value)
        state = state.copy(activities = list)
    }

    fun setTopWorry(value: String) {
        state = state.copy(topWorry = value)
    }

    fun save(onDone: () -> Unit) = saveInternal(updateCurrent = false, onDone = onDone)

    /** “保存并更新当前情况”：保存记录后立即刷新一页分析 */
    fun saveAndUpdate(onDone: () -> Unit) = saveInternal(updateCurrent = true, onDone = onDone)

    private fun saveInternal(updateCurrent: Boolean, onDone: () -> Unit) {
        viewModelScope.launch {
            state = state.copy(submitting = true)
            try {
                val episodeId = ensureEpisodeId()
                if (episodeId == null) {
                    AppGraph.appState.toast("无法建立病程，请稍后重试")
                    return@launch
                }
                apiCall {
                    AppGraph.api.addSymptomLog(
                        episodeId,
                        AddSymptomLogRequest(
                            occurredAt = BeijingTime.nowIso(),
                            sitMinutes = state.sitMinutes?.let { SIT_MINUTES[it] },
                            plannedActivityDone = state.plannedActivityDone ?: "尚未确认",
                            sleepImpact = state.sleepImpact,
                            topWorry = state.topWorry.ifBlank { "尚未确认" },
                            legChange = state.legChange ?: "尚未确认",
                            changeVsYesterday = state.changeVsYesterday ?: "尚未确认",
                            activitiesDone = state.activities.joinToString("、").ifBlank { "尚未确认" },
                        ),
                    )
                }
                if (updateCurrent) {
                    val safetyText = listOf(state.topWorry, state.changeVsYesterday.orEmpty(), state.legChange.orEmpty())
                        .filter { it.isNotBlank() && it != "尚未确认" && it != "没有" && it != "无" }
                        .joinToString("，")
                    val result = runCatching {
                        apiCall {
                            AppGraph.api.createAnalysis(
                                com.yaoyouju.app.data.CreateAnalysisRequest(episodeId, safetyText.ifBlank { null }),
                            )
                        }
                    }.getOrNull()
                    if (result != null && (result.status == "blocked" || result.taskId == null)) {
                        AppGraph.appState.requestRedFlag(result.safety.redFlags.map { it.name })
                    } else {
                        AppGraph.appState.toast("已保存并更新当前情况")
                    }
                } else {
                    AppGraph.appState.toast("已保存记录")
                }
                onDone()
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            } finally {
                state = state.copy(submitting = false)
            }
        }
    }

    private suspend fun ensureEpisodeId(): String? {
        val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
        if (episodes.isNotEmpty()) {
            AppGraph.appState.currentEpisode = episodes.first()
            return episodes.first().id
        }
        val created = runCatching {
            apiCall { AppGraph.api.createEpisode(CreateEpisodeRequest("腰痛", null, "尚未确认")) }
        }.getOrNull() ?: return null
        return created.id
    }
}
