package com.yaoyouju.app

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.yaoyouju.app.core.design.YaoyoujuTheme
import com.yaoyouju.app.core.navigation.YaoyoujuApp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/**
 * 页面导航回归：任意页面命中红旗（redFlagRequest 递增）后，
 * 主界面必须立即进入 A03 就医提示页（产品红线：不被保存等动作阻断）。
 */
@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(AndroidJUnit4::class)
@Config(sdk = [34])
class RedFlagNavigationTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        AppGraph.init(ApplicationProvider.getApplicationContext(), "http://127.0.0.1:3400")
        AppGraph.overrideApi(FakeApiService())
        kotlinx.coroutines.runBlocking { AppGraph.session.clear() }
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun redFlagRequestNavigatesToRedFlagScreen() {
        composeRule.setContent {
            YaoyoujuTheme { YaoyoujuApp() }
        }
        // 等导航图就绪（冷启动令牌校验完成）
        composeRule.waitForIdle()
        // 模拟“记录今天”写入时服务端命中红旗
        AppGraph.appState.requestRedFlag(listOf("大小便功能障碍或鞍区麻木"))
        composeRule.waitForIdle()
        // 必须进入就医提示页，且带 120 入口
        composeRule.onNodeWithText("需要及时寻求专业帮助").assertIsDisplayed()
        composeRule.onNodeWithText("拨打 120 / 前往急诊").assertIsDisplayed()
    }
}
