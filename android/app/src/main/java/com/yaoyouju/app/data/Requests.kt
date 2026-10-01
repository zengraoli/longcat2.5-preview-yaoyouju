package com.yaoyouju.app.data

import kotlinx.serialization.Serializable

/* ---------- 请求体 ---------- */
@Serializable
data class SmsCodeRequest(val phone: String)

@Serializable
data class LoginRequest(val phone: String, val code: String, val agreedScopes: List<String>? = null)

@Serializable
data class ConsentRequest(val scope: String, val granted: String)

@Serializable
data class CreateEpisodeRequest(
    val title: String,
    val onsetDate: String? = null,
    val onsetCertainty: String? = null,
)

@Serializable
data class AddEventRequest(
    val eventType: String,
    val occurredAt: String,
    val sourceType: String,
    val rawText: String? = null,
    val verifyStatus: String? = null,
)

@Serializable
data class CorrectEventRequest(val rawText: String? = null, val verifyStatus: String? = null)

@Serializable
data class AddSymptomLogRequest(
    val occurredAt: String,
    val sitMinutes: Int? = null,
    val plannedActivityDone: String? = null,
    val sleepImpact: Int? = null,
    val topWorry: String? = null,
    val legChange: String? = null,
    val changeVsYesterday: String? = null,
    val activitiesDone: String? = null,
)

@Serializable
data class CreateReportRequest(
    val careEventId: String,
    val reportDate: String? = null,
    val sourceType: String,
    val rawText: String,
    /** 检查类型（MRI / CT / X光 / 超声）与检查机构单独存字段，不拼进原文 */
    val examType: String? = null,
    val hospital: String? = null,
)

@Serializable
data class ConfirmReportRequest(val verifyStatus: String)

@Serializable
data class CreateAnalysisRequest(val episodeId: String, val safetyText: String? = null)

@Serializable
data class CreateQaSessionRequest(
    val analysisId: String? = null,
    val title: String,
    val episodeId: String? = null,
)

@Serializable
data class AskRequest(val question: String)

@Serializable
data class AddFollowupQuestionRequest(val question: String)

@Serializable
data class SaveSummaryRequest(val episodeId: String, val content: SummaryContent)

@Serializable
data class CorrectSummaryRequest(val content: SummaryContent)

@Serializable
data class ReorderQuestionsRequest(val questions: List<String>)

@Serializable
data class ExportRequest(val format: String)

@Serializable
data class RetellRequest(val text: String)

@Serializable
data class HelpFeedbackRequest(
    val analysisId: String? = null,
    val contentId: String? = null,
    val helpType: String,
    val unsolvedQuestion: String? = null,
)

@Serializable
data class ErrorReportRequest(
    val analysisId: String? = null,
    val contentId: String? = null,
    val description: String,
    val severity: String,
    val problemTypes: List<String>? = null,
    val authorized: Boolean? = null,
)
