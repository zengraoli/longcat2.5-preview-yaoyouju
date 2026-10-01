package com.yaoyouju.app

import androidx.compose.runtime.Composable
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.yaoyouju.app.core.design.YaoyoujuTheme
import com.yaoyouju.app.core.components.TabDestination
import com.yaoyouju.app.data.QaCitation
import com.yaoyouju.app.data.QaMessage
import com.yaoyouju.app.feature.analysis.AnalysisScreen
import com.yaoyouju.app.feature.analysis.AnalysisUiState
import com.yaoyouju.app.feature.compare.CompareScreen
import com.yaoyouju.app.feature.compare.CompareTab
import com.yaoyouju.app.feature.compare.CompareUiState
import com.yaoyouju.app.feature.compare.TermDef
import com.yaoyouju.app.feature.confirm.ConfirmScreen
import com.yaoyouju.app.feature.confirm.ConfirmUiState
import com.yaoyouju.app.feature.confusion.ConfusionScreen
import com.yaoyouju.app.feature.confusion.ConfusionUiState
import com.yaoyouju.app.feature.fallback.FallbackScreen
import com.yaoyouju.app.feature.fallback.FallbackUiState
import com.yaoyouju.app.feature.feedback.FeedbackScreen
import com.yaoyouju.app.feature.feedback.FeedbackTab
import com.yaoyouju.app.feature.feedback.FeedbackUiState
import com.yaoyouju.app.feature.home.HomeScreen
import com.yaoyouju.app.feature.home.HomeUiState
import com.yaoyouju.app.feature.login.LoginScreen
import com.yaoyouju.app.feature.login.LoginUiState
import com.yaoyouju.app.feature.redflag.RedFlagScreen
import com.yaoyouju.app.feature.redflag.RedFlagUiState
import com.yaoyouju.app.feature.report.ReportScreen
import com.yaoyouju.app.feature.report.ReportUiState
import com.yaoyouju.app.feature.contentdetail.ContentDetailScreen
import com.yaoyouju.app.feature.contentdetail.ContentDetailUiState
import com.yaoyouju.app.feature.contents.ContentsScreen
import com.yaoyouju.app.feature.contents.ContentsUiState
import com.yaoyouju.app.feature.mine.MineScreen
import com.yaoyouju.app.feature.mine.MineUiState
import com.yaoyouju.app.feature.qa.QaScreen
import com.yaoyouju.app.feature.qa.QaUiState
import com.yaoyouju.app.feature.record.RecordScreen
import com.yaoyouju.app.feature.record.RecordUiState
import com.yaoyouju.app.feature.summary.SummaryScreen
import com.yaoyouju.app.feature.summary.SummarySection
import com.yaoyouju.app.feature.summary.SummaryTab
import com.yaoyouju.app.feature.summary.SummaryUiState
import com.yaoyouju.app.feature.timeline.ChartBar
import com.yaoyouju.app.feature.timeline.TimelineItem
import com.yaoyouju.app.feature.timeline.TimelineScreen
import com.yaoyouju.app.feature.timeline.TimelineTone
import com.yaoyouju.app.feature.timeline.TimelineUiState
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

    /* ---------- A07 一页理性分析 ---------- */
    @Test
    fun a07Analysis() = capture("A07-analysis") {
        AnalysisScreen(
            state = AnalysisUiState(
                loading = false,
                status = "完成",
                result = DemoData.analysis,
                selectedQuestions = setOf(0, 1, 2),
            ),
            onBack = {},
            onCompare = {},
            onTimeline = {},
            onSummary = {},
            onContents = {},
            onFallback = {},
            onContentDetail = {},
            onFeedback = {},
            onReportError = {},
            onToggleQuestion = {},
            onAddQuestions = {},
            onSelectTab = {},
            onShare = {},
            onMore = {},
        )
    }

    /* ---------- A08 原文对照 ---------- */
    @Test
    fun a08Compare() = capture("A08-compare") {
        CompareScreen(
            state = CompareUiState(
                loading = false,
                tab = CompareTab.ByExplanation,
                explanations = DemoData.analysis.sections.explanation,
                citations = DemoData.analysis.citations,
                rawText = DemoData.reportRawText,
                reportDate = "2026-08-30",
                examType = "腰椎MRI",
                sideConflict = true,
                index = 1,
                terms = listOf(
                    TermDef("硬膜囊", "包裹脊髓和神经根的膜性结构在影像上的名称。"),
                    TermDef("神经根", "从脊髓分出、经椎间孔走行的神经起始段。"),
                    TermDef("椎间盘突出", "椎间盘内容物超出椎体边缘的影像描述，程度与症状不一定对应。"),
                ),
            ),
            onBack = {},
            onSelectTab = {},
            onPrev = {},
            onNext = {},
            evidenceTitle = { source ->
                DemoData.analysis.citations.firstOrNull { it.evidenceDocId == source }?.evidenceDocTitle ?: "证据库"
            },
        )
    }

    /* ---------- A09 问与解释 ---------- */
    @Test
    fun a09Qa() = capture("A09-qa") {
        val assistant2 = QaMessage(
            id = "m-4",
            role = "assistant",
            content = "是否需要手术不在本产品的判断范围内，我不会给出倾向性的答案。\n\n可以做的是：把你最担心的点整理成复诊问题，并记录最近的功能变化（能坐多久、走多远、夜间是否痛醒），这些是医生判断时会问到的。",
            createdAt = "2026-09-21T02:10:00Z",
        )
        QaScreen(
            state = QaUiState(
                loading = false,
                contextText = "本轮基于：2026-09-21 当前情况 + 2026-08-30 报告。出现新变化请先更新“当前情况”。",
                messages = listOf(
                    QaMessage("m-1", "user", "报告上写“硬膜囊受压”，是不是很严重？", emptyList(), "2026-09-21T02:05:00Z"),
                    QaMessage(
                        "m-2",
                        "assistant",
                        "先说清楚这句话在报告里是什么意思，再说它不能说明什么。\n\n一般含义：这是影像上对位置关系的描述——突出的椎间盘接触或推压了包裹神经的硬膜囊。\n\n不能据此判断：严重程度、是否需要手术、疼痛是否由它引起。这些需要医生结合查体和你的症状变化判断。",
                        listOf(QaCitation("doc-2", "审核科普 #07", "硬膜囊受压是影像描述")),
                        "2026-09-21T02:05:10Z",
                    ),
                    QaMessage("m-3", "user", "那我是不是需要做手术？", emptyList(), "2026-09-21T02:09:00Z"),
                    assistant2,
                ),
                outOfScopeMessageIds = setOf("m-4"),
                explainedCount = 2,
            ),
            onSelectTab = {},
            onInputChange = {},
            onSend = {},
            onQuickAsk = {},
            onAddFollowup = {},
            onOpenHistory = {},
            onCloseHistory = {},
            onOpenSession = {},
        )
    }

    /* ---------- A10 病程时间线 ---------- */
    @Test
    fun a10Timeline() = capture("A10-timeline") {
        TimelineScreen(
            state = TimelineUiState(
                loading = false,
                episode = DemoData.episode,
                onsetLabel = "约 2026-08 中旬",
                recordCount = 12,
                reportCount = 1,
                analysisCount = 3,
                questionCount = 4,
                chart = listOf(
                    ChartBar(0.6f, false), ChartBar(0.52f, false), ChartBar(0.66f, false),
                    ChartBar(0.4f, false), ChartBar(0.58f, false), ChartBar(0.5f, false),
                    ChartBar(0.46f, false), ChartBar(0.36f, false), ChartBar(0.8f, false),
                    ChartBar(0.9f, false), ChartBar(0.44f, false), ChartBar(0.3f, false),
                    ChartBar(0.22f, true), ChartBar(0.24f, true),
                ),
                chartStart = "09-08",
                chartEnd = "09-21",
                items = listOf(
                    TimelineItem(
                        "e1", "2026-09-21 · 今天", "症状记录", TimelineTone.Warn,
                        "与上周相比加重；能坐约30分钟；夜间痛醒1次；今天最担心“会不会越来越严重”。",
                        listOf("自述", "腿部无力：尚未确认"), "e1", "症状",
                    ),
                    TimelineItem(
                        "a2", "2026-09-18", "一页分析 v2", TimelineTone.Info,
                        "生成于模型 M-2609；使用报告 2026-08-30 与 9 条症状记录。",
                        listOf("系统生成", "可查看当时版本"), null, "分析",
                    ),
                    TimelineItem(
                        "e2", "2026-09-10", "医生建议", TimelineTone.Warn,
                        "医生建议保守治疗，4 周后复查。",
                        listOf("自述转述", "未经核实"), "e2", "医嘱",
                    ),
                    TimelineItem(
                        "e3", "2026-08-30", "检查报告", TimelineTone.Info,
                        "腰椎 MRI：L5/S1 椎间盘向后突出，相应硬膜囊受压…",
                        listOf("报告原文", "已录入"), "e3", "报告",
                    ),
                    TimelineItem(
                        "e4", "约 2026-08-15", "症状开始", TimelineTone.Warn,
                        "腰痛开始，起初以久坐后酸痛为主。",
                        listOf("自述", "日期尚未确认"), "e4", "症状",
                    ),
                ),
            ),
            onSelectTab = {},
            onToggleFilter = {},
            onSelectFilter = {},
            onShowAdd = {},
            onAddTypeIndex = {},
            onAddDate = {},
            onAddText = {},
            onSaveEvent = {},
            onDeleteEvent = {},
        )
    }

    /* ---------- A11 记录今天 ---------- */
    @Test
    fun a11Record() = capture("A11-record") {
        RecordScreen(
            state = RecordUiState(
                date = "2026-09-21",
                sitMinutes = "15-30",
                plannedActivityDone = "部分",
                sleepImpact = 1,
                changeVsYesterday = "加重",
                activities = listOf("步行", "热敷"),
            ),
            onBack = {},
            onSelectSit = {},
            onSelectPlanned = {},
            onSelectSleep = {},
            onSelectChange = {},
            onSelectLeg = {},
            onToggleActivity = {},
            onTopWorryChange = {},
            onSave = {},
        )
    }

    /* ---------- A12 复诊摘要 ---------- */
    @Test
    fun a12Summary() = capture("A12-summary") {
        SummaryScreen(
            state = SummaryUiState(
                loading = false,
                tab = SummaryTab.Doc,
                content = DemoData.summary,
                sections = listOf(
                    SummarySection("当前情况", "当前情况", DemoData.summary.current),
                    SummarySection("报告要点", "相关检查原文", DemoData.summary.report),
                    SummarySection("医嘱要点", "已经接受的专业建议", DemoData.summary.advice),
                    SummarySection("尚未确认", "尚未确认", DemoData.summary.unconfirmed),
                    SummarySection("下一步", "下一步", DemoData.summary.next),
                ),
                today = "2026-09-21",
            ),
            onSelectTab = {},
            onSelectSummaryTab = {},
            onCorrect = {},
            onCorrectTextChange = {},
            onSaveCorrect = {},
            onCancelCorrect = {},
            onExport = {},
        )
    }

    /* ---------- A13 审核内容库 ---------- */
    @Test
    fun a13Contents() = capture("A13-contents") {
        ContentsScreen(
            state = ContentsUiState(
                loading = false,
                category = "全部",
                recommended = DemoData.contentLibrary.take(2),
                all = DemoData.contentLibrary,
                filtered = DemoData.contentLibrary,
            ),
            onSelectTab = {},
            onBack = {},
            onSelectCategory = {},
            onQueryChange = {},
            onToggleSearch = {},
            onOpenDetail = {},
        )
    }

    /* ---------- A15 视频详情 ---------- */
    @Test
    fun a15ContentDetail() = capture("A15-content-detail") {
        ContentDetailScreen(
            state = ContentDetailUiState(loading = false, detail = DemoData.contentDetail),
            onBack = {},
            onRetellChange = {},
            onSubmitRetell = {},
            onToggleSubtitle = {},
            onFeedback = {},
            onReportContent = {},
            onShare = {},
            reviewDate = "2026-08",
        )
    }

    /* ---------- A16 反馈与举报 ---------- */
    @Test
    fun a16Feedback() = capture("A16-feedback") {
        FeedbackScreen(
            state = FeedbackUiState(
                loading = false,
                tab = FeedbackTab.Error,
                analysis = DemoData.analysis,
                problemTypes = listOf("与我的报告不符", "左右侧/日期混淆"),
                contentLabel = "一页分析 v3 · ②-2 “硬膜囊受压” 解释",
                versionLabel = "分析 v3 · 模型 M-2609 · 科普 #07 v1 · 检索策略 R-4",
                timeLabel = "2026-09-21 09:41",
            ),
            onBack = {},
            onSelectTab = {},
            onToggleProblemType = {},
            onDescriptionChange = {},
            onToggleAuthorized = {},
            onSelectHelpType = {},
            onSubmit = {},
            onCancel = {},
            onAddScreenshot = {},
        )
    }

    /* ---------- A17 我的 · 数据与授权 ---------- */
    @Test
    fun a17Mine() = capture("A17-mine") {
        MineScreen(
            state = MineUiState(
                loading = false,
                maskedPhone = "138****1234",
                anonymousId = "U-8F3K…",
                consentSummary = "健康信息处理：已同意 2026-09-01 · 分享/产品改进：未开启",
                modelName = "M-2609",
                contentLibVersion = "2026-09",
            ),
            onSelectTab = {},
            onShowEmergency = {},
            onShowConsents = {},
            onRevokeConsent = {},
            onExport = {},
            onDeleteAccount = {},
            onConfirmDelete = {},
            onDismissDeleteConfirm = {},
            onLogout = {},
            onFeedback = {},
            onInfo = {},
        )
    }

    /* ---------- A18 服务不可用回退 ---------- */
    @Test
    fun a18Fallback() = capture("A18-fallback") {
        FallbackScreen(
            state = FallbackUiState(errorCode = "ANL-503"),
            onBack = {},
            onShowEmergency = {},
            onContents = {},
            onSummary = {},
            onTimeline = {},
            onRetry = {},
        )
    }

    /* ---------- A14 首页 · 当前情况 ---------- */
    @Test
    fun a14Home() = capture("A14-home") {        HomeScreen(
            state = HomeUiState(
                loading = false,
                episode = DemoData.episode,
                subtitle = "本次发作 · 第 5 周 · 上次记录：昨天",
                pendingItems = listOf(
                    "今天是否有腿部麻木或无力",
                    "报告写“右侧”，你的描述是“左侧”",
                ),
                analysis = DemoData.homeAnalysis,
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
            onConfusion = {},
            onNotification = {},
            onAvatar = {},
        )
    }
}
