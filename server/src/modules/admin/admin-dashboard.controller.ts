import { Controller, Get, UseGuards } from '@nestjs/common';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { Inject } from '@nestjs/common';
import { AdminGuard, RequirePermission } from './admin.guard';
import { CurrentAdmin } from './current-admin.decorator';
import { AuditService } from '../audit/audit.service';

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
    // 今日任务（按创建日期统计，北京时间）
    const now = new Date();
    const today = new Date(now.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
    const taskTotal = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK').get() as { c: number }).c;
    const taskToday = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE created_at >= ?').get(today) as { c: number }).c;
    // 失败率（15 分钟）：最近 15 分钟内创建的任务
    const since15 = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const recentTotal = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE created_at >= ?').get(since15) as { c: number }).c;
    const taskFailed = (this.appDb.prepare("SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE status = '失败' AND created_at >= ?").get(since15) as { c: number }).c;
    // 阻断：今日被安全规则引擎停止个性化的提交次数（按安全事件计）
    const taskBlocked = (this.appDb.prepare("SELECT COUNT(*) AS c FROM SAFETY_EVENT WHERE action_taken = '停止个性化分析' AND created_at >= ?").get(today) as { c: number }).c;
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
    // 最近 7 天每日任务量（真实数据）
    const dailyTasks: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() + 8 * 3600 * 1000);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE created_at >= ? AND created_at < ?').get(key, key + 'T23:59:59.999Z') as { c: number }).c;
      dailyTasks.push({ date: key, count });
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
