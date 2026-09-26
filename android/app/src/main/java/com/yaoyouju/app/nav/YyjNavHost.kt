package com.yaoyouju.app.nav

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.yaoyouju.app.ui.screens.AnalysisScreen
import com.yaoyouju.app.ui.screens.ConfusionScreen
import com.yaoyouju.app.ui.screens.ReportScreen
import com.yaoyouju.app.ui.screens.ChangeScreen
import com.yaoyouju.app.ui.screens.ComparisonScreen
import com.yaoyouju.app.ui.screens.HomeScreen
import com.yaoyouju.app.ui.screens.LoginScreen
import com.yaoyouju.app.ui.screens.RedflagScreen
import com.yaoyouju.app.ui.screens.ContentScreen
import com.yaoyouju.app.ui.screens.FallbackScreen
import com.yaoyouju.app.ui.screens.FollowupScreen
import com.yaoyouju.app.ui.screens.FeedbackScreen
import com.yaoyouju.app.ui.screens.MineScreen
import com.yaoyouju.app.ui.screens.PlaceholderScreen
import com.yaoyouju.app.ui.screens.QaScreen
import com.yaoyouju.app.ui.screens.TimelineScreen
import com.yaoyouju.app.ui.screens.TodayScreen
import com.yaoyouju.app.ui.screens.VerifyScreen
import com.yaoyouju.app.ui.screens.VideoScreen

/**
 * 导航骨架：全部路由先接占位页，T44–T50 逐页替换为真实实现。
 * deep link：yaoyouju://<页面编号>
 */
@Composable
fun YyjNavHost(
    navController: NavHostController,
    deepLinkRoute: String?,
) {
    LaunchedEffect(deepLinkRoute) {
        if (!deepLinkRoute.isNullOrEmpty() && deepLinkRoute != Routes.LOGIN) {
            navController.navigate(deepLinkRoute) {
                launchSingleTop = true
            }
        }
    }

    NavHost(navController = navController, startDestination = Routes.LOGIN) {
        composable(Routes.LOGIN) {
            LoginScreen(onLoggedIn = {
                navController.navigate(Routes.HOME) {
                    popUpTo(Routes.LOGIN) { inclusive = true }
                }
            })
        }
        composable(Routes.CHANGE) { ChangeScreen(onNavigate = { navController.navigate(it) }) }
        composable(Routes.REDFLAG) {
            RedflagScreen(
                onBack = { navController.popBackStack() },
                onGoContent = { navController.navigate(Routes.CONTENT) },
            )
        }
        composable(Routes.HOME) { HomeScreen(onNavigate = { navController.navigate(it) }) }

        composable(Routes.CONFUSION) { ConfusionScreen(onNavigate = { navController.navigate(it) }) }
        composable(Routes.REPORT) { ReportScreen(onNavigate = { navController.navigate(it) }) }
        composable(Routes.VERIFY) {
            VerifyScreen(
                onBack = { navController.popBackStack() },
                onNavigate = { navController.navigate(it) },
            )
        }
        composable(Routes.ANALYSIS) {
            AnalysisScreen(
                onBack = { navController.popBackStack() },
                onNavigate = { navController.navigate(it) },
            )
        }
        composable(Routes.COMPARISON) {
            ComparisonScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.QA) { QaScreen(onNavigate = { navController.navigate(it) }) }
        composable(Routes.TIMELINE) { TimelineScreen(onNavigate = { navController.navigate(it) }) }
        composable(Routes.TODAY) {
            TodayScreen(
                onBack = { navController.popBackStack() },
                onNavigate = { navController.navigate(it) },
            )
        }
        composable(Routes.FOLLOWUP) { FollowupScreen(onNavigate = { navController.navigate(it) }) }
        composable(Routes.CONTENT) {
            ContentScreen(
                onBack = { navController.popBackStack() },
                onNavigate = { navController.navigate(it) },
            )
        }
        composable(Routes.VIDEO) { VideoScreen(onBack = { navController.popBackStack() }) }
        composable(Routes.FEEDBACK) { FeedbackScreen(onBack = { navController.popBackStack() }) }
        composable(Routes.MINE) {
            MineScreen(
                onNavigate = { navController.navigate(it) },
                onLogout = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.FALLBACK) {
            FallbackScreen(
                onBack = { navController.popBackStack() },
                onNavigate = { navController.navigate(it) },
            )
        }
    }
}
