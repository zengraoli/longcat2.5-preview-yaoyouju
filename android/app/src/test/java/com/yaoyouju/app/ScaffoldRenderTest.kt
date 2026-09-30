package com.yaoyouju.app

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.yaoyouju.app.core.components.AppButton
import com.yaoyouju.app.core.components.AppButtonType
import com.yaoyouju.app.core.components.StatusTag
import com.yaoyouju.app.core.components.TipBar
import com.yaoyouju.app.core.components.TipBarType
import com.yaoyouju.app.core.design.YaoyoujuTheme
import com.yaoyouju.app.core.navigation.PlaceholderScreen
import com.yaoyouju.app.core.navigation.Routes
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** T43 骨架自检：通用组件可渲染、页面标题正确、截图管线可用。 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34])
class ScaffoldRenderTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun placeholderShowsDesignTitle() {
        composeRule.setContent {
            YaoyoujuTheme { PlaceholderScreen(Routes.Analysis, onBack = {}) }
        }
        composeRule.onNodeWithText("一页理性分析").assertIsDisplayed()
    }

    @Test
    fun commonComponentsRenderAndCaptureScreenshot() {
        composeRule.setContent {
            YaoyoujuTheme {
                androidx.compose.foundation.layout.Column {
                    AppButton(text = "主按钮", onClick = {}, type = AppButtonType.Primary)
                    AppButton(text = "次按钮", onClick = {}, type = AppButtonType.Secondary)
                    AppButton(text = "柔和", onClick = {}, type = AppButtonType.Soft)
                    AppButton(text = "危险", onClick = {}, type = AppButtonType.Danger)
                    StatusTag(label = "已确认")
                    StatusTag(label = "尚未确认")
                    StatusTag(label = "有冲突")
                    StatusTag(label = "报告原文")
                    TipBar(text = "信息提示", type = TipBarType.Info)
                    TipBar(text = "提醒", type = TipBarType.Warn)
                    TipBar(text = "就医提示", type = TipBarType.Error)
                }
            }
        }
        composeRule.onNodeWithText("主按钮").assertIsDisplayed()
        composeRule.onRoot().captureRoboImage("T43-components.png")
    }
}
