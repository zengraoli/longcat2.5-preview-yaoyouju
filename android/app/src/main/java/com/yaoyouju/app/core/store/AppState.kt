package com.yaoyouju.app.core.store

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.yaoyouju.app.data.AnalysisResult
import com.yaoyouju.app.data.Episode
import com.yaoyouju.app.data.SafetyCheckResult
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ReceiveChannel

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

    /** A02 确认页选中的红旗项，供 A03 就医提示展示 */
    var redFlagSelected: List<String> by mutableStateOf(emptyList())

    /** 任意页面命中红旗时递增，主界面观察后跳转就医提示页（问答、记录等） */
    var redFlagRequest: Int by mutableStateOf(0)

    fun requestRedFlag(items: List<String>) {
        if (items.isNotEmpty()) redFlagSelected = items
        redFlagRequest += 1
    }

    /** 登录过期：由网络层置位，主界面观察后回到登录页 */
    var sessionExpired: Boolean by mutableStateOf(false)

    /**
     * 全局一次性提示。用 Channel 而不是可空 state：
     * 若用 state，消费时把它置回 null 会让 LaunchedEffect 的 key 变化、协程被取消，
     * showSnackbar 还没显示就被取消，于是所有提示都“看不到”。
     */
    private val messageChannel = Channel<String>(Channel.BUFFERED)
    val messages: ReceiveChannel<String> get() = messageChannel

    fun toast(text: String) {
        messageChannel.trySend(text)
    }

    val episodeId: String? get() = currentEpisode?.id
}
