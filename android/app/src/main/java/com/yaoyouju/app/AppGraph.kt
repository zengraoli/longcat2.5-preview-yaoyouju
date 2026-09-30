package com.yaoyouju.app

import android.content.Context
import com.yaoyouju.app.core.network.ApiClient
import com.yaoyouju.app.core.network.ApiService
import com.yaoyouju.app.core.store.AppState
import com.yaoyouju.app.core.store.SessionStore

/**
 * 极简依赖装配（service locator）。
 * 演示工程不引入 DI 框架，构造顺序在 Application 中完成。
 */
object AppGraph {
    lateinit var api: ApiService
        private set
    lateinit var session: SessionStore
        private set
    val appState: AppState = AppState()

    /** 测试可注入假接口 */
    fun overrideApi(service: ApiService) {
        api = service
    }

    fun init(context: Context, baseUrl: String) {
        session = SessionStore(context.applicationContext)
        api = ApiClient.create(baseUrl) { session.token }
    }
}
