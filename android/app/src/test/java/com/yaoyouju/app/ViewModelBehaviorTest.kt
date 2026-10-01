package com.yaoyouju.app

import com.yaoyouju.app.core.network.ApiException
import com.yaoyouju.app.core.network.ApiEvents
import com.yaoyouju.app.core.store.EpisodeSupport
import com.yaoyouju.app.data.SafetyCheckResult
import com.yaoyouju.app.data.SafetyFlag
import com.yaoyouju.app.feature.feedback.FeedbackViewModel
import com.yaoyouju.app.feature.home.HomeViewModel
import com.yaoyouju.app.feature.qa.QaViewModel
import com.yaoyouju.app.feature.record.RecordViewModel
import com.yaoyouju.app.feature.report.ReportViewModel
import com.yaoyouju.app.feature.timeline.TimelineViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/**
 * ViewModel 行为与页面导航回归：覆盖第二轮验收反馈中“测试没发现”的场景：
 * 记录今天命中红旗进就医提示、新用户首次写入、同意撤回提示、反馈关联对象、
 * 报告原文不被污染、问答计数、时间线排序、复诊日期推算。
 */
@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(org.robolectric.RobolectricTestRunner::class)
@Config(sdk = [34])
class ViewModelBehaviorTest {

    private lateinit var api: FakeApiService

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        api = FakeApiService()
        AppGraph.overrideApi(api)
        // 每个用例前重置跨页面状态
        AppGraph.appState.redFlagRequest = 0
        AppGraph.appState.redFlagSelected = emptyList()
        AppGraph.appState.redFlagFromSelection = false
        AppGraph.appState.currentEpisode = null
        AppGraph.appState.latestAnalysis = null
        AppGraph.appState.fallbackErrorCode = "ANL-503"
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ---------- #1 记录今天：命中红旗必须进就医提示页（两个保存按钮都一样） ----------

    @Test
    fun recordSaveWithRedFlagNavigatesToRedFlagScreen() {
        api.symptomLogSafety = SafetyCheckResult(
            passed = false,
            redFlags = listOf(SafetyFlag("RF-01", "大小便功能障碍或鞍区麻木", "高", "提示就医", "请及时就医")),
        )
        val vm = RecordViewModel()
        vm.setTopWorry("这几天大小便控制不住，会阴那里发麻")
        var saved = false
        vm.save { saved = true }
        // 命中红旗：触发全局红旗请求（主界面观察后跳转 A03 就医提示页）
        assertEquals(1, AppGraph.appState.redFlagRequest)
        assertEquals(listOf("大小便功能障碍或鞍区麻木"), AppGraph.appState.redFlagSelected)
        // 命中红旗时不走“已保存后返回首页”的普通完成回调
        assertTrue(!saved)
    }

    @Test
    fun recordSaveAndUpdateWithRedFlagAlsoNavigatesToRedFlagScreen() {
        api.symptomLogSafety = SafetyCheckResult(
            passed = false,
            redFlags = listOf(SafetyFlag("RF-02", "双腿进行性无力", "高", "提示就医", "请及时就医")),
        )
        val vm = RecordViewModel()
        vm.setTopWorry("双腿越来越没力气")
        var saved = false
        vm.saveAndUpdate { saved = true }
        assertEquals(1, AppGraph.appState.redFlagRequest)
        assertTrue(!saved)
    }

    @Test
    fun recordSaveWithoutRedFlagJustToasts() {
        api.symptomLogSafety = SafetyCheckResult(passed = true)
        val vm = RecordViewModel()
        vm.setTopWorry("会不会越来越严重")
        var saved = false
        vm.save { saved = true }
        assertEquals(0, AppGraph.appState.redFlagRequest)
        assertTrue(saved)
        // 记录内容原样提交，没有被拼上检查信息
        assertEquals("会不会越来越严重", api.lastSymptomLogRequest?.topWorry)
    }

    // ---------- #2 新用户第一次写入：自动建病程成功，不报“无法建立病程” ----------

    @Test
    fun firstWriteCreatesEpisodeAndSucceeds() {
        api.episodes = emptyList() // 新用户：还没有病程
        val vm = RecordViewModel()
        vm.setTopWorry("有点不舒服")
        var done = false
        vm.save { done = true }
        assertTrue("第一次写入就应该成功", done)
        assertEquals("ep-new", AppGraph.appState.currentEpisode?.id)
        assertEquals(1, api.createdEpisodes.size)
    }

    @Test
    fun episodeSupportPropagatesNetworkErrorInsteadOfNull() {
        api.episodes = emptyList()
        api.failNextEpisodeCreate = true
        // 网络 / 服务异常必须抛出，让页面提示网络错误，而不是吞掉后报“无法建立病程”
        val error = runCatching { kotlinx.coroutines.runBlocking { EpisodeSupport.ensureEpisodeId() } }.exceptionOrNull()
        assertNotNull(error)
    }

    // ---------- #3 撤回同意后：全局处理器提示“需要重新同意”，且不重复弹服务端原文 ----------

    @Test
    fun consentMissingTriggersGlobalPromptWithoutDoubleToast() {
        var consentPromptCount = 0
        ApiEvents.onConsentMissing = { consentPromptCount++ }
        try {
            val ex = ApiException(2002, "未同意「健康信息处理」，不能使用该功能")
            assertTrue(ex.isConsentMissing)
            // apiCall 会触发全局处理器
            kotlinx.coroutines.runBlocking {
                try {
                    com.yaoyouju.app.core.network.apiCall { throw ex }
                } catch (_: ApiException) {
                }
            }
            assertEquals(1, consentPromptCount)
        } finally {
            ApiEvents.onConsentMissing = null
        }
    }

    // ---------- #4 反馈举报：从视频详情进入关联到内容；无分析也能提交 ----------

    @Test
    fun feedbackFromContentDetailAssociatesContentNotAnalysis() {
        api.contentDetailFull = DemoData.contentDetail
        api.latestAnalysis = DemoData.analysis
        val vm = FeedbackViewModel()
        vm.load("content:ct-1")
        assertEquals("腰椎节段位置：L5/S1 在哪里", vm.state.contentLabel)
        assertEquals("ct-1", vm.state.targetId)
        // 关联对象是内容，不是最新一页分析
        assertEquals("ct-1", vm.state.content?.id)
    }

    @Test
    fun feedbackWithoutAnalysisCanStillSubmit() {
        // 还没有一页分析的用户（包括被红旗拦截不能生成分析的用户）
        api.contentDetailFull = DemoData.contentDetail
        api.latestAnalysis = null
        val vm = FeedbackViewModel()
        vm.load("content:ct-1")
        vm.selectTab(com.yaoyouju.app.feature.feedback.FeedbackTab.Help)
        vm.selectHelpType("看懂了")
        var done = false
        vm.submit { done = true }
        assertTrue("没有分析也应该能提交帮助类型反馈", done)
        assertEquals("fb-1", api.helpFeedbackResult?.id)
    }

    // ---------- #5 报告原文：检查机构 / 检查类型不拼进原文 ----------

    @Test
    fun reportRawTextNotPollutedByExamInfo() {
        api.episodes = listOf(DemoData.episode)
        val vm = ReportViewModel()
        vm.onReportTextChange("L5/S1椎间盘向后突出，相应硬膜囊受压。")
        vm.selectExamType(1) // CT
        vm.onHospitalChange("市第一医院")
        var done = false
        vm.submit { done = true }
        assertTrue(done)
        val request = api.lastReportRequest
        assertNotNull(request)
        // 原文就是用户粘贴的文字，没有【检查信息】前缀
        assertEquals("L5/S1椎间盘向后突出，相应硬膜囊受压。", request!!.rawText)
        // 检查类型与机构单独存字段
        assertEquals("CT", request.examType)
        assertEquals("市第一医院", request.hospital)
    }

    // ---------- #7 问答“本轮已解释 N 个问题”不多算 1 ----------

    @Test
    fun explainedCountMatchesAskedQuestions() {
        api.episodes = listOf(DemoData.episode)
        api.qaSessions = emptyList()
        api.askResult = com.yaoyouju.app.data.AskResult(
            message = com.yaoyouju.app.data.QaMessage("m-9", "assistant", "回答", createdAt = "2026-09-01T00:00:00Z"),
        )
        val vm = QaViewModel()
        vm.loadSession()
        vm.ask("报告里的术语是什么意思？")
        // 问了 1 个，不能显示 2
        assertEquals(1, vm.state.explainedCount)
        vm.ask("复诊时该怎么描述？")
        assertEquals(2, vm.state.explainedCount)
    }

    // ---------- #18 病程时间线：按真实时间戳降序，同一天内也降序 ----------

    @Test
    fun timelineItemsSortedByTimestampDescending() {
        api.episodes = listOf(DemoData.episode)
        api.timeline = com.yaoyouju.app.data.TimelineResult(
            events = listOf(
                com.yaoyouju.app.data.CareEvent(
                    id = "ev-1", episodeId = "ep-1", eventType = "报告",
                    occurredAt = "2026-09-20T00:00:00+08:00", sourceType = "报告原文",
                    rawText = "报告", verifyStatus = "已确认",
                ),
                com.yaoyouju.app.data.CareEvent(
                    id = "ev-2", episodeId = "ep-1", eventType = "症状",
                    occurredAt = "2026-10-01T08:00:00+08:00", sourceType = "自述",
                    rawText = "早上记录", verifyStatus = "已确认",
                ),
                com.yaoyouju.app.data.CareEvent(
                    id = "ev-3", episodeId = "ep-1", eventType = "症状",
                    occurredAt = "2026-10-01T10:00:00+08:00", sourceType = "自述",
                    rawText = "上午记录", verifyStatus = "已确认",
                ),
            ),
        )
        api.latestAnalysis = null
        val vm = TimelineViewModel()
        vm.load()
        val items = vm.state.items
        // 10-01 的两条在前，且当天内时间新的在前；09-20 的报告在最后
        assertEquals("ev-3", items[0].id)
        assertEquals("ev-2", items[1].id)
        assertEquals("ev-1", items[2].id)
    }

    // ---------- #13 计划复诊日期：优先用医嘱里写的复诊时间 ----------

    @Test
    fun followupDateUsesExplicitDateInAdvice() {
        api.episodes = listOf(DemoData.episode)
        api.timeline = com.yaoyouju.app.data.TimelineResult(
            events = listOf(
                com.yaoyouju.app.data.CareEvent(
                    id = "ev-1", episodeId = "ep-1", eventType = "医嘱",
                    occurredAt = "2026-09-10T00:00:00+08:00", sourceType = "医生记录",
                    rawText = "保守治疗，建议 11 月 8 日复诊。", verifyStatus = "已确认",
                ),
            ),
        )
        val vm = HomeViewModel()
        vm.load()
        // 用医嘱里写的 11 月 8 日，而不是“医嘱日期 + N 周”或“今天 + N 周”
        assertEquals("2026-11-08", vm.state.followupDate)
    }

    @Test
    fun followupDateWeeksComputedFromAdviceDateNotToday() {
        api.episodes = listOf(DemoData.episode)
        api.timeline = com.yaoyouju.app.data.TimelineResult(
            events = listOf(
                com.yaoyouju.app.data.CareEvent(
                    id = "ev-1", episodeId = "ep-1", eventType = "医嘱",
                    occurredAt = "2026-09-10T00:00:00+08:00", sourceType = "医生记录",
                    rawText = "保守治疗，4 周后复查。", verifyStatus = "已确认",
                ),
            ),
        )
        val vm = HomeViewModel()
        vm.load()
        // 医嘱日期 2026-09-10 + 4 周 = 2026-10-08
        assertEquals("2026-10-08", vm.state.followupDate)
    }

    // ---------- #14 主要困惑不再被存成“症状”记录 ----------

    @Test
    fun confusionSelectionDoesNotCreateSymptomEvent() {
        api.episodes = listOf(DemoData.episode)
        val vm = com.yaoyouju.app.feature.confusion.ConfusionViewModel()
        vm.select("report")
        var done = false
        vm.proceed { done = true }
        assertTrue(done)
        // 主要困惑只存在会话状态，不写病程事件
        assertNull(api.lastEventRequest)
        assertEquals(listOf("报告术语"), AppGraph.appState.selectedConfusions)
    }
}
