package com.yaoyouju.app.core.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
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
import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.apiCall
import com.yaoyouju.app.core.design.AppColors
import com.yaoyouju.app.core.navigation.DeepLinkRequest
import com.yaoyouju.app.feature.analysis.AnalysisRoute
import com.yaoyouju.app.feature.compare.CompareRoute
import com.yaoyouju.app.feature.confirm.ConfirmRoute
import com.yaoyouju.app.feature.confusion.ConfusionRoute
import com.yaoyouju.app.feature.contentdetail.ContentDetailRoute
import com.yaoyouju.app.feature.contents.ContentsRoute
import com.yaoyouju.app.feature.fallback.FallbackRoute
import com.yaoyouju.app.feature.feedback.FeedbackRoute
import com.yaoyouju.app.feature.home.HomeRoute
import com.yaoyouju.app.feature.login.LoginRoute
import com.yaoyouju.app.feature.mine.MineRoute
import com.yaoyouju.app.feature.qa.QaRoute
import com.yaoyouju.app.feature.record.RecordRoute
import com.yaoyouju.app.feature.redflag.RedFlagRoute
import com.yaoyouju.app.feature.report.ReportRoute
import com.yaoyouju.app.feature.summary.SummaryRoute
import com.yaoyouju.app.feature.timeline.TimelineRoute
import com.yaoyouju.app.feature.verify.VerifyRoute

/**
 * 单 Activity 的 Compose 导航图。
 * 每个路由对应设计稿的一个编号（A01–A18）。
 */
@Composable
fun YaoyoujuApp(deepLink: DeepLinkRequest? = null) {
    val navController = rememberNavController()
    val appState = AppGraph.appState
    val snackbarHostState = remember { SnackbarHostState() }

    var ready by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        AppGraph.session.load()
        // 冷启动先校验令牌：登录过期时直接进登录页，避免先闪一下首页
        if (!AppGraph.session.token.isNullOrBlank()) {
            val result = runCatching { apiCall { AppGraph.api.getMe() } }
            val error = result.exceptionOrNull()
            if (error is ApiException && error.isUnauthorized) {
                AppGraph.session.clear()
                appState.sessionExpired = false
            }
        }
        ready = true
    }

    // deep link：yaoyouju://A07
    LaunchedEffect(deepLink, ready) {
        val target = deepLink?.route
        if (ready && target != null && target != Routes.Login) {
            navController.navigate(target) { launchSingleTop = true }
        }
    }

    // 登录过期：回到登录页（必须等导航图就绪，否则 NavController 会崩溃）
    LaunchedEffect(appState.sessionExpired, ready) {
        if (ready && appState.sessionExpired) {
            appState.sessionExpired = false
            navController.navigate(Routes.Login) { popUpTo(0) { inclusive = true } }
        }
    }

    // 任意页面命中红旗：立即进入就医提示页
    LaunchedEffect(appState.redFlagRequest, ready) {
        if (ready && appState.redFlagRequest > 0) {
            navController.navigate(Routes.RedFlag) { launchSingleTop = true }
        }
    }

    // 全局一次性提示：Channel 里逐条弹出，不会被重组取消
    LaunchedEffect(Unit) {
        for (message in appState.messages) {
            snackbarHostState.showSnackbar(message)
        }
    }

    Scaffold(
        containerColor = AppColors.Bg,
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { innerPadding ->
        if (!ready) {
            Box(modifier = Modifier.fillMaxSize().background(AppColors.Bg))
            return@Scaffold
        }
        val start = if (AppGraph.session.token.isNullOrBlank()) Routes.Login else Routes.Home
        // 内容整体下移，避免 Tab 页标题压在状态栏区域；
        // consumeWindowInsets 消费 Scaffold 内边距，避免与底部导航重复留白
        Box(modifier = Modifier.fillMaxSize().statusBarsPadding().consumeWindowInsets(innerPadding)) {
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
            composable(Routes.Confirm) {
                ConfirmRoute(
                    onBack = back,
                    onRedFlag = { navController.navigate(Routes.RedFlag) },
                    onContinue = { navController.navigate(Routes.Confusion) },
                    onSkip = { navController.navigate(Routes.Confusion) },
                )
            }
            composable(Routes.RedFlag) {
                RedFlagRoute(
                    onBack = back,
                    onSummary = { navController.navigate(Routes.Summary) },
                    onContents = { navController.navigate(Routes.Contents) },
                )
            }
            composable(Routes.Confusion) {
                ConfusionRoute(
                    onBack = back,
                    onNext = { navController.navigate(Routes.Report) },
                )
            }
            composable(Routes.Report) {
                ReportRoute(
                    onBack = back,
                    onDone = { navController.navigate(Routes.Verify) },
                )
            }
            composable(Routes.Verify) {
                VerifyRoute(
                    onBack = back,
                    onTask = { id -> navController.navigate(Routes.analysis(id)) },
                    onRedFlag = { navController.navigate(Routes.RedFlag) },
                )
            }
            composable(
                route = "${Routes.Analysis}?${Routes.AnalysisArg}={${Routes.AnalysisArg}}",
                arguments = listOf(navArgument(Routes.AnalysisArg) { type = NavType.StringType; defaultValue = "" }),
            ) { entry ->
                AnalysisRoute(
                    analysisId = entry.arguments?.getString(Routes.AnalysisArg).orEmpty(),
                    onBack = back,
                    onCompare = { navController.navigate(Routes.ReportCompare) },
                    onTimeline = { onSelectTab(TabDestination.Timeline) },
                    onSummary = { navController.navigate(Routes.Summary) },
                    onContents = { navController.navigate(Routes.Contents) },
                    onFallback = { navController.navigate(Routes.Fallback) },
                    onContentDetail = { id -> navController.navigate(Routes.content(id)) },
                    onFeedback = { navController.navigate(Routes.Feedback) },
                    onSelectTab = onSelectTab,
                )
            }
            composable(Routes.ReportCompare) { CompareRoute(onBack = back) }
            composable(Routes.Qa) { QaRoute(onSelectTab = onSelectTab, onFallback = { navController.navigate(Routes.Fallback) }) }
            composable(Routes.Timeline) {
                TimelineRoute(
                    onSelectTab = onSelectTab,
                    onRedFlag = { navController.navigate(Routes.RedFlag) },
                    onFallback = { navController.navigate(Routes.Fallback) },
                )
            }
            composable(Routes.Record) {
                RecordRoute(
                    onBack = back,
                    onSaved = { back() },
                )
            }
            composable(Routes.Summary) { SummaryRoute(onSelectTab = onSelectTab) }
            composable(Routes.Contents) {
                ContentsRoute(
                    onSelectTab = onSelectTab,
                    onBack = back,
                    onOpenDetail = { id -> navController.navigate(Routes.content(id)) },
                    onFallback = { navController.navigate(Routes.Fallback) },
                )
            }
            composable(Routes.Home) {
                HomeRoute(
                    onSelectTab = onSelectTab,
                    onConfirm = { navController.navigate(Routes.Confirm) },
                    onConfusion = { navController.navigate(Routes.Confusion) },
                    onRecord = { navController.navigate(Routes.Record) },
                    onReport = { navController.navigate(Routes.Report) },
                    onQa = { onSelectTab(TabDestination.Qa) },
                    onSummary = { navController.navigate(Routes.Summary) },
                    onAnalysis = { id -> navController.navigate(Routes.analysis(id)) },
                    onContentDetail = { id -> navController.navigate(Routes.content(id)) },
                    onFallback = { navController.navigate(Routes.Fallback) },
                )
            }
            composable(
                route = "${Routes.ContentDetail}?${Routes.ContentArg}={${Routes.ContentArg}}",
                arguments = listOf(navArgument(Routes.ContentArg) { type = NavType.StringType; defaultValue = "" }),
            ) { entry ->
                ContentDetailRoute(
                    contentId = entry.arguments?.getString(Routes.ContentArg).orEmpty(),
                    onBack = back,
                    onReportContent = { navController.navigate(Routes.Feedback) },
                )
            }
            composable(Routes.Feedback) { FeedbackRoute(onBack = back) }
            composable(Routes.Mine) {
                MineRoute(
                    onSelectTab = onSelectTab,
                    onLoggedOut = {
                        navController.navigate(Routes.Login) {
                            popUpTo(0) { inclusive = true }
                            launchSingleTop = true
                        }
                    },
                    onFeedback = { navController.navigate(Routes.Feedback) },
                )
            }
            composable(Routes.Fallback) {
                FallbackRoute(
                    onBack = back,
                    onContents = { navController.navigate(Routes.Contents) },
                    onSummary = { navController.navigate(Routes.Summary) },
                    onTimeline = { onSelectTab(TabDestination.Timeline) },
                )
            }
        }
        }
    }
}
