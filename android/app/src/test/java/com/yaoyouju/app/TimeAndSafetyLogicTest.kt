package com.yaoyouju.app

import com.yaoyouju.app.core.components.LocalSafetyTips
import com.yaoyouju.app.core.util.BeijingTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** 时间与安全兜底逻辑的回归测试（对应验收反馈的日期与离线提示问题）。 */
class TimeAndSafetyLogicTest {

    @Test
    fun followupDateUsesAdviceDateNotToday() {
        // 医嘱日期 2026-09-10 + 4 周 = 2026-10-08，而不是“今天 + 4 周”
        assertEquals("2026-10-08", BeijingTime.plusDaysFrom("2026-09-10T00:00:00Z", 28))
    }

    @Test
    fun followupDateAcceptsDateOnly() {
        assertEquals("2026-10-08", BeijingTime.plusDaysFrom("2026-09-10", 28))
    }

    @Test
    fun localSafetyTipsAlwaysHaveRedFlags() {
        val tips = LocalSafetyTips.tips()
        assertTrue(tips.redFlags.size >= 7)
        assertTrue(tips.redFlags.any { it.contains("大小便") })
        assertTrue(tips.note.isNotBlank())
    }
}
