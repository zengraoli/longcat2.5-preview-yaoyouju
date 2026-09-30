package com.yaoyouju.app.core.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.yaoyouju.app.AppGraph
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.feature.home.HomeRoute
import com.yaoyouju.app.feature.login.LoginRoute

/**
 * 单 Activity 的 Compose 导航图。
 * 每个路由对应设计稿的一个编号（A01–A18）。
 */
@Composable
fun YaoyoujuApp(startDeepLink: String? = null) {
    val navController = rememberNavController()
    val appState = AppGraph.appState
    val snackbarHostState = remember { SnackbarHostState() }

    var ready by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        AppGraph.session.load()
        ready = true
    }

    // deep link：yaoyouju://A07
    LaunchedEffect(startDeepLink) {
        val target = startDeepLink
        if (target != null && target != Routes.Login) {
            navController.navigate(target) { launchSingleTop = true }
        }
    }

    // 登录过期：回到登录页
    LaunchedEffect(appState.sessionExpired) {
        if (appState.sessionExpired) {
            appState.sessionExpired = false
            navController.navigate(Routes.Login) { popUpTo(0) { inclusive = true } }
        }
    }

    // 全局一次性提示
    LaunchedEffect(appState.message) {
        val message = appState.message
        if (message != null) {
            appState.message = null
            snackbarHostState.showSnackbar(message)
        }
    }

    Scaffold(
        containerColor = AppColors.Bg,
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { _ ->
        if (!ready) {
            Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg))
            return@Scaffold
        }
        val start = if (AppGraph.session.token.isNullOrBlank()) Routes.Login else Routes.Home
        NavHost(navController = navController, startDestination = start) {
            val back: () -> Unit = { navController.popBackStack() }

            fun routeOf(tab: TabDestination): String = when (tab) {
                TabDestination.Home -> Routes.Home
                TabDestination.Qa -> Routes.Qa
                TabDestination.Timeline -> Routes.Timeline
                TabDestination.Followup -> Routes.Summary
                TabDestination.Mine -> Routes.Mine
            }

            val onSelectTab: (TabDestination) -> Unit = { tab ->
                navController.navigate(routeOf(tab)) {
                    popUpTo(Routes.Home) { inclusive = false }
                    launchSingleTop = true
                }
            }

            composable(Routes.Login) {
                LoginRoute(
                    onLoggedIn = {
                        navController.navigate(Routes.Home) {
                            popUpTo(Routes.Login) { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                )
            }
            composable(Routes.Confirm) { PlaceholderScreen(Routes.Confirm, back) }
            composable(Routes.RedFlag) { PlaceholderScreen(Routes.RedFlag, back) }
            composable(Routes.Confusion) { PlaceholderScreen(Routes.Confusion, back) }
            composable(Routes.Report) { PlaceholderScreen(Routes.Report, back) }
            composable(Routes.Verify) { PlaceholderScreen(Routes.Verify, back) }
            composable(
                route = "${Routes.Analysis}?${Routes.AnalysisArg}={${Routes.AnalysisArg}}",
                arguments = listOf(navArgument(Routes.AnalysisArg) { type = NavType.StringType; defaultValue = "" }),
            ) { PlaceholderScreen(Routes.Analysis, back) }
            composable(Routes.ReportCompare) { PlaceholderScreen(Routes.ReportCompare, back) }
            composable(Routes.Qa) { PlaceholderScreen(Routes.Qa) }
            composable(Routes.Timeline) { PlaceholderScreen(Routes.Timeline) }
            composable(Routes.Record) { PlaceholderScreen(Routes.Record, back) }
            composable(Routes.Summary) { PlaceholderScreen(Routes.Summary) }
            composable(Routes.Contents) { PlaceholderScreen(Routes.Contents, back) }
            composable(Routes.Home) {
                HomeRoute(
                    onSelectTab = onSelectTab,
                    onConfirm = { navController.navigate(Routes.Confirm) },
                    onRecord = { navController.navigate(Routes.Record) },
                    onReport = { navController.navigate(Routes.Report) },
                    onQa = { onSelectTab(TabDestination.Qa) },
                    onSummary = { navController.navigate(Routes.Summary) },
                    onAnalysis = { id -> navController.navigate(Routes.analysis(id)) },
                    onContentDetail = { id -> navController.navigate(Routes.content(id)) },
                )
            }
            composable(
                route = "${Routes.ContentDetail}?${Routes.ContentArg}={${Routes.ContentArg}}",
                arguments = listOf(navArgument(Routes.ContentArg) { type = NavType.StringType; defaultValue = "" }),
            ) { PlaceholderScreen(Routes.ContentDetail, back) }
            composable(Routes.Feedback) { PlaceholderScreen(Routes.Feedback, back) }
            composable(Routes.Mine) { PlaceholderScreen(Routes.Mine) }
            composable(Routes.Fallback) { PlaceholderScreen(Routes.Fallback, back) }
        }
    }
}
