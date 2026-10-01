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

    /** 红旗是否来自 A02 的用户主动勾选；系统检测（问答 / 记录 / 分析）时为 false，A03 文案不同 */
    var redFlagFromSelection: Boolean by mutableStateOf(false)

    /** 任意页面命中红旗时递增，主界面观察后跳转就医提示页（问答、记录等） */
    var redFlagRequest: Int by mutableStateOf(0)

    fun requestRedFlag(items: List<String>, fromSelection: Boolean = false) {
        if (items.isNotEmpty()) redFlagSelected = items
        redFlagFromSelection = fromSelection
        redFlagRequest += 1
    }

    /** 登录过期：由网络层置位，主界面观察后回到登录页 */
    var sessionExpired: Boolean by mutableStateOf(false)

    /** 进入服务不可用页时携带的错误码（ANL-503 分析失败 / NET-5002 网络不可达等） */
    var fallbackErrorCode: String by mutableStateOf("ANL-503")

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
