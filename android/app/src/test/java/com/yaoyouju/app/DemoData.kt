package com.yaoyouju.app

import com.yaoyouju.app.core.components.EmergencyTips
import com.yaoyouju.app.data.AnalysisCitation
import com.yaoyouju.app.data.AnalysisResult
import com.yaoyouju.app.data.AnalysisSection
import com.yaoyouju.app.data.AnalysisSections
import com.yaoyouju.app.data.CareEvent
import com.yaoyouju.app.data.ContentDetail
import com.yaoyouju.app.data.ContentItem
import com.yaoyouju.app.data.ContentReview
import com.yaoyouju.app.data.ContentVersionInfo
import com.yaoyouju.app.data.Episode
import com.yaoyouju.app.data.ExtractedTerm
import com.yaoyouju.app.data.QaCitation
import com.yaoyouju.app.data.QaMessage
import com.yaoyouju.app.data.Report
import com.yaoyouju.app.data.RetrievalSnapshot
import com.yaoyouju.app.data.SummaryContent
import com.yaoyouju.app.data.SummaryEntry
import com.yaoyouju.app.data.SymptomLog
import com.yaoyouju.app.data.VerifySource
import com.yaoyouju.app.data.VerifyTime
import com.yaoyouju.app.data.VerifyView
import com.yaoyouju.app.data.VideoRecommendation

/** 截图测试用的虚构演示数据（不含真实用户信息）。 */
object DemoData {

    val emergencyTips = EmergencyTips(
        title = "出现以下情况请及时就医",
        redFlags = listOf(
            "大小便失禁或排尿困难",
            "会阴部（鞍区）麻木",
            "双腿进行性无力、走路不稳",
            "发热伴腰痛加重",
        ),
        note = "本提示不构成诊断；如症状持续或加重，请前往正规医疗机构就诊。",
    )

    val episode = Episode(
        id = "ep-1",
        title = "本次发作",
        onsetDate = "2026-08-15",
        onsetCertainty = "尚未确认",
        status = "进行中",
    )

    val analysis = AnalysisResult(
        id = "an-3",
        episodeId = "ep-1",
        version = 3,
        modelReleaseId = "mr-1",
        modelName = "本地模拟模型",
        contentLibVersion = "cl-2",
        sections = AnalysisSections(
            known = listOf(
                AnalysisSection(
                    text = "报告提到 L5/S1 椎间盘突出、硬膜囊受压；腰痛约 1 个月，最近加重",
                    source = "报告原文",
                ),
            ),
            explanation = listOf(
                AnalysisSection(text = "椎间盘突出是影像描述，不等于疼痛一定来自这里", source = "医学证据库"),
            ),
            unknown = listOf(
                AnalysisSection(text = "症状开始日期、是否腿部无力、侧别是否一致"),
            ),
            next = listOf(
                AnalysisSection(text = "把 4 个问题带去复诊；记录能坐时长与夜间痛醒"),
            ),
            videos = listOf(
                VideoRecommendation("腰椎节段位置：L5/S1 在哪里", "ct-1", "报告提到 L5/S1"),
            ),
        ),
        retrievalSnapshot = RetrievalSnapshot(
            evidenceDocs = listOf("指南-腰痛-2024"),
            modelRelease = "mr-1",
            contentLibVersion = "cl-2",
            rulesetVersion = "rs-1",
        ),
        safetyFlag = "无",
        createdAt = com.yaoyouju.app.core.util.BeijingTime.nowIso(),
        citations = listOf(
            AnalysisCitation("ci-1", "doc-1", "腰痛诊疗指南（演示）", "影像描述与症状需结合判断", 1),
        ),
    )

    val recommended = listOf(
        ContentItem(
            id = "ct-1",
            type = "视频",
            title = "腰椎节段位置：L5/S1 在哪里",
            applicableScope = "已确诊腰椎间盘突出、想理解影像术语的人",
            notApplicable = "急性外伤、出现红旗信号者",
            reason = "报告提到 L5/S1",
            duration = "2:10",
            auditVersion = 2,
        ),
        ContentItem(
            id = "ct-2",
            type = "图文组件",
            title = "坐姿与久坐：如何安排休息",
            applicableScope = "需要减少久坐负担的人",
            notApplicable = "术后康复需遵医嘱者",
            reason = "你记录了久坐后酸痛",
            duration = "3分钟阅读",
            auditVersion = 3,
        ),
    )

    val contentDetail = ContentDetail(
        id = "ct-1",
        type = "视频",
        title = "腰椎节段位置：L5/S1 在哪里",
        applicableScope = "已确诊腰椎间盘突出、想理解影像术语的人",
        notApplicable = "急性外伤、出现红旗信号者",
        reason = "报告提到 L5/S1",
        duration = "2:10",
        auditVersion = 2,
        script = "这一节讲清楚腰椎分节与 L5/S1 的位置，帮助你读懂报告里的术语。",
        subtitleText = "腰椎共有五节……L5 是第五节，S1 是骶椎第一节。",
        modelAssetVersion = "asset-v2",
        publishedAt = "2026-09-10T01:00:00Z",
        reviews = listOf(
            ContentReview("通过", "范围与表述准确", "2026-09-09T03:00:00Z", "临床审核·李医生"),
        ),
        versions = listOf(ContentVersionInfo(2, "2026-09-10T01:00:00Z")),
    )

    val events = listOf(
        CareEvent(
            id = "ev-1",
            episodeId = "ep-1",
            eventType = "报告",
            occurredAt = "2026-08-30T01:00:00Z",
            sourceType = "报告原文",
            rawText = "2026-08-30 腰椎 MRI：“L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。”",
            verifyStatus = "已确认",
        ),
        CareEvent(
            id = "ev-2",
            episodeId = "ep-1",
            eventType = "医嘱",
            occurredAt = "2026-09-10T01:00:00Z",
            sourceType = "医生记录",
            rawText = "保守治疗，4周后复查（就诊时医生口头建议）。",
            verifyStatus = "尚未确认",
        ),
        CareEvent(
            id = "ev-3",
            episodeId = "ep-1",
            eventType = "症状",
            occurredAt = "2026-09-20T01:00:00Z",
            sourceType = "自述",
            rawText = "目前腰痛持续约 1 个月，最近 1 周加重；主要在左侧；能坐约 30 分钟。",
            verifyStatus = "已确认",
        ),
    )

    val symptomLogs = listOf(
        SymptomLog(
            id = "sl-1",
            careEventId = "ev-3",
            occurredAt = "2026-09-20T01:00:00Z",
            sitMinutes = com.yaoyouju.app.data.JsonScalar("15-30"),
            plannedActivityDone = com.yaoyouju.app.data.JsonScalar("部分"),
            sleepImpact = com.yaoyouju.app.data.JsonScalar("1"),
            topWorry = com.yaoyouju.app.data.JsonScalar("会不会越来越严重"),
            legChange = com.yaoyouju.app.data.JsonScalar("尚未确认"),
        ),
    )

    val report = Report(
        id = "rp-1",
        careEventId = "ev-1",
        reportDate = "2026-08-30",
        rawText = "腰椎 MRI 报告：L5/S1 椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。腰椎生理曲度变直。",
        extractedTerms = listOf(ExtractedTerm("L5/S1", 12), ExtractedTerm("硬膜囊受压", 24)),
        sourceType = "报告原文",
        verifyStatus = "有冲突",
    )

    val verifyView = VerifyView(
        reportId = "rp-1",
        source = VerifySource("报告原文", report.rawText),
        time = VerifyTime("2026-08-30", "2026-08-30T01:00:00Z"),
        verifyStatus = "有冲突",
        terms = report.extractedTerms,
        conflicts = listOf("报告写“右侧”，你的描述是“左侧”"),
        note = "报告未描述的项目显示“报告未提及”，不代表已排除。",
    )

    val summary = SummaryContent(
        current = listOf(SummaryEntry("约 2026 年 8 月中旬开始腰痛，具体日期不确定；起初以久坐后酸痛为主。", "自述", "日期尚未确认")),
        report = listOf(SummaryEntry("2026-08-30 腰椎 MRI：“L5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。”", "报告原文", "与自述侧别不一致")),
        advice = listOf(SummaryEntry("保守治疗，4 周后复查（2026-09-10 就诊时医生口头建议）。", "自述转述", "未经核实")),
        unconfirmed = listOf(SummaryEntry("腿部无力：尚未确认", null, "尚未确认")),
        next = listOf(SummaryEntry("记录能坐时长与夜间痛醒次数。", "系统生成")),
        questions = listOf(
            "报告的右侧神经根受压与我左侧疼痛是否有关？",
            "保守治疗期间哪些变化要提前复诊？",
            "目前活动、久坐和睡姿要怎么调整？",
            "手术必要性如何评估？",
        ),
    )

    val qaMessages = listOf(
        QaMessage(
            id = "m-1",
            role = "user",
            content = "报告里写的右侧神经根受压，和我左侧疼有什么关系？",
            createdAt = "2026-09-21T02:05:00Z",
        ),
        QaMessage(
            id = "m-2",
            role = "assistant",
            content = "影像描述的部位与你感受到疼痛的部位不一定完全一致。你的报告提到右侧神经根受压可能，而你的疼痛在左侧，这属于“尚未确认”的信息，建议复诊时请医生结合查体判断。",
            citations = listOf(
                QaCitation("doc-1", "腰痛诊疗指南（演示）", "影像与症状需结合查体综合判断。"),
            ),
            createdAt = "2026-09-21T02:05:10Z",
        ),
    )
}
