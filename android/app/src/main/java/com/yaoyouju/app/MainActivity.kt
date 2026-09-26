package com.yaoyouju.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.yaoyouju.app.data.TokenStore
import com.yaoyouju.app.nav.DeepLinks
import com.yaoyouju.app.nav.YyjNavHost
import com.yaoyouju.app.ui.theme.Bg
import com.yaoyouju.app.ui.theme.YyjTheme

class MainActivity : ComponentActivity() {

    private var deepLinkRoute by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        TokenStore.init(this)
        deepLinkRoute = extractPageRoute(intent)

        setContent {
            YyjTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = Bg) {
                    val navController = rememberNavController()
                    YyjNavHost(navController = navController, deepLinkRoute = deepLinkRoute)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        extractPageRoute(intent)?.let { deepLinkRoute = it }
    }

    /** yaoyouju://A07 → "A07" */
    private fun extractPageRoute(intent: Intent?): String? {
        val data = intent?.data?.toString() ?: return null
        return DeepLinks.routeFrom(data)
    }
}
