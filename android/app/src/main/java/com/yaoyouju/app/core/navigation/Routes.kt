package com.yaoyouju.app.core.navigation

/**
 * 路由与设计稿编号的对应关系（A01–A18）。
 * deep link `yaoyouju-app://A07` 会打开对应页面。
 */
object Routes {
    const val Login = "A01"
    const val Confirm = "A02"
    const val RedFlag = "A03"
    const val Confusion = "A04"
    const val Report = "A05"
    const val Verify = "A06"
    const val Analysis = "A07"
    const val ReportCompare = "A08"
    const val Qa = "A09"
    const val Timeline = "A10"
    const val Record = "A11"
    const val Summary = "A12"
    const val Contents = "A13"
    const val Home = "A14"
    const val ContentDetail = "A15"
    const val Feedback = "A16"
    const val Mine = "A17"
    const val Fallback = "A18"

    /** 带参数路由 */
    const val AnalysisArg = "analysisId"
    const val ContentArg = "contentId"
    const val EpisodeArg = "episodeId"

    fun analysis(id: String) = "$Analysis?$AnalysisArg=$id"
    fun content(id: String) = "$ContentDetail?$ContentArg=$id"

    /** deep link 的 host 部分（如 yaoyouju-app://A07）映射到路由 */
    fun fromDeepLink(host: String?): String? {
        val code = host?.trim()?.uppercase() ?: return null
        return when (code) {
            "A01" -> Login
            "A02" -> Confirm
            "A03" -> RedFlag
            "A04" -> Confusion
            "A05" -> Report
            "A06" -> Verify
            "A07" -> Analysis
            "A08" -> ReportCompare
            "A09" -> Qa
            "A10" -> Timeline
            "A11" -> Record
            "A12" -> Summary
            "A13" -> Contents
            "A14" -> Home
            "A15" -> ContentDetail
            "A16" -> Feedback
            "A17" -> Mine
            "A18" -> Fallback
            else -> null
        }
    }
}

/** deep link 请求：序号用于触发重复导航（同一页面再次打开也能生效） */
data class DeepLinkRequest(val seq: Int, val route: String)
