package com.yaoyouju.app.nav

/** deep link 解析：yaoyouju://A07 → "A07"（仅接受 A01–A18 页面编号） */
object DeepLinks {
    private val PAGE_PATTERN = Regex("^A(0[1-9]|1[0-8])$")

    fun routeFrom(uri: String?): String? {
        if (uri.isNullOrBlank()) return null
        // 形如 yaoyouju://A07 或 yaoyouju://A07?x=1
        val host = uri.substringAfter("://", "").substringBefore("?").substringBefore("/")
        return host.takeIf { PAGE_PATTERN.matches(it) }
    }
}
