package com.yaoyouju.app

import androidx.compose.runtime.Composable
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.yaoyouju.app.core.design.YaoyoujuTheme
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.feature.confirm.ConfirmScreen
import com.yaoyouju.app.feature.confirm.ConfirmUiState
import com.yaoyouju.app.feature.confusion.ConfusionScreen
import com.yaoyouju.app.feature.confusion.ConfusionUiState
import com.yaoyouju.app.feature.home.HomeScreen
import com.yaoyouju.app.feature.home.HomeUiState
import com.yaoyouju.app.feature.login.LoginScreen
import com.yaoyouju.app.feature.login.LoginUiState
import com.yaoyouju.app.feature.redflag.RedFlagScreen
import com.yaoyouju.app.feature.redflag.RedFlagUiState
import com.yaoyouju.app.feature.report.ReportScreen
import com.yaoyouju.app.feature.report.ReportUiState
import com.yaoyouju.app.feature.verify.VerifyRow
import com.yaoyouju.app.feature.verify.VerifyScreen
import com.yaoyouju.app.feature.verify.VerifyTermRow
import com.yaoyouju.app.feature.verify.VerifyUiState
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * A01–A18 页面截图测试（用演示数据渲染）。
 * 运行 `gradlew.bat recordRoborazziDebug` 输出到 android/screenshots/。
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = "w375dp-h900dp-xhdpi")
class AllScreensScreenshotTest {

    @get:Rule
    val composeRule = createComposeRule()

    private fun capture(name: String, content: @Composable () -> Unit) {
        composeRule.setContent { YaoyoujuTheme { content() } }
        composeRule.onRoot().captureRoboImage("$name.png")
    }

    /* ---------- A01 启动 · 登录与授权 ---------- */
    @Test
    fun a01Login() = capture("A01-login") {
        LoginScreen(
            state = LoginUiState(
                phone = "13800138000",
                code = "",
                agreed = true,
                consented = false,
                emergency = DemoData.emergencyTips,
            ),
            onPhoneChange = {},
            onCodeChange = {},
            onToggleAgreed = {},
            onToggleConsented = {},
            onSendCode = {},
            onLogin = {},
            onShowEmergency = {},
        )
    }

    /* ---------- A02 当前关键变化确认 ---------- */
    @Test
    fun a02Confirm() = capture("A02-confirm") {
        ConfirmScreen(
            state = ConfirmUiState(
                step = 1,
                change = "加重",
                noneSelected = true,
                side = "左侧",
            ),
            onBack = {},
            onSelectChange = {},
            onToggleRedFlag = {},
            onToggleNone = {},
            onToggleUncertain = {},
            onSelectSide = {},
            onSelectOnset = {},
            onSetOnsetDate = {},
            onShowDatePicker = {},
            onNext = {},
            onSkip = {},
        )
    }

    /* ---------- A03 就医提示 ---------- */
    @Test
    fun a03RedFlag() = capture("A03-redflag") {
        RedFlagScreen(
            state = RedFlagUiState(
                selectedText = "会阴区或鞍区麻木、双腿进行性无力",
                reportHint = "已录入的检查报告原文（2026-08-30）",
            ),
            onBack = {},
            onCall120 = {},
            onFindHospital = {},
            onContactDoctor = {},
            onSummary = {},
            onContents = {},
            onDismissHospitalDialog = {},
        )
    }

    /* ---------- A04 选择主要困惑 ---------- */
    @Test
    fun a04Confusion() = capture("A04-confusion") {
        ConfusionScreen(
            state = ConfusionUiState(selected = "report", formats = listOf("简短要点", "带图示视频")),
            onBack = {},
            onSelect = {},
            onToggleFormat = {},
            onNext = {},
        )
    }

    /* ---------- A05 录入报告与医嘱 ---------- */
    @Test
    fun a05Report() = capture("A05-report") {
        ReportScreen(
            state = ReportUiState(
                reportText = "腰椎MRI平扫：L4/5椎间盘轻度膨出；L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能…（示例文本，仅用于演示）",
                reportDate = "2026-08-30",
                examTypeIndex = 0,
            ),
            onBack = {},
            onSelectTab = {},
            onReportTextChange = {},
            onReportDateChange = {},
            onSelectExamType = {},
            onHospitalChange = {},
            onAdviceTextChange = {},
            onToggleAdvice = {},
            onShowDatePicker = {},
            onShowExamTypePicker = {},
            onOcr = {},
            onNext = {},
            onSkip = {},
        )
    }

    /* ---------- A06 核对整理后的信息 ---------- */
    @Test
    fun a06Verify() = capture("A06-verify") {
        VerifyScreen(
            state = VerifyUiState(
                loading = false,
                reportDate = "2026-08-30",
                terms = listOf(
                    VerifyTermRow("关键术语", "L5/S1椎间盘向后突出", "原文第2行"),
                    VerifyTermRow("", "相应硬膜囊受压", "原文第2行"),
                    VerifyTermRow("神经根", "报告写“右侧神经根受压可能”", "原文第3行"),
                ),
                conflict = "报告写的是「右侧」，你的自述是「左侧」",
                selfSide = "左侧",
                symptoms = listOf(
                    VerifyRow("症状开始", "约1个月内（记不清具体日期）", "尚未确认"),
                    VerifyRow("最近变化", "加重", "已确认"),
                    VerifyRow("腿部无力", "尚未回答", "尚未确认"),
                    VerifyRow("大小便/鞍区", "没有", "已确认"),
                    VerifyRow("主要困惑", "报告术语", "已确认"),
                ),
                advices = listOf(
                    VerifyRow("医生建议", "保守治疗，4周后复查", "未经核实"),
                ),
            ),
            onBack = {},
            onCorrectReport = {},
            onResolveConflict = {},
            onGenerate = {},
            onDismissCorrectDialog = {},
            onCorrectTextChange = {},
            onSaveCorrection = {},
        )
    }

    /* ---------- A14 首页 · 当前情况 ---------- */
    @Test
    fun a14Home() = capture("A14-home") {
        HomeScreen(
            state = HomeUiState(
                loading = false,
                episode = DemoData.episode,
                subtitle = "本次发作 · 第 5 周 · 上次记录：昨天",
                pendingItems = listOf(
                    "今天是否有腿部麻木或无力",
                    "报告写“右侧”，你的描述是“左侧”",
                ),
                analysis = DemoData.analysis,
                recommended = DemoData.recommended.take(1),
                followupQuestionCount = 4,
                followupDate = "2026-10-08",
                daysUntil = 17,
                maskedPhone = "138****1234",
                emergency = DemoData.emergencyTips,
            ),
            onSelectTab = { _: TabDestination -> },
            onConfirm = {},
            onRecord = {},
            onReport = {},
            onQa = {},
            onSummary = {},
            onAnalysis = {},
            onContentDetail = {},
            onContents = {},
            onShowEmergency = {},
            onDismissPending = {},
        )
    }
}
