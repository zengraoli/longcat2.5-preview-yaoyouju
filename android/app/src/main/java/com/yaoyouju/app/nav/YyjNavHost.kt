package com.yaoyouju.app.nav

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.yaoyouju.app.ui.screens.AnalysisScreen
import com.yaoyouju.app.ui.screens.ChangeScreen
import com.yaoyouju.app.ui.screens.ComparisonScreen
import com.yaoyouju.app.ui.screens.HomeScreen
import com.yaoyouju.app.ui.screens.LoginScreen
import com.yaoyouju.app.ui.screens.RedflagScreen
import com.yaoyouju.app.ui.screens.PlaceholderScreen
import com.yaoyouju.app.ui.screens.QaScreen
import com.yaoyouju.app.ui.screens.TimelineScreen
import com.yaoyouju.app.ui.screens.TodayScreen

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

        composable(Routes.CONFUSION) { PlaceholderScreen("A04 选择主要困惑") }
        composable(Routes.REPORT) { PlaceholderScreen("A05 录入报告与医嘱") }
        composable(Routes.VERIFY) { PlaceholderScreen("A06 核对整理后的信息") }
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
        composable(Routes.FOLLOWUP) { PlaceholderScreen("A12 复诊准备") }
        composable(Routes.CONTENT) { PlaceholderScreen("A13 审核内容库") }
        composable(Routes.VIDEO) { PlaceholderScreen("A15 视频详情") }
        composable(Routes.FEEDBACK) { PlaceholderScreen("A16 反馈与举报") }
        composable(Routes.MINE) { PlaceholderScreen("A17 我的") }
        composable(Routes.FALLBACK) { PlaceholderScreen("A18 服务不可用回退") }
    }
}
