package com.yaoyouju.app

import com.yaoyouju.app.core.components.TagTone
import com.yaoyouju.app.core.components.tagToneOf
import com.yaoyouju.app.core.util.BeijingTime
import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

/** 设计令牌与时间显示约定。 */
class DesignTokensTest {

    @Test
    fun tagToneFollowsSemantics() {
        assertEquals(TagTone.Ok, tagToneOf("已确认"))
        assertEquals(TagTone.Ok, tagToneOf("已审核 v2"))
        assertEquals(TagTone.Warn, tagToneOf("尚未确认"))
        assertEquals(TagTone.Warn, tagToneOf("未经核实"))
        assertEquals(TagTone.Error, tagToneOf("有冲突"))
        assertEquals(TagTone.Error, tagToneOf("已下线 · 更正中"))
        assertEquals(TagTone.Info, tagToneOf("报告原文"))
        assertEquals(TagTone.Info, tagToneOf("系统生成"))
        assertEquals(TagTone.Neutral, tagToneOf("自述"))
    }

    @Test
    fun utcTimeIsDisplayedInBeijing() {
        // 2026-01-01T00:30:00Z 北京时间是 2026-01-01 08:30
        assertEquals("2026-01-01", BeijingTime.date("2026-01-01T00:30:00Z"))
        assertEquals("2026-01-01 08:30", BeijingTime.dateTime("2026-01-01T00:30:00Z"))
        // 2025-12-31T20:00:00Z 北京时间已跨年
        assertEquals("2026-01-01", BeijingTime.date("2025-12-31T20:00:00Z"))
    }

    @Test
    fun relativeDayDescribesRecentDays() {
        val nowBeijing = Instant.now().atZone(ZoneId.of("Asia/Shanghai"))
        val todayIso = nowBeijing.toInstant().toString()
        assertEquals("今天", BeijingTime.relativeDay(todayIso))
        val yesterdayIso = nowBeijing.minusDays(1).toInstant().toString()
        assertEquals("昨天", BeijingTime.relativeDay(yesterdayIso))
    }
}
