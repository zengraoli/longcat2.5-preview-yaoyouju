package com.yaoyouju.app

import com.yaoyouju.app.core.navigation.Routes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** deep link `yaoyouju://A01`–`A18` 必须映射到对应页面。 */
class RoutesTest {

    @Test
    fun deepLinkMapsAllPages() {
        val expected = mapOf(
            "A01" to Routes.Login,
            "A02" to Routes.Confirm,
            "A03" to Routes.RedFlag,
            "A04" to Routes.Confusion,
            "A05" to Routes.Report,
            "A06" to Routes.Verify,
            "A07" to Routes.Analysis,
            "A08" to Routes.ReportCompare,
            "A09" to Routes.Qa,
            "A10" to Routes.Timeline,
            "A11" to Routes.Record,
            "A12" to Routes.Summary,
            "A13" to Routes.Contents,
            "A14" to Routes.Home,
            "A15" to Routes.ContentDetail,
            "A16" to Routes.Feedback,
            "A17" to Routes.Mine,
            "A18" to Routes.Fallback,
        )
        expected.forEach { (code, route) ->
            assertEquals(route, Routes.fromDeepLink(code))
        }
    }

    @Test
    fun deepLinkIsCaseInsensitive() {
        assertEquals(Routes.Analysis, Routes.fromDeepLink("a07"))
    }

    @Test
    fun unknownDeepLinkReturnsNull() {
        assertNull(Routes.fromDeepLink("A99"))
        assertNull(Routes.fromDeepLink(null))
        assertNull(Routes.fromDeepLink(""))
    }

    @Test
    fun routeWithArgsIsBuilt() {
        assertEquals("A07?analysisId=abc", Routes.analysis("abc"))
        assertEquals("A15?contentId=c1", Routes.content("c1"))
    }
}
