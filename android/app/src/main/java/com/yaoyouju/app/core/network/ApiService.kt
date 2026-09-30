package com.yaoyouju.app.core.network

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
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/** 与 server 接口一一对应（统一响应格式见 server/docs/errors.md）。 */
interface ApiService {

    /* 授权 */
    @POST("auth/sms-code")
    suspend fun sendSmsCode(@Body body: SmsCodeRequest): ApiResponse<Map<String, Boolean>>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): ApiResponse<LoginResult>

    @GET("auth/consents")
    suspend fun getConsents(): ApiResponse<List<ConsentView>>

    @GET("auth/me")
    suspend fun getMe(): ApiResponse<MeResult>

    @POST("auth/consents")
    suspend fun setConsent(@Body body: ConsentRequest): ApiResponse<List<ConsentView>>

    @POST("auth/logout")
    suspend fun logout(): ApiResponse<Map<String, Boolean>>

    @POST("auth/delete")
    suspend fun deleteAccount(): ApiResponse<Map<String, Boolean>>

    @GET("auth/export")
    suspend fun exportData(): ApiResponse<Map<String, kotlinx.serialization.json.JsonElement>>

    /* 安全 */
    @GET("safety/tips")
    suspend fun getSafetyTips(): ApiResponse<SafetyTips>

    @POST("safety/check")
    suspend fun checkSafety(@Body body: Map<String, String>): ApiResponse<SafetyCheckResult>

    /* 病程 */
    @GET("episodes")
    suspend fun listEpisodes(): ApiResponse<List<Episode>>

    @POST("episodes")
    suspend fun createEpisode(@Body body: CreateEpisodeRequest): ApiResponse<Episode>

    @GET("episodes/{id}")
    suspend fun getEpisode(@Path("id") id: String): ApiResponse<Episode>

    @GET("episodes/{id}/events")
    suspend fun listEvents(@Path("id") id: String): ApiResponse<List<CareEvent>>

    @POST("episodes/{id}/events")
    suspend fun addEvent(@Path("id") id: String, @Body body: AddEventRequest): ApiResponse<CareEvent>

    @PUT("episodes/events/{eventId}")
    suspend fun correctEvent(@Path("eventId") eventId: String, @Body body: CorrectEventRequest): ApiResponse<CareEvent>

    @DELETE("episodes/events/{eventId}")
    suspend fun deleteEvent(@Path("eventId") eventId: String): ApiResponse<Map<String, Boolean>>

    @GET("episodes/{id}/timeline")
    suspend fun timeline(@Path("id") id: String): ApiResponse<TimelineResult>

    @GET("episodes/{id}/symptom-logs")
    suspend fun listSymptomLogs(@Path("id") id: String): ApiResponse<List<SymptomLog>>

    @POST("episodes/{id}/symptom-logs")
    suspend fun addSymptomLog(@Path("id") id: String, @Body body: AddSymptomLogRequest): ApiResponse<SymptomLog>

    @PUT("episodes/symptom-logs/{logId}")
    suspend fun updateSymptomLog(
        @Path("logId") logId: String,
        @Query("episodeId") episodeId: String,
        @Body body: Map<String, String>,
    ): ApiResponse<SymptomLog>

    /* 报告 */
    @POST("reports")
    suspend fun createReport(@Body body: CreateReportRequest): ApiResponse<Report>

    @GET("reports/{id}")
    suspend fun getReport(@Path("id") id: String): ApiResponse<Report>

    @GET("reports/{id}/verify")
    suspend fun verifyReport(@Path("id") id: String): ApiResponse<VerifyView>

    @PUT("reports/{id}/confirm")
    suspend fun confirmReport(@Path("id") id: String, @Body body: ConfirmReportRequest): ApiResponse<VerifyView>

    @POST("reports/ocr")
    suspend fun ocr(@Body body: Map<String, String>): ApiResponse<Map<String, kotlinx.serialization.json.JsonElement>>

    /* 分析 */
    @POST("analyses")
    suspend fun createAnalysis(@Body body: CreateAnalysisRequest): ApiResponse<AnalysisCreateResult>

    @GET("analyses/episodes/{episodeId}/latest")
    suspend fun getLatestAnalysis(@Path("episodeId") episodeId: String): ApiResponse<AnalysisResult>

    @GET("analyses/{id}")
    suspend fun getAnalysis(@Path("id") id: String): ApiResponse<AnalysisTaskStatus>

    /* 问与解释 */
    @POST("qa/sessions")
    suspend fun createQaSession(@Body body: CreateQaSessionRequest): ApiResponse<QaSession>

    @GET("qa/sessions")
    suspend fun listQaSessions(): ApiResponse<List<QaSession>>

    @GET("qa/sessions/{id}")
    suspend fun getQaSession(@Path("id") id: String): ApiResponse<QaSessionDetail>

    @POST("qa/sessions/{id}/messages")
    suspend fun ask(@Path("id") id: String, @Body body: AskRequest): ApiResponse<AskResult>

    @POST("qa/sessions/{id}/followup-questions")
    suspend fun addFollowupQuestion(
        @Path("id") id: String,
        @Body body: AddFollowupQuestionRequest,
    ): ApiResponse<FollowupQuestionResult>

    @GET("qa/sessions/{id}/followup-questions")
    suspend fun listFollowupQuestions(@Path("id") id: String): ApiResponse<List<String>>

    /* 复诊摘要 */
    @GET("followup/summary")
    suspend fun previewSummary(@Query("episodeId") episodeId: String): ApiResponse<SummaryContent>

    @GET("followup/summary-status")
    suspend fun summaryStatus(@Query("episodeId") episodeId: String): ApiResponse<SummaryStatus>

    @POST("followup/summary")
    suspend fun saveSummary(@Body body: SaveSummaryRequest): ApiResponse<SavedSummary>

    @PUT("followup/summary/{id}")
    suspend fun correctSummary(@Path("id") id: String, @Body body: CorrectSummaryRequest): ApiResponse<SavedSummary>

    @PUT("followup/summary/{id}/questions")
    suspend fun reorderQuestions(
        @Path("id") id: String,
        @Body body: ReorderQuestionsRequest,
    ): ApiResponse<SavedSummary>

    @POST("followup/summary/{id}/export")
    suspend fun exportSummary(@Path("id") id: String, @Body body: ExportRequest): ApiResponse<ExportResult>

    /* 内容库 */
    @GET("contents/published")
    suspend fun listPublishedContents(): ApiResponse<List<ContentItem>>

    @GET("contents/recommended")
    suspend fun recommendedContents(): ApiResponse<List<ContentItem>>

    @GET("contents/published/{id}")
    suspend fun getContentDetail(@Path("id") id: String): ApiResponse<ContentDetail>

    @POST("contents/published/{id}/retell")
    suspend fun submitRetell(@Path("id") id: String, @Body body: RetellRequest): ApiResponse<RetellResult>

    /* 反馈 */
    @POST("feedback")
    suspend fun createHelpFeedback(@Body body: HelpFeedbackRequest): ApiResponse<HelpFeedbackResult>

    @POST("feedback/reports")
    suspend fun createErrorReport(@Body body: ErrorReportRequest): ApiResponse<ErrorReportResult>

    @GET("feedback/mine")
    suspend fun listMyFeedback(): ApiResponse<List<FeedbackItem>>

    @GET("feedback/{id}")
    suspend fun getFeedback(@Path("id") id: String): ApiResponse<FeedbackItem>
}
