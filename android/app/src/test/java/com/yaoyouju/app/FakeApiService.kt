package com.yaoyouju.app

import com.yaoyouju.app.core.network.ApiService
import com.yaoyouju.app.data.AddEventRequest
import com.yaoyouju.app.data.AddFollowupQuestionRequest
import com.yaoyouju.app.data.AddSymptomLogRequest
import com.yaoyouju.app.data.AnalysisCreateResult
import com.yaoyouju.app.data.AnalysisResult
import com.yaoyouju.app.data.AnalysisTaskStatus
import com.yaoyouju.app.data.ApiResponse
import com.yaoyouju.app.data.AskRequest
import com.yaoyouju.app.data.AskResult
import com.yaoyouju.app.data.CareEvent
import com.yaoyouju.app.data.ConfirmReportRequest
import com.yaoyouju.app.data.ConsentRequest
import com.yaoyouju.app.data.ConsentView
import com.yaoyouju.app.data.ContentDetail
import com.yaoyouju.app.data.ContentItem
import com.yaoyouju.app.data.CorrectEventRequest
import com.yaoyouju.app.data.CorrectSummaryRequest
import com.yaoyouju.app.data.CreateAnalysisRequest
import com.yaoyouju.app.data.CreateEpisodeRequest
import com.yaoyouju.app.data.CreateQaSessionRequest
import com.yaoyouju.app.data.CreateReportRequest
import com.yaoyouju.app.data.Episode
import com.yaoyouju.app.data.ErrorReportRequest
import com.yaoyouju.app.data.ErrorReportResult
import com.yaoyouju.app.data.ExportRequest
import com.yaoyouju.app.data.ExportResult
import com.yaoyouju.app.data.FeedbackItem
import com.yaoyouju.app.data.FollowupQuestionResult
import com.yaoyouju.app.data.HelpFeedbackRequest
import com.yaoyouju.app.data.HelpFeedbackResult
import com.yaoyouju.app.data.LoginRequest
import com.yaoyouju.app.data.LoginResult
import com.yaoyouju.app.data.MeResult
import com.yaoyouju.app.data.QaSession
import com.yaoyouju.app.data.QaSessionDetail
import com.yaoyouju.app.data.Report
import com.yaoyouju.app.data.ReorderQuestionsRequest
import com.yaoyouju.app.data.RetellRequest
import com.yaoyouju.app.data.RetellResult
import com.yaoyouju.app.data.SafetyCheckResult
import com.yaoyouju.app.data.SafetyTips
import com.yaoyouju.app.data.SaveSummaryRequest
import com.yaoyouju.app.data.SavedSummary
import com.yaoyouju.app.data.SmsCodeRequest
import com.yaoyouju.app.data.SummaryContent
import com.yaoyouju.app.data.SummaryStatus
import com.yaoyouju.app.data.SymptomLog
import com.yaoyouju.app.data.TimelineResult
import com.yaoyouju.app.data.VerifyView
import kotlinx.serialization.json.JsonElement

/**
 * 内存假接口：默认返回空数据，测试可覆写关心的方法。
 * 用于 ViewModel 行为测试，不访问网络。
 */
open class FakeApiService : ApiService {

    /** 病程列表；空列表表示新用户（第一次写入会自动建病程） */
    var episodes: List<Episode> = emptyList()
    var createdEpisodes: MutableList<Episode> = mutableListOf()
    var failNextEpisodeCreate = false

    var latestAnalysis: AnalysisResult? = null
    var analysisCreateResult: AnalysisCreateResult? = null
    var analysisTaskStatus: AnalysisTaskStatus? = null

    var symptomLogSafety: SafetyCheckResult? = null
    var lastSymptomLogRequest: AddSymptomLogRequest? = null

    var lastReportRequest: CreateReportRequest? = null
    var lastEventRequest: AddEventRequest? = null

    var contentDetail: ContentItem? = null
    var contentDetailFull: ContentDetail? = null

    var qaSessions: List<QaSession> = emptyList()
    var qaSessionDetail: QaSessionDetail? = null
    var askResult: AskResult? = null

    var timeline: TimelineResult = TimelineResult()
    var summaryContent: SummaryContent? = null

    var consents: List<ConsentView> = emptyList()
    var me: MeResult? = null

    var helpFeedbackResult: HelpFeedbackResult? = HelpFeedbackResult("fb-1")
    var errorReportResult: ErrorReportResult? = ErrorReportResult("fb-2")

    override suspend fun sendSmsCode(body: SmsCodeRequest): ApiResponse<Map<String, Boolean>> =
        ApiResponse(data = mapOf("sent" to true))

    override suspend fun login(body: LoginRequest): ApiResponse<LoginResult> =
        ApiResponse(data = LoginResult("token-1", com.yaoyouju.app.data.UserBrief("u-1"), consents))

    override suspend fun getConsents(): ApiResponse<List<ConsentView>> = ApiResponse(data = consents)

    override suspend fun getMe(): ApiResponse<MeResult> = ApiResponse(data = me ?: MeResult("u-1", "138****1234"))

    override suspend fun setConsent(body: ConsentRequest): ApiResponse<List<ConsentView>> =
        ApiResponse(data = consents)

    override suspend fun logout(): ApiResponse<Map<String, Boolean>> = ApiResponse(data = mapOf("ok" to true))

    override suspend fun deleteAccount(): ApiResponse<Map<String, Boolean>> = ApiResponse(data = mapOf("ok" to true))

    override suspend fun exportData(): ApiResponse<Map<String, JsonElement>> = ApiResponse(data = emptyMap())

    override suspend fun getSafetyTips(): ApiResponse<SafetyTips> =
        ApiResponse(data = SafetyTips("出现以下情况请及时就医", emptyList(), "R-4", "本提示不构成诊断"))

    override suspend fun checkSafety(body: Map<String, String>): ApiResponse<SafetyCheckResult> =
        ApiResponse(data = SafetyCheckResult())

    override suspend fun listEpisodes(): ApiResponse<List<Episode>> = ApiResponse(data = episodes)

    override suspend fun createEpisode(body: CreateEpisodeRequest): ApiResponse<Episode> {
        if (failNextEpisodeCreate) throw IllegalStateException("boom")
        // 与真实服务端一致：只返回 id
        val episode = Episode(id = "ep-new", title = body.title)
        createdEpisodes += episode
        episodes = listOf(episode)
        return ApiResponse(data = episode)
    }

    override suspend fun getEpisode(id: String): ApiResponse<Episode> =
        ApiResponse(data = episodes.firstOrNull { it.id == id })

    override suspend fun listEvents(id: String): ApiResponse<List<CareEvent>> = ApiResponse(data = emptyList())

    override suspend fun addEvent(id: String, body: AddEventRequest): ApiResponse<CareEvent> {
        lastEventRequest = body
        return ApiResponse(
            data = CareEvent(
                id = "ev-new",
                episodeId = id,
                eventType = body.eventType,
                occurredAt = body.occurredAt,
                sourceType = body.sourceType,
                rawText = body.rawText,
                verifyStatus = body.verifyStatus ?: "尚未确认",
            ),
        )
    }

    override suspend fun correctEvent(eventId: String, body: CorrectEventRequest): ApiResponse<CareEvent> =
        ApiResponse(data = CareEvent(eventId, "ep-1", "症状", "2026-09-01T00:00:00Z", sourceType = "自述", rawText = body.rawText))

    override suspend fun deleteEvent(eventId: String): ApiResponse<Map<String, Boolean>> = ApiResponse(data = mapOf("deleted" to true))

    override suspend fun timeline(id: String): ApiResponse<TimelineResult> = ApiResponse(data = timeline)

    override suspend fun listSymptomLogs(id: String): ApiResponse<List<SymptomLog>> = ApiResponse(data = emptyList())

    override suspend fun addSymptomLog(id: String, body: AddSymptomLogRequest): ApiResponse<SymptomLog> {
        lastSymptomLogRequest = body
        return ApiResponse(
            data = SymptomLog(
                id = "sl-new",
                careEventId = "ev-new",
                occurredAt = body.occurredAt,
                sitMinutes = body.sitMinutes?.let { com.yaoyouju.app.data.JsonScalar(it.toString()) },
                plannedActivityDone = body.plannedActivityDone?.let { com.yaoyouju.app.data.JsonScalar(it) },
                sleepImpact = body.sleepImpact?.let { com.yaoyouju.app.data.JsonScalar(it.toString()) },
                topWorry = body.topWorry?.let { com.yaoyouju.app.data.JsonScalar(it) },
                legChange = body.legChange?.let { com.yaoyouju.app.data.JsonScalar(it) },
                changeVsYesterday = body.changeVsYesterday?.let { com.yaoyouju.app.data.JsonScalar(it) },
                activitiesDone = body.activitiesDone?.let { com.yaoyouju.app.data.JsonScalar(it) },
                safety = symptomLogSafety,
            ),
        )
    }

    override suspend fun updateSymptomLog(logId: String, episodeId: String, body: Map<String, String>): ApiResponse<SymptomLog> =
        ApiResponse(data = SymptomLog(logId, "ev-1", safety = SafetyCheckResult()))

    override suspend fun createReport(body: CreateReportRequest): ApiResponse<Report> {
        lastReportRequest = body
        return ApiResponse(
            data = Report(
                id = "rp-new",
                careEventId = body.careEventId,
                reportDate = body.reportDate,
                rawText = body.rawText,
                examType = body.examType,
                hospital = body.hospital,
            ),
        )
    }

    override suspend fun getReport(id: String): ApiResponse<Report> = ApiResponse(data = Report(id, "ev-1", rawText = ""))

    override suspend fun verifyReport(id: String): ApiResponse<VerifyView> =
        ApiResponse(
            data = VerifyView(
                id,
                com.yaoyouju.app.data.VerifySource("报告原文", ""),
                com.yaoyouju.app.data.VerifyTime(null, "2026-09-01T00:00:00Z"),
                "尚未确认",
            ),
        )

    override suspend fun confirmReport(id: String, body: ConfirmReportRequest): ApiResponse<VerifyView> =
        ApiResponse(
            data = VerifyView(
                id,
                com.yaoyouju.app.data.VerifySource("报告原文", ""),
                com.yaoyouju.app.data.VerifyTime(null, "2026-09-01T00:00:00Z"),
                body.verifyStatus,
            ),
        )

    override suspend fun ocr(body: Map<String, String>): ApiResponse<Map<String, JsonElement>> = ApiResponse(data = emptyMap())

    override suspend fun createAnalysis(body: CreateAnalysisRequest): ApiResponse<AnalysisCreateResult> =
        ApiResponse(data = analysisCreateResult ?: AnalysisCreateResult("task-1", "排队"))

    override suspend fun getLatestAnalysis(episodeId: String): ApiResponse<AnalysisResult> = ApiResponse(data = latestAnalysis)

    override suspend fun getAnalysis(id: String): ApiResponse<AnalysisTaskStatus> =
        ApiResponse(data = analysisTaskStatus ?: AnalysisTaskStatus(id, "完成", analysis = latestAnalysis))

    override suspend fun createQaSession(body: CreateQaSessionRequest): ApiResponse<QaSession> =
        ApiResponse(data = QaSession("qa-1", body.analysisId, body.episodeId, body.title))

    override suspend fun listQaSessions(): ApiResponse<List<QaSession>> = ApiResponse(data = qaSessions)

    override suspend fun getQaSession(id: String): ApiResponse<QaSessionDetail> =
        ApiResponse(data = qaSessionDetail ?: QaSessionDetail(id, messages = emptyList()))

    override suspend fun ask(id: String, body: AskRequest): ApiResponse<AskResult> =
        ApiResponse(data = askResult ?: AskResult(com.yaoyouju.app.data.QaMessage("m-1", "assistant", "回答", createdAt = "2026-09-01T00:00:00Z")))

    override suspend fun addFollowupQuestion(id: String, body: AddFollowupQuestionRequest): ApiResponse<FollowupQuestionResult> =
        ApiResponse(data = FollowupQuestionResult(true, body.question))

    override suspend fun listFollowupQuestions(id: String): ApiResponse<List<String>> = ApiResponse(data = emptyList())

    override suspend fun previewSummary(episodeId: String): ApiResponse<SummaryContent> = ApiResponse(data = summaryContent)

    override suspend fun summaryStatus(episodeId: String): ApiResponse<SummaryStatus> = ApiResponse(data = SummaryStatus())

    override suspend fun saveSummary(body: SaveSummaryRequest): ApiResponse<SavedSummary> =
        ApiResponse(data = SavedSummary("sum-1", body.episodeId, body.content))

    override suspend fun correctSummary(id: String, body: CorrectSummaryRequest): ApiResponse<SavedSummary> =
        ApiResponse(data = SavedSummary(id, "ep-1", body.content))

    override suspend fun reorderQuestions(id: String, body: ReorderQuestionsRequest): ApiResponse<SavedSummary> =
        ApiResponse(data = SavedSummary(id, "ep-1", SummaryContent(questions = body.questions)))

    override suspend fun exportSummary(id: String, body: ExportRequest): ApiResponse<ExportResult> =
        ApiResponse(data = ExportResult(id, "ep-1", body.format, "2026-09-01T00:00:00Z", "文本"))

    override suspend fun listPublishedContents(): ApiResponse<List<ContentItem>> = ApiResponse(data = emptyList())

    override suspend fun recommendedContents(): ApiResponse<List<ContentItem>> = ApiResponse(data = emptyList())

    override suspend fun getContentDetail(id: String): ApiResponse<ContentDetail> =
        ApiResponse(data = contentDetailFull ?: ContentDetail(id, "视频", "内容"))

    override suspend fun submitRetell(id: String, body: RetellRequest): ApiResponse<RetellResult> =
        ApiResponse(data = RetellResult("rt-1", true))

    override suspend fun createHelpFeedback(body: HelpFeedbackRequest): ApiResponse<HelpFeedbackResult> =
        ApiResponse(data = helpFeedbackResult)

    override suspend fun createErrorReport(body: ErrorReportRequest): ApiResponse<ErrorReportResult> =
        ApiResponse(data = errorReportResult)

    override suspend fun listMyFeedback(): ApiResponse<List<FeedbackItem>> = ApiResponse(data = emptyList())

    override suspend fun getFeedback(id: String): ApiResponse<FeedbackItem> =
        ApiResponse(data = FeedbackItem(id))
}
