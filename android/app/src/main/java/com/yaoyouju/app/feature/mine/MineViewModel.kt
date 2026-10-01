package com.yaoyouju.app.feature.mine

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.EmergencyTips
import com.yaoyouju.app.core.components.LocalSafetyTips
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.util.BeijingTime
import com.yaoyouju.app.data.ConsentRequest
import com.yaoyouju.app.data.ConsentView
import kotlinx.coroutines.launch

data class MineUiState(
    val loading: Boolean = true,
    val maskedPhone: String = "—",
    val anonymousId: String = "",
    val consents: List<ConsentView> = emptyList(),
    val consentSummary: String = "健康信息处理：未开启 · 分享/产品改进：未开启",
    val showEmergency: Boolean = false,
    val showConsents: Boolean = false,
    val showDeleteConfirm: Boolean = false,
    val showRevokeConfirm: Boolean = false,
    val healthGranted: Boolean = false,
    val modelName: String = "—",
    val contentLibVersion: String = "—",
    val emergency: EmergencyTips = LocalSafetyTips.tips(),
)

class MineViewModel : ViewModel() {

    var state by mutableStateOf(MineUiState())
        private set

    fun load() {
        viewModelScope.launch {
            state = state.copy(loading = true)
            val me = runCatching { apiCall { AppGraph.api.getMe() } }.getOrNull()
            val consents = runCatching { apiCall { AppGraph.api.getConsents() } }.getOrNull().orEmpty()
            val tips = runCatching { apiCall { AppGraph.api.getSafetyTips() } }.getOrNull()
            val episodes = runCatching { apiCall { AppGraph.api.listEpisodes() } }.getOrNull().orEmpty()
            val analysis = episodes.firstOrNull()?.let {
                runCatching { apiCall { AppGraph.api.getLatestAnalysis(it.id) } }.getOrNull()
            }
            state = state.copy(
                loading = false,
                maskedPhone = me?.maskedPhone ?: AppGraph.session.maskedPhone ?: "—",
                anonymousId = me?.id?.let { "U-${it.take(4).uppercase()}…" } ?: "",
                consents = consents,
                consentSummary = summarize(consents),
                healthGranted = consents.firstOrNull { it.scope == "健康信息处理" }?.granted == true,
                modelName = analysis?.modelReleaseId ?: state.modelName,
                contentLibVersion = analysis?.contentLibVersion ?: state.contentLibVersion,
                emergency = tips?.let { EmergencyTips(it.title, it.redFlags, it.note) } ?: state.emergency,
            )
        }
    }

    private fun summarize(consents: List<ConsentView>): String {
        val health = consents.firstOrNull { it.scope == "健康信息处理" }
        val healthText = if (health?.granted == true) {
            "已同意 ${BeijingTime.date(health.grantedAt)}"
        } else {
            "未开启"
        }
        val other = consents.filter { it.scope != "健康信息处理" && it.granted }
        val otherText = if (other.isEmpty()) "未开启" else other.joinToString("、") { it.scope }
        return "健康信息处理：$healthText · 分享/产品改进：$otherText"
    }

    fun setShowEmergency(show: Boolean) {
        state = state.copy(showEmergency = show)
    }

    fun setShowConsents(show: Boolean) {
        state = state.copy(showConsents = show)
    }

    fun setShowDeleteConfirm(show: Boolean) {
        state = state.copy(showDeleteConfirm = show)
    }

    fun requestRevokeHealthConsent() {
        state = state.copy(showRevokeConfirm = true)
    }

    fun dismissRevokeHealthConsent() {
        state = state.copy(showRevokeConfirm = false)
    }

    fun revokeHealthConsent() {
        viewModelScope.launch {
            try {
                val consents = apiCall { AppGraph.api.setConsent(ConsentRequest("健康信息处理", "false")) }
                state = state.copy(
                    consents = consents.orEmpty(),
                    consentSummary = summarize(consents.orEmpty()),
                    healthGranted = false,
                    showRevokeConfirm = false,
                )
                AppGraph.appState.toast("已撤回“处理健康信息”的同意")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun grantHealthConsent() {
        viewModelScope.launch {
            try {
                val consents = apiCall { AppGraph.api.setConsent(ConsentRequest("健康信息处理", "true")) }
                state = state.copy(
                    consents = consents.orEmpty(),
                    consentSummary = summarize(consents.orEmpty()),
                    healthGranted = true,
                )
                AppGraph.appState.toast("已重新同意处理健康信息")
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun exportData(onText: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val data = apiCall { AppGraph.api.exportData() }
                val text = if (data == null) {
                    "{}"
                } else {
                    val pretty = kotlinx.serialization.json.Json { prettyPrint = true }
                    pretty.encodeToString(
                        kotlinx.serialization.json.JsonElement.serializer(),
                        kotlinx.serialization.json.JsonObject(data),
                    )
                }
                onText(text)
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun deleteAccount(onDeleted: () -> Unit) {
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.deleteAccount() }
                AppGraph.session.clear()
                onDeleted()
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            runCatching { apiCall { AppGraph.api.logout() } }
            AppGraph.session.clear()
            onLoggedOut()
        }
    }
}
