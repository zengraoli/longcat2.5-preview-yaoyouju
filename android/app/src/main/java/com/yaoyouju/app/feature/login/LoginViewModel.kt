package com.yaoyouju.app.feature.login

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.EmergencyTips
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.data.LoginRequest
import com.yaoyouju.app.data.SmsCodeRequest
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class LoginUiState(
    val phone: String = "",
    val code: String = "",
    val agreed: Boolean = false,
    val consented: Boolean = false,
    val countdown: Int = 0,
    val loading: Boolean = false,
    val showEmergency: Boolean = false,
    val emergency: EmergencyTips = EmergencyTips(
        title = "出现以下情况请及时就医",
        redFlags = emptyList(),
        note = "本提示不构成诊断；如症状持续或加重，请前往正规医疗机构就诊。",
    ),
)

class LoginViewModel : ViewModel() {

    var state by mutableStateOf(LoginUiState())
        private set

    init {
        viewModelScope.launch {
            runCatching { apiCall { AppGraph.api.getSafetyTips() } }.getOrNull()?.let { tips ->
                state = state.copy(
                    emergency = EmergencyTips(tips.title, tips.redFlags, tips.note),
                )
            }
        }
    }

    fun onPhoneChange(value: String) {
        state = state.copy(phone = value.filter { it.isDigit() }.take(11))
    }

    fun onCodeChange(value: String) {
        state = state.copy(code = value.filter { it.isDigit() }.take(6))
    }

    fun toggleAgreed() {
        state = state.copy(agreed = !state.agreed)
    }

    fun toggleConsented() {
        state = state.copy(consented = !state.consented)
    }

    fun setShowEmergency(show: Boolean) {
        state = state.copy(showEmergency = show)
    }

    fun sendCode() {
        val phone = state.phone
        if (!Regex("^1\\d{10}$").matches(phone)) {
            AppGraph.appState.toast("请输入正确的手机号")
            return
        }
        viewModelScope.launch {
            try {
                apiCall { AppGraph.api.sendSmsCode(SmsCodeRequest(phone)) }
                AppGraph.appState.toast("验证码已发送（演示固定 123456）")
                var left = 60
                state = state.copy(countdown = left)
                while (left > 0) {
                    delay(1000)
                    left -= 1
                    state = state.copy(countdown = left)
                }
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            }
        }
    }

    fun login(onSuccess: () -> Unit) {
        if (!state.agreed) {
            AppGraph.appState.toast("请先阅读并同意用户协议")
            return
        }
        if (!state.consented) {
            AppGraph.appState.toast("请单独同意处理健康信息")
            return
        }
        if (!Regex("^1\\d{10}$").matches(state.phone)) {
            AppGraph.appState.toast("请输入正确的手机号")
            return
        }
        if (state.code.isBlank()) {
            AppGraph.appState.toast("请输入验证码")
            return
        }
        viewModelScope.launch {
            state = state.copy(loading = true)
            try {
                val scopes = if (state.consented) listOf("健康信息处理") else emptyList()
                val result = apiCall { AppGraph.api.login(LoginRequest(state.phone, state.code, scopes)) }
                if (result == null) {
                    AppGraph.appState.toast("登录失败，请重试")
                    return@launch
                }
                // 先落盘新令牌，再拿脱敏手机号；否则 getMe 会带着旧令牌（或空）请求而 401，
                // 触发全局“登录过期”把刚登录的用户又弹回登录页
                AppGraph.appState.sessionExpired = false
                AppGraph.session.saveSession(result.token, null)
                val masked = runCatching { apiCall { AppGraph.api.getMe() } }.getOrNull()?.maskedPhone
                AppGraph.session.saveSession(result.token, masked)
                onSuccess()
            } catch (e: ApiException) {
                AppGraph.appState.toast(e.message)
            } finally {
                state = state.copy(loading = false)
            }
        }
    }
}
