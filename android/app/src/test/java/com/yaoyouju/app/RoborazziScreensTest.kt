package com.yaoyouju.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.github.takahirom.roborazzi.RoborazziTransparentActivity
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onRoot
import androidx.test.core.app.ApplicationProvider
import com.github.takahirom.roborazzi.RoborazziRule
import com.yaoyouju.app.data.ContentPicker
import com.yaoyouju.app.data.TokenStore
import com.yaoyouju.app.data.api.ApiClient
import com.yaoyouju.app.ui.screens.AnalysisScreen
import com.yaoyouju.app.ui.screens.ChangeScreen
import com.yaoyouju.app.ui.screens.ComparisonScreen
import com.yaoyouju.app.ui.screens.ConfusionScreen
import com.yaoyouju.app.ui.screens.ContentScreen
import com.yaoyouju.app.ui.screens.FallbackScreen
import com.yaoyouju.app.ui.screens.FeedbackScreen
import com.yaoyouju.app.ui.screens.FollowupScreen
import com.yaoyouju.app.ui.screens.HomeScreen
import com.yaoyouju.app.ui.screens.LoginScreen
import com.yaoyouju.app.ui.screens.MineScreen
import com.yaoyouju.app.ui.screens.QaScreen
import com.yaoyouju.app.ui.screens.RedflagScreen
import com.yaoyouju.app.ui.screens.ReportScreen
import com.yaoyouju.app.ui.screens.TimelineScreen
import com.yaoyouju.app.ui.screens.TodayScreen
import com.yaoyouju.app.ui.screens.VerifyScreen
import com.yaoyouju.app.ui.screens.VideoScreen
import com.yaoyouju.app.ui.theme.YyjTheme
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * A01–A18 各页面 Roborazzi 截图测试：注入 FakeYyjApi 演示数据渲染。
 *
 * 录制：./gradlew recordRoborazziDebug（输出到 android/screenshots/）
 * 校验：./gradlew verifyRoborazziDebug
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w360dp-h1280dp-port", manifest = "AndroidManifest.xml")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class RoborazziScreensTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<RoborazziTransparentActivity>()

    @get:Rule
    val roborazziRule = RoborazziRule(
        composeRule = composeRule,
        captureRoot = composeRule.onRoot(),
        options = RoborazziRule.Options(
            captureType = RoborazziRule.CaptureType.LastImage(),
            outputDirectoryPath = "../screenshots",
        ),
    )

    @Before
    fun setup() {
        TokenStore.init(ApplicationProvider.getApplicationContext())
        ApiClient.api = FakeYyjApi()
    }

    /** 等待演示数据渲染完成 */
    private fun awaitText(text: String) {
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithText(text, substring = true).fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.waitForIdle()
    }

    private fun render(content: @androidx.compose.runtime.Composable () -> Unit) {
        composeRule.setContent { YyjTheme { content() } }
        composeRule.waitForIdle()
    }

    @Test
    fun a01Login() {
        render { LoginScreen(onLoggedIn = {}) }
    }

    @Test
    fun a02Change() {
        render { ChangeScreen(onNavigate = {}) }
    }

    @Test
    fun a03Redflag() {
        render { RedflagScreen(onBack = {}, onGoContent = {}) }
    }

    @Test
    fun a04Confusion() {
        render { ConfusionScreen(onNavigate = {}) }
    }

    @Test
    fun a05Report() {
        render { ReportScreen(onNavigate = {}) }
    }

    @Test
    fun a06Verify() {
        render { VerifyScreen(onBack = {}, onNavigate = {}) }
        awaitText("报告信息")
    }

    @Test
    fun a07Analysis() {
        render { AnalysisScreen(onBack = {}, onNavigate = {}) }
        awaitText("这些信息能支持什么解释")
    }

    @Test
    fun a08Comparison() {
        render { ComparisonScreen(onBack = {}) }
        awaitText("报告原文")
    }

    @Test
    fun a09Qa() {
        render { QaScreen(onNavigate = {}) }
        awaitText("本轮基于")
    }

    @Test
    fun a10Timeline() {
        render { TimelineScreen(onNavigate = {}) }
        awaitText("本次发作")
    }

    @Test
    fun a11Today() {
        render { TodayScreen(onBack = {}, onNavigate = {}) }
    }

    @Test
    fun a12Followup() {
        render { FollowupScreen(onNavigate = {}) }
        awaitText("复诊交接摘要")
    }

    @Test
    fun a13Content() {
        render { ContentScreen(onBack = {}, onNavigate = {}) }
        awaitText("为你推荐")
    }

    @Test
    fun a14Home() {
        render { HomeScreen(onNavigate = {}) }
        awaitText("最新一页分析")
    }

    @Test
    fun a15Video() {
        ContentPicker.selectedId = "c-1"
        render { VideoScreen(onBack = {}) }
        awaitText("适用范围")
    }

    @Test
    fun a16Feedback() {
        render { FeedbackScreen(onBack = {}) }
        awaitText("关于哪条内容")
    }

    @Test
    fun a17Mine() {
        render { MineScreen(onNavigate = {}, onLogout = {}) }
    }

    @Test
    fun a18Fallback() {
        render { FallbackScreen(onBack = {}, onNavigate = {}) }
    }
}
