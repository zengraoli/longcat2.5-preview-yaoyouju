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
    }
}
