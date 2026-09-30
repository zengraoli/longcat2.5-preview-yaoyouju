import { Controller, Get, UseGuards } from '@nestjs/common';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { Inject } from '@nestjs/common';
import { AdminGuard, RequirePermission } from './admin.guard';

/** 后台仪表盘聚合数据 */
@Controller('admin/dashboard')
@UseGuards(AdminGuard)
export class AdminDashboardController {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  @Get()
  @RequirePermission('*')
  stats() {
    // 今日任务（按创建日期统计）
    const today = new Date().toISOString().slice(0, 10);
    const taskTotal = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK').get() as { c: number }).c;
    const taskToday = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE created_at >= ?').get(today) as { c: number }).c;
    const taskFailed = (this.appDb.prepare("SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE status = '失败'").get() as { c: number }).c;
    const taskBlocked = (this.appDb.prepare("SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE status = '排队' AND payload LIKE '%redFlags%'").get() as { c: number }).c;
    const pendingReview = (this.appDb.prepare("SELECT COUNT(*) AS c FROM CONTENT_ITEM WHERE current_status = '待审'").get() as { c: number }).c;
    // 待处理举报（FEEDBACK_REPORT.status = '待处理'）
    const pendingReports = (this.appDb.prepare("SELECT COUNT(*) AS c FROM FEEDBACK_REPORT WHERE status = '待处理'").get() as { c: number }).c;
    const highReports = (this.appDb.prepare("SELECT COUNT(*) AS c FROM FEEDBACK_REPORT WHERE status = '待处理' AND severity = '高'").get() as { c: number }).c;
    const midReports = (this.appDb.prepare("SELECT COUNT(*) AS c FROM FEEDBACK_REPORT WHERE status = '待处理' AND severity = '中'").get() as { c: number }).c;
    const lowReports = (this.appDb.prepare("SELECT COUNT(*) AS c FROM FEEDBACK_REPORT WHERE status = '待处理' AND severity = '低'").get() as { c: number }).c;
    const safetyEvents = this.appDb
      .prepare(
        `SELECT rule_code AS ruleCode, severity, action_taken AS actionTaken, source, created_at AS createdAt
         FROM SAFETY_EVENT ORDER BY created_at DESC, rowid DESC LIMIT 20`,
      )
      .all();
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
      tasks: { total: taskTotal, today: taskToday, failed: taskFailed, blocked: taskBlocked },
      pendingReview,
      pendingReports: { total: pendingReports, high: highReports, mid: midReports, low: lowReports },
      safetyEvents,
      switches,
      evalRuns,
    };
  }
}
