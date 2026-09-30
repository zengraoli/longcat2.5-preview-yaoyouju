package com.yaoyouju.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.design.YaoyoujuTheme
import com.yaoyouju.app.core.navigation.Routes
import com.yaoyouju.app.core.navigation.YaoyoujuApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val deepLink = Routes.fromDeepLink(intent?.data?.host)
        setContent {
            YaoyoujuTheme {
                Surface(modifier = Modifier.fillMaxSize().background(AppColors.Bg), color = AppColors.Bg) {
                    YaoyoujuApp(startDeepLink = deepLink)
                }
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }
}
