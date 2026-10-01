package com.yaoyouju.app

import android.app.Application
import com.yaoyouju.app.core.network.ApiEvents

class YaoyoujuApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        AppGraph.init(this, BuildConfig.API_BASE_URL)
        ApiEvents.onUnauthorized = {
            AppGraph.appState.sessionExpired = true
        }
        ApiEvents.onConsentMissing = {
            AppGraph.appState.toast("已撤回健康信息处理同意，请在“我的”重新同意后再记录")
        }
    }
}
