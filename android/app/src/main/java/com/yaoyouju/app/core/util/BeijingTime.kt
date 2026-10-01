package com.yaoyouju.app.core.util

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * 时间一律用 UTC ISO8601 存储和传输，界面按北京时间（Asia/Shanghai）显示。
 */
object BeijingTime {
    private val zone: ZoneId = ZoneId.of("Asia/Shanghai")
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    private val dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")

    /** 当前北京时间 ISO8601（带偏移，用于提交接口） */
    fun nowIso(): String = Instant.now().atZone(zone).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)

    /** 当前北京日期 yyyy-MM-dd */
    fun today(): String = LocalDate.now(zone).format(dateFormatter)

    /** ISO 时间转北京日期 yyyy-MM-dd */
    fun date(iso: String?): String {
        if (iso.isNullOrBlank()) return ""
        return runCatching {
            Instant.parse(normalize(iso)).atZone(zone).toLocalDate().format(dateFormatter)
        }.getOrElse { iso.take(10) }
    }

    /** ISO 时间转北京日期时间 yyyy-MM-dd HH:mm */
    fun dateTime(iso: String?): String {
        if (iso.isNullOrBlank()) return ""
        return runCatching {
            Instant.parse(normalize(iso)).atZone(zone).format(dateTimeFormatter)
        }.getOrElse { iso.take(16).replace('T', ' ') }
    }

    /** 相对天数描述：今天 / 昨天 / N 天前 */
    fun relativeDay(iso: String?): String {
        if (iso.isNullOrBlank()) return ""
        val target = runCatching { Instant.parse(normalize(iso)).atZone(zone).toLocalDate() }.getOrNull() ?: return ""
        val days = java.time.temporal.ChronoUnit.DAYS.between(target, LocalDate.now(zone))
        return when {
            days == 0L -> "今天"
            days == 1L -> "昨天"
            days > 1 -> "$days 天前"
            else -> date(iso)
        }
    }

    /** 距离目标日期还有几天（可为负） */
    fun daysUntil(dateStr: String): Long {
        val target = runCatching { LocalDate.parse(dateStr, dateFormatter) }.getOrNull() ?: return 0
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(zone), target)
    }

    /** 目标日期加 N 天 */
    fun plusDays(days: Long): String = LocalDate.now(zone).plusDays(days).format(dateFormatter)

    /** 以某个时间为基准加 N 天，返回 yyyy-MM-dd（用于按医嘱日期推算复诊日） */
    fun plusDaysFrom(iso: String, days: Long): String {
        val base = runCatching { Instant.parse(normalize(iso)).atZone(zone).toLocalDate() }
            .getOrElse { LocalDate.now(zone) }
        return base.plusDays(days).format(dateFormatter)
    }

    private fun normalize(iso: String): String {
        // 兼容 "2026-01-01" 与 "2026-01-01T00:00:00Z" 两种写法
        return if (iso.length == 10) "${iso}T00:00:00Z" else iso
    }
}
