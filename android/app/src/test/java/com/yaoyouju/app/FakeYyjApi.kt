package com.yaoyouju.app

import com.yaoyouju.app.data.api.Analysis
import com.yaoyouju.app.data.api.AnalysisExplanation
import com.yaoyouju.app.data.api.AnalysisSections
import com.yaoyouju.app.data.api.ApiResponse
import com.yaoyouju.app.data.api.CareEvent
import com.yaoyouju.app.data.api.ConsentItem
import com.yaoyouju.app.data.api.ContentItem
import com.yaoyouju.app.data.api.Episode
import com.yaoyouju.app.data.api.ExtractedTerm
import com.yaoyouju.app.data.api.FollowupChiefComplaint
import com.yaoyouju.app.data.api.FollowupConcerns
import com.yaoyouju.app.data.api.FollowupDiagnosis
import com.yaoyouju.app.data.api.FollowupExamination
import com.yaoyouju.app.data.api.FollowupPreview
import com.yaoyouju.app.data.api.FollowupQuestions
import com.yaoyouju.app.data.api.FollowupReport
import com.yaoyouju.app.data.api.FollowupSections
import com.yaoyouju.app.data.api.FollowupSymptoms
import com.yaoyouju.app.data.api.LoginData
import com.yaoyouju.app.data.api.QaResult
import com.yaoyouju.app.data.api.StructuredReport
import com.yaoyouju.app.data.api.YyjApi

/**
 * 演示数据实现：Roborazzi 截图测试用，覆盖各页面拉取的接口。
 */
class FakeYyjApi : YyjApi {

    override suspend fun sendCode(body: Map<String, String>): ApiResponse<Map<String, Boolean>> =
        ApiResponse(data = mapOf("sent" to true))

    override suspend fun login(body: Map<String, String>): ApiResponse<LoginData> =
        ApiResponse(data = LoginData(token = "demo-token", userId = "u-1"))

    override suspend fun grantConsent(body: com.yaoyouju.app.data.api.ConsentRequest): ApiResponse<Map<String, Boolean>> =
        ApiResponse(data = mapOf("granted" to true))

    override suspend fun getConsent(): ApiResponse<List<ConsentItem>> =
        ApiResponse(
            data = listOf(
                ConsentItem(scope = "健康信息处理", granted = true, grantedAt = "2026-09-01T10:00:00Z"),
                ConsentItem(scope = "分享/产品改进", granted = false),
            ),
        )

    override suspend fun revokeConsent(body: Map<String, String>): ApiResponse<Map<String, Boolean>> =
        ApiResponse(data = mapOf("revoked" to true))

    override suspend fun getEpisodes(): ApiResponse<List<Episode>> =
        ApiResponse(
            data = listOf(
                Episode(
                    id = "ep-1",
                    userId = "u-1",
                    title = "本次发作",
                    onsetDate = "2026-08-15",
                    onsetCertainty = "尚未确认",
                    status = "active",
                ),
            ),
        )

    override suspend fun createEpisode(body: Map<String, String>): ApiResponse<Map<String, String>> =
        ApiResponse(data = mapOf("id" to "ep-1"))

    override suspend fun createCareEvent(body: Map<String, String>): ApiResponse<Map<String, String>> =
        ApiResponse(data = mapOf("id" to "ce-new"))

    override suspend fun getTimeline(id: String): ApiResponse<List<CareEvent>> =
        ApiResponse(
            data = listOf(
                CareEvent(
                    id = "ce-change", episodeId = "ep-1", eventType = "变化确认",
                    occurredAt = "2026-09-20T10:00:00", sourceType = "自述",
                    rawText = "变化：最近一周加重；红旗项：以上都没有；侧别：左侧；开始日期：尚未确认",
                    verifyStatus = "已确认",
                ),
                CareEvent(
                    id = "ce-confusion", episodeId = "ep-1", eventType = "主要困惑",
                    occurredAt = "2026-09-20T10:05:00", sourceType = "自述",
                    rawText = "主要困惑：报告术语",
                    verifyStatus = "已确认",
                ),
                CareEvent(
                    id = "ce-symptom", episodeId = "ep-1", eventType = "症状",
                    occurredAt = "2026-09-21T08:00:00", sourceType = "自述",
                    rawText = "与上周相比加重；能坐约 30 分钟；夜间痛醒 1 次",
                    verifyStatus = "尚未确认",
                    sitMinutes = 30, topWorry = "会不会越来越严重", legChange = "尚未确认",
                ),
                CareEvent(
                    id = "ce-advice", episodeId = "ep-1", eventType = "医嘱",
                    occurredAt = "2026-09-10T09:00:00", sourceType = "自述转述",
                    rawText = "医生建议保守治疗，4 周后复查。",
                    verifyStatus = "尚未确认",
                ),
                CareEvent(
                    id = "ce-report", episodeId = "ep-1", eventType = "报告",
                    occurredAt = "2026-08-30T10:00:00", sourceType = "报告原文",
                    rawText = "腰椎 MRI：L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。",
                    verifyStatus = "已确认",
                ),
                CareEvent(
                    id = "ce-onset", episodeId = "ep-1", eventType = "症状开始",
                    occurredAt = "2026-08-15T08:00:00", sourceType = "自述",
                    rawText = "腰痛开始，起初以久坐后酸痛为主。",
                    verifyStatus = "尚未确认",
                ),
            ),
        )

    override suspend fun createReport(body: Map<String, String>): ApiResponse<Map<String, String>> =
        ApiResponse(data = mapOf("id" to "r-1"))

    override suspend fun getReportsByEpisode(episodeId: String): ApiResponse<List<Map<String, String?>>> =
        ApiResponse(
            data = listOf(
                mapOf(
                    "id" to "r-1",
                    "report_date" to "2026-08-30",
                    "raw_text" to "腰椎 MRI：L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。",
                ),
            ),
        )

    override suspend fun getStructuredReport(id: String): ApiResponse<StructuredReport> =
        ApiResponse(
            data = StructuredReport(
                reportId = "r-1",
                reportDate = "2026-08-30",
                rawText = "检查所见：腰椎生理曲度存在，各椎体形态、信号未见明显异常。L4/5椎间盘轻度膨出。L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。椎管未见明显狭窄。印象：L5/S1椎间盘突出；L4/5椎间盘膨出。",
                sourceType = "报告原文",
                eventType = "报告",
                occurredAt = "2026-08-30T10:00:00",
                verifyStatus = "已确认",
                hasConflict = true,
                requiresConfirmation = true,
                extractedTerms = listOf(
                    ExtractedTerm("L5/S1椎间盘向后突出", "第2行"),
                    ExtractedTerm("相应硬膜囊受压", "第2行"),
                    ExtractedTerm("右侧神经根受压可能", "第3行"),
                ),
            ),
        )

    override suspend fun verifyReport(id: String, body: Map<String, Any?>): ApiResponse<Map<String, String>> =
        ApiResponse(data = mapOf("verified" to "true"))

    override suspend fun getLatestAnalysis(episodeId: String): ApiResponse<Analysis> =
        ApiResponse(data = demoAnalysis)

    override suspend fun createAnalysis(body: Map<String, String>): ApiResponse<Map<String, String>> =
        ApiResponse(data = mapOf("taskId" to "an-new", "status" to "completed"))

    override suspend fun previewFollowup(body: Map<String, String>): ApiResponse<FollowupPreview> =
        ApiResponse(
            data = FollowupPreview(
                episodeId = "ep-1",
                generatedAt = "2026-09-21T09:41:00",
                sections = FollowupSections(
                    chiefComplaint = FollowupChiefComplaint(
                        title = "主诉与病程",
                        selfReported = listOf("腰痛持续约 1 个月，最近一周加重"),
                        onsetDate = "2026-08-15",
                    ),
                    examinationFindings = FollowupExamination(
                        reports = listOf(
                            FollowupReport(
                                date = "2026-08-30",
                                text = "腰椎 MRI：L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。",
                            ),
                        ),
                    ),
                    diagnosisAndAssessment = FollowupDiagnosis(
                        doctorRecords = listOf(
                            mapOf("text" to "保守治疗，4 周后复查（2026-09-10 就诊时医生口头建议）。", "verifyStatus" to "尚未确认"),
                        ),
                        latestAnalysis = listOf("L5/S1", "硬膜囊受压"),
                    ),
                    symptomsAndChanges = FollowupSymptoms(
                        recentLogs = listOf(
     
                            mapOf("date" to "尚未确认", "sitMinutes" to "30", "topWorry" to "会不会越来越严重", "legChange" to "尚未确认"),
                        ),
                    ),
                    concerns = FollowupConcerns(topWorries = listOf("会不会越来越严重")),
                    questionsForDoctor = FollowupQuestions(),
                ),
            ),
        )

    override suspend fun exportFollowup(body: Map<String, String>): ApiResponse<Map<String, String>> =
        ApiResponse(data = mapOf("id" to "f-1", "format" to "pdf"))

    override suspend fun askQuestion(body: Map<String, String>): ApiResponse<QaResult> =
        ApiResponse(
            data = QaResult(
                sessionId = "qa-1",
                answer = "这是基于您当前情况与报告原文的解释。",
                source = "evidence-doc-1",
            ),
        )

    override suspend fun getPublishedContents(): ApiResponse<List<ContentItem>> =
        ApiResponse(
            data = listOf(
                ContentItem(
                    id = "c-1", type = "视频", title = "腰椎节段位置：L5/S1 在哪里",
                    applicableScope = "想了解报告中“L5/S1”“节段”等术语的含义",
                    notApplicable = "判断自己的突出程度、是否需要手术、康复动作选择",
                    currentStatus = "已发布",
                ),
                ContentItem(
                    id = "c-2", type = "图文组件", title = "“硬膜囊受压”是在说什么",
                    applicableScope = "适用于报告术语解读", notApplicable = "无",
                    currentStatus = "已发布",
                ),
                ContentItem(
                    id = "c-3", type = "视频", title = "影像上的突出与疼痛为什么不是一回事",
                    applicableScope = "适用于病程变化理解", notApplicable = "无",
                    currentStatus = "已发布",
                ),
            ),
        )

    override suspend fun createSymptomLog(body: Map<String, Any?>): ApiResponse<Map<String, String>> =
        ApiResponse(data = mapOf("id" to "sl-1"))

    override suspend fun deleteCareEvent(eventId: String): ApiResponse<Map<String, Boolean>> =
        ApiResponse(data = mapOf("deleted" to true))

    override suspend fun createFeedback(body: Map<String, Any?>): ApiResponse<Map<String, String>> =
        ApiResponse(data = mapOf("id" to "fb-1"))

    companion object {
        val demoAnalysis = Analysis(
            analysisId = "an-1",
            episodeId = "ep-1",
            version = 3,
            sections = AnalysisSections(
                known = listOf("L5/S1", "硬膜囊受压"),
                explanation = listOf(
                    AnalysisExplanation("“L5/S1”指第5腰椎与第1骶椎之间的椎间盘，是腰椎最下方、承重最大的节段之一。", "审核科普 #12"),
                    AnalysisExplanation("“硬膜囊受压”描述影像上突出物与神经外膜结构的位置关系，是影像描述，不等于症状严重程度。", "审核科普 #07"),
                    AnalysisExplanation("影像上的突出与疼痛之间不是一一对应的关系；很多无症状的人影像上也有类似表现。", "指南摘录 G-03"),
                ),
                unknown = listOf(
                    "症状开始日期尚未确认；是否出现腿部无力尚未确认。",
                    "报告写“右侧神经根”，你描述疼痛在左侧——需要在复诊时向医生确认。",
                ),
                nextSteps = listOf(
                    "报告里的右侧神经根受压，和我左侧的疼痛有关系吗？",
                    "保守治疗期间，哪些变化出现时需要提前复诊？",
                    "目前的活动、久坐和睡姿有什么需要调整的？",
                    "手术必要性如何评估？",
                ),
            ),
            createdAt = "2026-09-21T09:41:00",
        )
    }
}
