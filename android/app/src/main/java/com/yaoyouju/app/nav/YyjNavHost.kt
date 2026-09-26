package com.yaoyouju.app.nav

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.yaoyouju.app.ui.screens.ChangeScreen
import com.yaoyouju.app.ui.screens.HomeScreen
import com.yaoyouju.app.ui.screens.LoginScreen
import com.yaoyouju.app.ui.screens.PlaceholderScreen

/**
 * 导航骨架。A01 登录与 A14 首页为真实实现，其余页面在 T45–T50 依次接入。
 * deepLinkRoute（yaoyouju://A01…A18）在首次组合时导航到对应页面。
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
        composable(Routes.CHANGE) { ChangeScreen(onBack = { navController.popBackStack() }) }
        composable(Routes.HOME) { HomeScreen(onNavigate = { navController.navigate(it) }) }

        composable(Routes.REDFLAG) { PlaceholderScreen("A03 就医提示") }
        composable(Routes.CONFUSION) { PlaceholderScreen("A04 选择主要困惑") }
        composable(Routes.REPORT) { PlaceholderScreen("A05 录入报告与医嘱") }
        composable(Routes.VERIFY) { PlaceholderScreen("A06 核对整理后的信息") }
        composable(Routes.ANALYSIS) { PlaceholderScreen("A07 一页分析") }
        composable(Routes.COMPARISON) { PlaceholderScreen("A08 原文对照") }
        composable(Routes.QA) { PlaceholderScreen("A09 问与解释") }
        composable(Routes.TIMELINE) { PlaceholderScreen("A10 病程") }
        composable(Routes.TODAY) { PlaceholderScreen("A11 记录今天") }
        composable(Routes.FOLLOWUP) { PlaceholderScreen("A12 复诊准备") }
        composable(Routes.CONTENT) { PlaceholderScreen("A13 审核内容库") }
        composable(Routes.VIDEO) { PlaceholderScreen("A15 视频详情") }
        composable(Routes.FEEDBACK) { PlaceholderScreen("A16 反馈与举报") }
        composable(Routes.MINE) { PlaceholderScreen("A17 我的") }
        composable(Routes.FALLBACK) { PlaceholderScreen("A18 服务不可用回退") }
    }
}
