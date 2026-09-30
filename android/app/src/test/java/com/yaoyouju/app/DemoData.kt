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
        modelReleaseId = "M-2609",
        modelName = "本地模拟模型",
        contentLibVersion = "cl-2",
        sections = AnalysisSections(
            known = listOf(
                AnalysisSection(
                    text = "报告（2026-08-30, MRI）提到：L5/S1 椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。",
                    source = "报告",
                ),
                AnalysisSection(
                    text = "你描述：腰痛约1个月，最近一周加重，主要在左侧；没有大小便或鞍区异常。",
                    source = "症状",
                ),
                AnalysisSection(
                    text = "医生建议：保守治疗，4周后复查。",
                    source = "医嘱",
                    mark = "未经核实",
                ),
            ),
            explanation = listOf(
                AnalysisSection(
                    text = "“L5/S1” 指第5腰椎与第1骶椎之间的椎间盘，是腰椎最下方、承重最大的节段之一。",
                    source = "doc-1",
                ),
                AnalysisSection(
                    text = "“硬膜囊受压” 描述影像上突出物与神经外膜结构的位置关系，是影像描述，不等于症状严重程度。",
                    source = "doc-2",
                ),
                AnalysisSection(
                    text = "影像上的突出与疼痛之间不是一一对应的关系；很多无症状的人影像上也有类似表现。",
                    source = "doc-3",
                ),
            ),
            unknown = listOf(
                AnalysisSection(text = "症状开始日期尚未确认；是否出现腿部无力尚未确认。"),
                AnalysisSection(text = "报告写“右侧神经根”，你描述疼痛在左侧——需要在复诊时向医生确认。"),
                AnalysisSection(text = "不能据此判断这次疼痛的原因、严重程度，或是否需要手术。"),
            ),
            next = listOf(
                AnalysisSection(text = "报告里的右侧神经根受压，和我左侧的疼痛有关系吗？"),
                AnalysisSection(text = "保守治疗期间，哪些变化出现时需要提前复诊？"),
                AnalysisSection(text = "目前的活动、久坐和睡姿有什么需要调整的？"),
            ),
            videos = listOf(
                VideoRecommendation("腰椎节段位置：L5/S1 在哪里", "ct-1", "2:10 · 有字幕"),
            ),
        ),
        retrievalSnapshot = RetrievalSnapshot(
            evidenceDocs = listOf("doc-1", "doc-2", "doc-3"),
            modelRelease = "M-2609",
            contentLibVersion = "cl-2",
            rulesetVersion = "rs-1",
        ),
        safetyFlag = "无",
        createdAt = com.yaoyouju.app.core.util.BeijingTime.nowIso(),
        citations = listOf(
            AnalysisCitation("ci-1", "doc-1", "审核科普 #12", "L5/S1 的解剖位置", 1),
            AnalysisCitation("ci-2", "doc-2", "审核科普 #07", "硬膜囊受压是影像描述", 1),
            AnalysisCitation("ci-3", "doc-3", "指南摘录 G-03", "影像与症状不一一对应", 1),
        ),
    )

    /** A14 首页用的精简分析（与设计稿首页摘要一致） */
    val homeAnalysis = analysis.copy(
        sections = AnalysisSections(
            known = listOf(
                AnalysisSection(
                    text = "报告提到 L5/S1 椎间盘突出、硬膜囊受压；腰痛约 1 个月，最近加重",
                    source = "报告",
                ),
            ),
            unknown = listOf(
                AnalysisSection(text = "症状开始日期、是否腿部无力、侧别是否一致"),
            ),
            next = listOf(
                AnalysisSection(text = "把 4 个问题带去复诊；记录能坐时长与夜间痛醒"),
            ),
            videos = analysis.sections.videos,
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

    /** A08 原文对照用的报告原文（多行，与设计稿一致） */
    val reportRawText = "检查所见：腰椎生理曲度存在，各椎体形态、信号未见明显异常。\nL4/5椎间盘轻度膨出。\nL5/S1椎间盘向后突出，相应硬膜囊受压，右侧神经根受压可能。\n椎管未见明显狭窄。\n印象：L5/S1椎间盘突出；L4/5椎间盘膨出。"

    val report = Report(
        id = "rp-1",
        careEventId = "ev-1",
        reportDate = "2026-08-30",
        rawText = reportRawText,
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
