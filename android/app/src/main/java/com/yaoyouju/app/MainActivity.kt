package com.yaoyouju.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.yaoyouju.app.nav.DeepLinks
import com.yaoyouju.app.nav.YyjNavHost
import com.yaoyouju.app.ui.theme.YyjTheme

class MainActivity : ComponentActivity() {

    private var deepLinkRoute by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        deepLinkRoute = DeepLinks.routeFrom(intent?.data?.toString())
        setContent {
            YyjTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    val navController = rememberNavController()
                    YyjNavHost(
                        navController = navController,
                        deepLinkRoute = deepLinkRoute,
                    )
                }
            }
        }
    }
}
