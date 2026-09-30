package com.yaoyouju.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/* ---------- 统一响应 ---------- */
@Serializable
data class ApiResponse<T>(
    val code: Int = 0,
    val data: T? = null,
    val message: String = "ok",
)

/* ---------- 授权 ---------- */
@Serializable
data class ConsentView(
    val scope: String,
    val granted: Boolean,
    val grantedAt: String? = null,
    val revokedAt: String? = null,
)

@Serializable
data class LoginResult(
    val token: String,
    val user: UserBrief,
    val consents: List<ConsentView> = emptyList(),
)

@Serializable
data class UserBrief(val id: String)

@Serializable
data class MeResult(val id: String, val maskedPhone: String? = null)

/* ---------- 安全 ---------- */
@Serializable
data class SafetyTips(
    val title: String,
    val redFlags: List<String> = emptyList(),
    val rulesetVersion: String? = null,
    val note: String,
)

@Serializable
data class SafetyFlag(
    val code: String,
    val name: String,
    val severity: String,
    val action: String,
    val message: String,
)

@Serializable
data class SafetyCheckResult(
    val rulesetVersion: String? = null,
    val redFlags: List<SafetyFlag> = emptyList(),
    val outOfScope: List<SafetyFlag> = emptyList(),
    val passed: Boolean = true,
    val safetyTips: List<String> = emptyList(),
)

/* ---------- 病程 ---------- */
@Serializable
data class Episode(
    val id: String,
    val title: String,
    val onsetDate: String? = null,
    val onsetCertainty: String = "尚未确认",
    val status: String? = null,
)

@Serializable
data class CareEvent(
    val id: String,
    val episodeId: String,
    val eventType: String,
    val occurredAt: String,
    val reportedAt: String? = null,
    val sourceType: String,
    val rawText: String? = null,
    val verifyStatus: String = "尚未确认",
)

@Serializable
data class SymptomLog(
    val id: String,
    val careEventId: String? = null,
    val occurredAt: String,
    val sitMinutes: JsonScalar? = null,
    val plannedActivityDone: JsonScalar? = null,
    val sleepImpact: JsonScalar? = null,
    val topWorry: JsonScalar? = null,
    val legChange: JsonScalar? = null,
)

@Serializable
data class TimelineResult(
    val events: List<CareEvent> = emptyList(),
    val symptomLogs: List<SymptomLog> = emptyList(),
)

/* ---------- 报告 ---------- */
@Serializable
data class ExtractedTerm(val term: String, val position: Int = 0)

@Serializable
data class Report(
    val id: String,
    val careEventId: String,
    val reportDate: String? = null,
    val rawText: String,
    val extractedTerms: List<ExtractedTerm> = emptyList(),
    val sourceType: String = "报告原文",
    val verifyStatus: String = "尚未确认",
)

@Serializable
data class VerifySource(val type: String, val rawText: String)

@Serializable
data class VerifyTime(val reportDate: String? = null, val occurredAt: String)

@Serializable
data class VerifyView(
    val reportId: String,
    val source: VerifySource,
    val time: VerifyTime,
    val verifyStatus: String,
    val terms: List<ExtractedTerm> = emptyList(),
    val conflicts: List<String> = emptyList(),
    val note: String = "",
)

/* ---------- 分析 ---------- */
@Serializable
data class AnalysisSection(
    val text: String,
    val source: String? = null,
    val mark: String? = null,
)

@Serializable
data class VideoRecommendation(
    val title: String,
    val contentId: String,
    val reason: String = "",
)

@Serializable
data class AnalysisSections(
    @SerialName("已知") val known: List<AnalysisSection> = emptyList(),
    @SerialName("解释") val explanation: List<AnalysisSection> = emptyList(),
    @SerialName("未知") val unknown: List<AnalysisSection> = emptyList(),
    @SerialName("下一步") val next: List<AnalysisSection> = emptyList(),
    @SerialName("视频") val videos: List<VideoRecommendation> = emptyList(),
)

@Serializable
data class RetrievalSnapshot(
    val evidenceDocs: List<String> = emptyList(),
    val modelRelease: String = "",
    val contentLibVersion: String = "",
    val rulesetVersion: String = "",
)

@Serializable
data class AnalysisCitation(
    val id: String,
    val evidenceDocId: String,
    val evidenceDocTitle: String? = null,
    val statement: String,
    val supported: Int = 0,
)

@Serializable
data class AnalysisResult(
    val id: String,
    val episodeId: String,
    val version: Int = 1,
    val modelReleaseId: String = "",
    val modelName: String? = null,
    val contentLibVersion: String? = null,
    val sections: AnalysisSections = AnalysisSections(),
    val retrievalSnapshot: RetrievalSnapshot = RetrievalSnapshot(),
    val safetyFlag: String = "无",
    val createdAt: String = "",
    val citations: List<AnalysisCitation> = emptyList(),
)

@Serializable
data class AnalysisCreateResult(
    val taskId: String,
    val status: String,
    val safety: SafetyCheckResult = SafetyCheckResult(),
)

@Serializable
data class AnalysisTaskStatus(
    val taskId: String,
    val status: String,
    val attempts: Int = 0,
    val analysis: AnalysisResult? = null,
    val fallback: Boolean = false,
    val reason: String? = null,
    val notice: String? = null,
    val available: List<String> = emptyList(),
)

/* ---------- 问与解释 ---------- */
@Serializable
data class QaCitation(val docId: String, val docTitle: String, val content: String)

@Serializable
data class QaMessage(
    val id: String,
    val role: String,
    val content: String,
    val citations: List<QaCitation> = emptyList(),
    val createdAt: String = "",
)

@Serializable
data class QaSession(
    val id: String,
    val analysisId: String? = null,
    val episodeId: String? = null,
    val title: String? = null,
    val createdAt: String = "",
)

@Serializable
data class QaSessionDetail(
    val id: String,
    val analysisId: String? = null,
    val title: String? = null,
    val messages: List<QaMessage> = emptyList(),
)

@Serializable
data class AskResult(
    val message: QaMessage,
    val outOfScope: List<SafetyFlag> = emptyList(),
    val roundEnded: Boolean = false,
    val followupQuestionAdded: Boolean = false,
)

@Serializable
data class FollowupQuestionResult(val added: Boolean, val question: String)

/* ---------- 复诊摘要 ---------- */
@Serializable
data class SummaryEntry(val text: String, val source: String? = null, val mark: String? = null)

@Serializable
data class SummaryContent(
    @SerialName("当前情况") val current: List<SummaryEntry> = emptyList(),
    @SerialName("报告要点") val report: List<SummaryEntry> = emptyList(),
    @SerialName("医嘱要点") val advice: List<SummaryEntry> = emptyList(),
    @SerialName("尚未确认") val unconfirmed: List<SummaryEntry> = emptyList(),
    @SerialName("下一步") val next: List<SummaryEntry> = emptyList(),
    @SerialName("复诊问题") val questions: List<String> = emptyList(),
)

@Serializable
data class SavedSummary(val id: String, val episodeId: String, val content: SummaryContent)

@Serializable
data class ExportResult(
    val id: String,
    val episodeId: String,
    val format: String,
    val exportedAt: String,
    val text: String,
    val note: String? = null,
)

@Serializable
data class SummaryStatus(
    val exportedAt: String? = null,
    val format: String? = null,
)

/* ---------- 内容库 ---------- */
@Serializable
data class ContentItem(
    val id: String,
    val type: String,
    val title: String,
    val applicableScope: String? = null,
    val notApplicable: String? = null,
    val reason: String? = null,
    val duration: String? = null,
    val auditVersion: Int? = null,
)

@Serializable
data class ContentReview(
    val decision: String,
    val comment: String? = null,
    val reviewedAt: String = "",
    val reviewerName: String? = null,
)

@Serializable
data class ContentVersionInfo(val version: Int, val publishedAt: String? = null)

@Serializable
data class ContentDetail(
    val id: String,
    val type: String,
    val title: String,
    val applicableScope: String? = null,
    val notApplicable: String? = null,
    val reason: String? = null,
    val duration: String? = null,
    val auditVersion: Int? = null,
    val script: String? = null,
    val subtitleText: String? = null,
    val modelAssetVersion: String? = null,
    val publishedAt: String? = null,
    val reviews: List<ContentReview> = emptyList(),
    val versions: List<ContentVersionInfo> = emptyList(),
)

@Serializable
data class RetellResult(val id: String, val saved: Boolean)

/* ---------- 反馈 ---------- */
@Serializable
data class HelpFeedbackResult(val id: String, val isErrorReport: Boolean = false)

@Serializable
data class FeedbackVersions(
    val analysisVersion: Int? = null,
    val modelVersion: String? = null,
    val contentVersion: String? = null,
    val rulesetVersion: String = "",
)

@Serializable
data class ErrorReportResult(
    val id: String,
    val isErrorReport: Boolean = true,
    val severity: String = "",
    val versions: FeedbackVersions = FeedbackVersions(),
)

@Serializable
data class FeedbackItem(
    val id: String,
    val helpType: String? = null,
    val isErrorReport: Boolean = false,
    val severity: String? = null,
    val status: String? = null,
    val createdAt: String = "",
    val resolution: String? = null,
    val description: String? = null,
)

/* ---------- 通用可空标量（字段可能是数字 / 字符串 / null） ---------- */
@Serializable(with = JsonScalarSerializer::class)
data class JsonScalar(val raw: String) {
    val isUnconfirmed: Boolean get() = raw == "尚未确认"
    override fun toString(): String = raw
}
