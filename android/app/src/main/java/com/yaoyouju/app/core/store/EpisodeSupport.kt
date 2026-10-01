package com.yaoyouju.app.core.store

import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.data.CreateEpisodeRequest
import com.yaoyouju.app.data.Episode

/**
 * 病程 id 的获取与自动创建。
 * 新用户第一次写入时服务端会自动建好病程；网络异常必须向上抛出，
 * 让页面提示“网络不可用”，而不是吞掉异常后报“无法建立病程”。
 */
object EpisodeSupport {

    /** 当前病程 id；没有则创建一个。网络 / 服务异常直接抛出 ApiException。 */
    suspend fun ensureEpisodeId(): String {
        val episodes = apiCall { AppGraph.api.listEpisodes() }.orEmpty()
        val existing = episodes.firstOrNull()
        if (existing != null) {
            AppGraph.appState.currentEpisode = existing
            return existing.id
        }
        val created = apiCall {
            // 报告日期不是病程起病日期，不能当作 onsetDate，否则首页周数与病程起点会算错
            AppGraph.api.createEpisode(CreateEpisodeRequest("腰痛", null, "尚未确认"))
        }
        val episode = created ?: throw ApiException(5001, "服务返回数据为空")
        AppGraph.appState.currentEpisode = episode
        return episode.id
    }
}
