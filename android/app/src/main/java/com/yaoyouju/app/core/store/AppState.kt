package com.yaoyouju.app.core.store

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.yaoyouju.app.data.AnalysisResult
import com.yaoyouju.app.data.Episode
import com.yaoyouju.app.data.SafetyCheckResult

/**
 * 跨页面共享的会话内状态：当前病程、最新分析、最近一次安全校验。
 * 只放内存，进程重启后从接口重新拉取。
 */
class AppState {
    var currentEpisode: Episode? by mutableStateOf(null)
    var latestAnalysis: AnalysisResult? by mutableStateOf(null)
    var lastSafety: SafetyCheckResult? by mutableStateOf(null)
    var selectedConfusions: List<String> by mutableStateOf(emptyList())
    var lastReportId: String? by mutableStateOf(null)

    /** 登录过期：由网络层置位，主界面观察后回到登录页 */
    var sessionExpired: Boolean by mutableStateOf(false)

    /** 全局提示（一次性） */
    var message: String? by mutableStateOf(null)

    fun toast(text: String) {
        message = text
    }

    val episodeId: String? get() = currentEpisode?.id
}
