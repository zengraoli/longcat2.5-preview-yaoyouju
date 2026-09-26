package com.yaoyouju.app.data.api

import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.Serializable

/** 统一响应格式 {"code":0,"data":...,"message":"ok"} */
@Serializable
data class ApiResponse<T>(
    val code: Int = 0,
    val data: T? = null,
    val message: String = "ok",
)

data class ApiException(val code: Int, override val message: String) : Exception(message)

// ---------- 登录与授权 ----------
@Serializable
data class LoginData(val token: String, val userId: String)

@Serializable
data class ConsentItem(
    val scope: String,
    val granted: Boolean,
    val grantedAt: String? = null,
    val revokedAt: String? = null,
)

// ---------- 病程 ----------
@Serializable
data class Episode(
    val id: String,
    val userId: String,
    val title: String,
    val onsetDate: String? = null,
    val onsetCertainty: String = "尚未确认",
    val status: String = "active",
)

@Serializable
data class CareEvent(
    val id: String,
    val episodeId: String,
    val eventType: String,
    val occurredAt: String,
    val sourceType: String,
    val rawText: String? = null,
    val verifyStatus: String = "尚未确认",
    val sitMinutes: Int? = null,
    val plannedActivityDone: String? = null,
    val sleepImpact: Int? = null,
    val topWorry: String? = null,
    val legChange: String? = null,
)

// ---------- 报告 ----------
@Serializable
data class ExtractedTerm(val term: String, val position: String)

@Serializable
data class StructuredReport(
    val reportId: String,
    val reportDate: String,
    val rawText: String,
    val sourceType: String,
    val eventType: String? = null,
    val occurredAt: String? = null,
    val verifyStatus: String = "尚未确认",
    val extractedTerms: List<ExtractedTerm> = emptyList(),
    val hasConflict: Boolean = false,
    val requiresConfirmation: Boolean = false,
)

// ---------- 一页分析 ----------
@Serializable
data class AnalysisExplanation(
    val text: String,
    val source: String,
    val hasSource: Boolean = true,
)

@Serializable
data class AnalysisSections(
    val known: List<String> = emptyList(),
    val explanation: List<AnalysisExplanation> = emptyList(),
    val unknown: List<String> = emptyList(),
    val nextSteps: List<String> = emptyList(),
    val video: String? = null,
)

@Serializable
data class Analysis(
    val analysisId: String,
    val episodeId: String,
    val version: Int,
    val sections: AnalysisSections,
    val createdAt: String,
)

// ---------- 复诊摘要 ----------
@Serializable
data class FollowupReport(val date: String, val text: String, val verifyStatus: String = "尚未确认")

@Serializable
data class FollowupSection<T : Any>(val title: String, val items: List<T> = emptyList())

@Serializable
data class FollowupPreview(
    val episodeId: String,
    val generatedAt: String,
    val chiefComplaint: JsonElement? = null,
    val examinationFindings: List<FollowupReport> = emptyList(),
    val doctorRecords: List<Map<String, String>> = emptyList(),
    val recentLogs: List<Map<String, String?>> = emptyList(),
    val questionsForDoctor: List<String> = emptyList(),
)

// ---------- 内容库 ----------
@Serializable
data class ContentItem(
    val id: String,
    val type: String,
    val title: String,
    val applicableScope: String? = null,
    val notApplicable: String? = null,
    val currentStatus: String = "已发布",
    val latestVersion: String? = null,
)

// ---------- 问与解释 ----------
@Serializable
data class QaResult(
    val sessionId: String,
    val answer: String? = null,
    val source: String? = null,
    val outOfScope: Boolean = false,
    val redFlag: Boolean = false,
    val message: String? = null,
    val isReassurance: Boolean = false,
)
