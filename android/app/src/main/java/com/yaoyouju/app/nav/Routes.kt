package com.yaoyouju.app.nav

/** 页面路由（对应设计稿编号 A01–A18，deep link 用） */
object Routes {
    const val LOGIN = "A01"
    const val CHANGE = "A02"      // 当前关键变化确认
    const val REDFLAG = "A03"     // 就医提示
    const val CONFUSION = "A04"   // 选择主要困惑
    const val REPORT = "A05"      // 录入报告与医嘱
    const val VERIFY = "A06"      // 核对整理后的信息
    const val ANALYSIS = "A07"    // 一页分析
    const val COMPARISON = "A08"  // 原文对照
    const val QA = "A09"          // 问与解释
    const val TIMELINE = "A10"    // 病程
    const val TODAY = "A11"       // 记录今天
    const val FOLLOWUP = "A12"    // 复诊准备
    const val CONTENT = "A13"     // 审核内容库
    const val MINE = "A17"        // 我的
    const val FEEDBACK = "A16"    // 反馈与举报
    const val VIDEO = "A15"       // 视频详情
    const val FALLBACK = "A18"    // 服务不可用回退
    const val HOME = "A14"        // 首页 · 当前情况（主 Tab）
}
