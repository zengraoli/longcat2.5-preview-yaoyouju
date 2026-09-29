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
    const taskCount = (this.appDb.prepare('SELECT COUNT(*) AS c FROM ANALYSIS_TASK').get() as { c: number }).c;
    const failedCount = (this.appDb.prepare("SELECT COUNT(*) AS c FROM ANALYSIS_TASK WHERE status = '失败'").get() as { c: number }).c;
    const pendingReview = (this.appDb.prepare("SELECT COUNT(*) AS c FROM CONTENT_ITEM WHERE current_status = '待审'").get() as { c: number }).c;
    const pendingReports = (this.appDb.prepare('SELECT COUNT(*) AS c FROM FEEDBACK WHERE is_error_report = 1').get() as { c: number }).c;
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
      tasks: { total: taskCount, failed: failedCount },
      pendingReview,
      pendingReports,
      safetyEvents,
      switches,
      evalRuns,
    };
  }
}
