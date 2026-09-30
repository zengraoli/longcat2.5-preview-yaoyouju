import { Controller, Get, UseGuards } from '@nestjs/common';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { Inject } from '@nestjs/common';
import { AdminGuard, RequirePermission } from './admin.guard';
import { CurrentAdmin } from './current-admin.decorator';
import { AuditService } from '../audit/audit.service';
import { RULESET_VERSION } from '../safety/rules';

/** 后台仪表盘聚合数据（所有后台角色可读） */
@Controller('admin/dashboard')
@UseGuards(AdminGuard)
export class AdminDashboardController {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly audit: AuditService,
  ) {}

  @Get()
  stats(@CurrentAdmin() admin: { adminId: string }) {
    this.audit.record({ actorId: admin.adminId, action: 'admin:dashboard-view', target: 'dashboard' });
    // 北京时间当日区间：北京 00:00 = UTC 前一日 16:00
    const now = new Date();
    const bjNow = new Date(now.getTime() + 8 * 3600 * 1000);
    const today = bjNow.toISOString().slice(0, 10);
    // 返回北京时间 offsetDays 天对应的 UTC 区间起点（北京 00:00）
    const dayStart = (offsetDays = 0) => {
      const d = new Date(bjNow.getTime() + offsetDays * 86400 * 1000);
      return new Date(d.getTime() - 8 * 3600 * 1000).toISOString();
    };
    const todayStart = dayStart(0);
    const todayEnd = dayStart(1);
    const taskTotal = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK').get() as { c: number }).c;
    const taskToday = (
      this.appDb
        .prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE created_at >= ? AND created_at < ?')
        .get(todayStart, todayEnd) as { c: number }
    ).c;
    // 失败率（15 分钟）：最近 15 分钟内创建的任务
    const since15 = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const recentTotal = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE created_at >= ?').get(since15) as { c: number }).c;
    const taskFailed = (this.appDb.prepare("SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE status = '失败' AND created_at >= ?").get(since15) as { c: number }).c;
    // 阻断：今日被安全规则阻断的分析提交次数（红旗 + 越界，来源为 analysis-submit；
    // 问答中的越界提问不计入“分析阻断”）
    const taskBlocked = (
      this.appDb
        .prepare("SELECT COUNT(*) AS c FROM SAFETY_EVENT WHERE source = 'analysis-submit' AND created_at >= ? AND created_at < ?")
        .get(todayStart, todayEnd) as { c: number }
    ).c;
    const pendingReview = (this.appDb.prepare("SELECT COUNT(*) AS c FROM CONTENT_ITEM WHERE current_status = '待审'").get() as { c: number }).c;
    // 待处理举报（FEEDBACK_REPORT.status = '待处理'）
    const pendingReports = (this.appDb.prepare("SELECT COUNT(*) AS c FROM FEEDBACK_REPORT WHERE status = '待处理'").get() as { c: number }).c;
    const highReports = (this.appDb.prepare("SELECT COUNT(*) AS c FROM FEEDBACK_REPORT WHERE status = '待处理' AND severity = '高'").get() as { c: number }).c;
    const midReports = (this.appDb.prepare("SELECT COUNT(*) AS c FROM FEEDBACK_REPORT WHERE status = '待处理' AND severity = '中'").get() as { c: number }).c;
    const lowReports = (this.appDb.prepare("SELECT COUNT(*) AS c FROM FEEDBACK_REPORT WHERE status = '待处理' AND severity = '低'").get() as { c: number }).c;
    // 安全事件：仅 24 小时内
    const safetyEvents = this.appDb
      .prepare(
        `SELECT rule_code AS ruleCode, severity, action_taken AS actionTaken, source, created_at AS createdAt
         FROM SAFETY_EVENT WHERE created_at >= ? ORDER BY created_at DESC, rowid DESC LIMIT 20`,
      )
      .all(new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    // 最近 7 天每日任务量（按北京时间日期分组，含失败数）
    const dailyTasks: Array<{ date: string; count: number; failed: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const key = new Date(bjNow.getTime() - i * 86400 * 1000).toISOString().slice(0, 10);
      const start = dayStart(-i);
      const end = dayStart(-i + 1);
      const count = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE created_at >= ? AND created_at < ?').get(start, end) as { c: number }).c;
      const failed = (this.appDb.prepare("SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE status = '失败' AND created_at >= ? AND created_at < ?").get(start, end) as { c: number }).c;
      dailyTasks.push({ date: key, count, failed });
    }
    const switches = this.appDb
      .prepare('SELECT key, enabled, reason, updated_at AS updatedAt FROM FEATURE_SWITCH ORDER BY key')
      .all();
    const evalRuns = this.appDb
      .prepare(
        `SELECT r.id, r.model_release_id AS modelReleaseId, s.name AS evalSetName, r.result, r.created_at AS createdAt
         FROM EVAL_RUN r JOIN EVAL_SET s ON s.id = r.eval_set_id
         ORDER BY r.created_at DESC, r.rowid DESC LIMIT 10`,
      )
      .all();
    return {
      rulesetVersion: RULESET_VERSION,
      tasks: { total: taskTotal, today: taskToday, failed: taskFailed, blocked: taskBlocked },
      failureRate: {
        window: '15 分钟',
        total: recentTotal,
        failed: taskFailed,
        rate: recentTotal === 0 ? 0 : Math.round((taskFailed / recentTotal) * 1000) / 10,
      },
      dailyTasks,
      pendingReview,
      pendingReports: { total: pendingReports, high: highReports, mid: midReports, low: lowReports },
      safetyEvents,
      switches,
      evalRuns,
    };
  }
}
