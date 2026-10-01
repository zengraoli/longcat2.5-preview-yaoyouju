package com.yaoyouju.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.YaoyoujuTheme
import com.yaoyouju.app.core.navigation.DeepLinkRequest
import com.yaoyouju.app.core.navigation.Routes
import com.yaoyouju.app.core.navigation.YaoyoujuApp

class MainActivity : ComponentActivity() {

    /** deep link 请求：带自增序号，保证重复打开同一页面也能触发导航 */
    private val deepLink = mutableStateOf<DeepLinkRequest?>(null)
    private var deepLinkSeq = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        handleDeepLink(intent)
        setContent {
            YaoyoujuTheme {
                Surface(modifier = Modifier.fillMaxSize().background(AppColors.Bg), color = AppColors.Bg) {
                    YaoyoujuApp(deepLink = deepLink.value)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLink(intent)
    }

    private fun handleDeepLink(intent: Intent?) {
        val route = Routes.fromDeepLink(intent?.data?.host)
        if (route != null) {
            deepLinkSeq += 1
            deepLink.value = DeepLinkRequest(deepLinkSeq, route)
        }
    }
}
