import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';
import { RULESET_VERSION } from '../safety/rules';

export interface VersionSnapshot {
  analysisVersion: number | null;
  modelVersion: string | null;
  contentVersion: string | null;
  rulesetVersion: string;
}

export interface FeedbackView {
  id: string;
  analysisId: string | null;
  helpType: string | null;
  unsolvedQuestion: string | null;
  isErrorReport: boolean;
  severity: string | null;
  description: string | null;
  versions: VersionSnapshot | null;
  status: string;
  resolution: string | null;
  authorized: boolean;
  createdAt: string;
}

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly audit: AuditService,
  ) {}

  /** 帮助类型反馈（看懂了 / 知道下一步 / 都不好 + 未解决的问题） */
  createHelpFeedback(userId: string, input: {
    analysisId: string;
    helpType: '看懂了' | '知道下一步' | '都不好';
    unsolvedQuestion?: string;
  }) {
    const analysis = this.appDb
      .prepare('SELECT id FROM ANALYSIS WHERE id = ?')
      .get(input.analysisId) as { id: string } | undefined;
    if (!analysis) throw new NotFoundException('分析不存在');
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK (id, analysis_id, help_type, unsolved_question, is_error_report, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`,
      )
      .run(id, input.analysisId, input.helpType, input.unsolvedQuestion ?? null, new Date().toISOString());
    return { id, isErrorReport: false };
  }

  /** 错误举报：自动附带分析、模型、内容、规则集四类版本，按严重度分级 */
  createErrorReport(userId: string, input: {
    analysisId: string;
    description: string;
    severity: '高' | '中' | '低';
  }) {
    const analysis = this.appDb
      .prepare('SELECT id, version, retrieval_snapshot AS retrievalSnapshot FROM ANALYSIS WHERE id = ?')
      .get(input.analysisId) as { id: string; version: number; retrievalSnapshot: string } | undefined;
    if (!analysis) throw new NotFoundException('分析不存在');
    const snapshot = JSON.parse(analysis.retrievalSnapshot ?? '{}') as {
      modelRelease?: string;
      contentLibVersion?: string;
    };
    const model = this.appDb
      .prepare("SELECT model_name || '/' || prompt_version AS v FROM MODEL_RELEASE WHERE id = ?")
      .get(snapshot.modelRelease ?? 'release-1') as { v: string } | undefined;
    const versions: VersionSnapshot = {
      analysisVersion: analysis.version,
      modelVersion: model?.v ?? null,
      contentVersion: snapshot.contentLibVersion ?? null,
      rulesetVersion: RULESET_VERSION,
    };
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK (id, analysis_id, help_type, unsolved_question, is_error_report, created_at)
         VALUES (?, ?, '都不好', ?, 1, ?)`,
      )
      .run(id, input.analysisId, input.description, new Date().toISOString());
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK_REPORT (feedback_id, severity, status) VALUES (?, ?, '待处理')`,
      )
      .run(id, input.severity);
    this.audit.record({
      actorId: userId,
      action: 'feedback:report',
      target: id,
      diff: { severity: input.severity, versions },
    });
    return { id, isErrorReport: true, severity: input.severity, versions };
  }

  /** 反馈列表（管理端） */
  list() {
    return this.appDb
      .prepare(
        `SELECT id, analysis_id AS analysisId, help_type AS helpType, unsolved_question AS unsolvedQuestion,
                is_error_report AS isErrorReport, created_at AS createdAt
         FROM FEEDBACK ORDER BY created_at DESC, rowid DESC`,
      )
      .all();
  }

  /** 详情（含四类版本） */
  detail(id: string): FeedbackView {
    const row = this.appDb
      .prepare(
        `SELECT id, analysis_id AS analysisId, help_type AS helpType, unsolved_question AS unsolvedQuestion,
                is_error_report AS isErrorReport, created_at AS createdAt
         FROM FEEDBACK WHERE id = ?`,
      )
      .get(id) as {
      id: string;
      analysisId: string | null;
      helpType: string | null;
      unsolvedQuestion: string | null;
      isErrorReport: number;
      createdAt: string;
    } | undefined;
    if (!row) throw new NotFoundException('反馈不存在');
    let versions: VersionSnapshot | null = null;
    if (row.analysisId) {
      const analysis = this.appDb
        .prepare('SELECT version, retrieval_snapshot AS retrievalSnapshot FROM ANALYSIS WHERE id = ?')
        .get(row.analysisId) as { version: number; retrievalSnapshot: string } | undefined;
      if (analysis) {
        const snapshot = JSON.parse(analysis.retrievalSnapshot ?? '{}') as {
          modelRelease?: string;
          contentLibVersion?: string;
        };
        const model = this.appDb
          .prepare("SELECT model_name || '/' || prompt_version AS v FROM MODEL_RELEASE WHERE id = ?")
          .get(snapshot.modelRelease ?? 'release-1') as { v: string } | undefined;
        versions = {
          analysisVersion: analysis.version,
          modelVersion: model?.v ?? null,
          contentVersion: snapshot.contentLibVersion ?? null,
          rulesetVersion: RULESET_VERSION,
        };
      }
    }
    const report = this.appDb
      .prepare(
        `SELECT severity, status, resolution, authorized FROM FEEDBACK_REPORT WHERE feedback_id = ?`,
      )
      .get(id) as { severity: string; status: string; resolution: string | null; authorized: number } | undefined;
    return {
      id: row.id,
      analysisId: row.analysisId,
      helpType: row.helpType,
      unsolvedQuestion: row.unsolvedQuestion,
      isErrorReport: !!row.isErrorReport,
      severity: report?.severity ?? null,
      description: row.unsolvedQuestion,
      versions,
      status: report?.status ?? '待处理',
      resolution: report?.resolution ?? null,
      authorized: !!report?.authorized,
      createdAt: row.createdAt,
    };
  }

  /** 单条授权查看用户原始内容 */
  authorize(actorId: string, id: string) {
    const row = this.appDb.prepare('SELECT id FROM FEEDBACK WHERE id = ?').get(id) as
      | { id: string }
      | undefined;
    if (!row) throw new NotFoundException('反馈不存在');
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK_REPORT (feedback_id, severity, status, resolution, authorized)
         VALUES (?, '中', '已授权', NULL, 1)
         ON CONFLICT(feedback_id) DO UPDATE SET authorized = 1`,
      )
      .run(id);
    this.audit.record({ actorId, action: 'feedback:authorize', target: id });
    return { id, authorized: true };
  }

  /** 处置动作与处理记录 */
  handle(actorId: string, id: string, input: { action: string; resolution: string }) {
    const row = this.appDb.prepare('SELECT id FROM FEEDBACK WHERE id = ?').get(id) as
      | { id: string }
      | undefined;
    if (!row) throw new NotFoundException('反馈不存在');
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK_REPORT (feedback_id, severity, status, resolution, authorized)
         VALUES (?, '中', '已处理', ?, 0)
         ON CONFLICT(feedback_id) DO UPDATE SET status = '已处理', resolution = excluded.resolution`,
      )
      .run(id, input.resolution);
    this.audit.record({ actorId, action: 'feedback:handle', target: id, diff: input });
    return { id, status: '已处理', resolution: input.resolution };
  }
}
