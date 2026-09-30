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
import { ERR } from '../../common/utils/business-exception';

export interface VersionSnapshot {
  analysisVersion: number | null;
  modelVersion: string | null;
  contentVersion: string | null;
  rulesetVersion: string;
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
    this.assertOwnAnalysis(userId, input.analysisId);
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK (id, user_id, analysis_id, help_type, unsolved_question, is_error_report, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
      )
      .run(id, userId, input.analysisId, input.helpType, input.unsolvedQuestion ?? null, new Date().toISOString());
    return { id, isErrorReport: false };
  }

  /** 错误举报：自动附带分析、模型、内容、规则集四类版本，按严重度分级 */
  createErrorReport(userId: string, input: {
    analysisId: string;
    description: string;
    severity: '高' | '中' | '低';
    problemTypes?: string[];
    authorized?: boolean;
  }) {
    this.assertOwnAnalysis(userId, input.analysisId);
    const versions = this.getVersions(input.analysisId);
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK (id, user_id, analysis_id, help_type, unsolved_question, is_error_report, created_at)
         VALUES (?, ?, ?, '都不好', ?, 1, ?)`,
      )
      .run(id, userId, input.analysisId, input.description, new Date().toISOString());
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK_REPORT (feedback_id, severity, status, authorized, problem_types)
         VALUES (?, ?, '待处理', ?, ?)`,
      )
      .run(id, input.severity, input.authorized ? 1 : 0, input.problemTypes ? JSON.stringify(input.problemTypes) : null);
    this.audit.record({
      actorId: userId,
      action: 'feedback:report',
      target: id,
      diff: { severity: input.severity, versions },
    });
    return { id, isErrorReport: true, severity: input.severity, versions };
  }

  /** 用户端：只能看到自己的反馈 */
  listOwn(userId: string) {
    return this.appDb
      .prepare(
        `SELECT id, analysis_id AS analysisId, help_type AS helpType, unsolved_question AS unsolvedQuestion,
                is_error_report AS isErrorReport, created_at AS createdAt
         FROM FEEDBACK WHERE user_id = ? ORDER BY created_at DESC, rowid DESC`,
      )
      .all(userId);
  }

  /** 管理端：全部反馈（含严重度、处理状态与四类版本；未授权时原文脱敏） */
  list() {
    const rows = this.appDb
      .prepare(
        `SELECT f.id, f.user_id AS userId, f.analysis_id AS analysisId, f.help_type AS helpType,
                f.unsolved_question AS unsolvedQuestion, f.is_error_report AS isErrorReport, f.created_at AS createdAt,
                r.severity, r.status, r.resolution, r.authorized, r.problem_types AS problemTypes
         FROM FEEDBACK f LEFT JOIN FEEDBACK_REPORT r ON r.feedback_id = f.id
         ORDER BY f.created_at DESC, f.rowid DESC`,
      )
      .all() as Array<{
      id: string;
      userId: string;
      analysisId: string | null;
      helpType: string | null;
      unsolvedQuestion: string | null;
      isErrorReport: number;
      createdAt: string;
      severity: string | null;
      status: string | null;
      resolution: string | null;
      authorized: number | null;
      problemTypes: string | null;
    }>;
    // 附带四类版本（分析 / 模型 / 内容库 / 规则集）
    return rows.map((row) => {
      const versions = row.analysisId ? this.getVersions(row.analysisId) : null;
      return {
        ...row,
        analysisVersion: versions?.analysisVersion ?? null,
        modelVersion: versions?.modelVersion ?? null,
        contentVersion: versions?.contentVersion ?? null,
        rulesetVersion: versions?.rulesetVersion ?? null,
      };
    });
  }

  /** 管理端列表（按管理员是否已授权返回原文；未授权时脱敏） */
  listForAdmin(adminId: string, permissions: string[] = []) {
    const rows = this.list() as Array<{
      id: string;
      userId: string;
      analysisId: string | null;
      helpType: string | null;
      unsolvedQuestion: string | null;
      isErrorReport: number;
      createdAt: string;
      severity: string | null;
      status: string | null;
      resolution: string | null;
      authorized: number | null;
      problemTypes: string | null;
    }>;
    // 拥有 user:read:authorized 权限的角色（临床/超管）默认可看原文；其他角色需单条授权
    const canReadPlain = permissions.includes('user:read:authorized');
    return rows.map((row) => {
      const authorized = canReadPlain || this.isAuthorized(row.id, row.authorized, adminId);
      return {
        ...row,
        authorized,
        unsolvedQuestion: authorized ? row.unsolvedQuestion : '（已脱敏，需单条授权后查看原文）',
      };
    });
  }

  /**
   * 是否已授权查看该反馈原文（用户勾选或后台单条授权）。
   * 单条授权区分人：只有授权人本人（或授权未过期/未撤回）才能看原文。
   */
  isAuthorized(feedbackId: string, reportAuthorized: number | null, adminId?: string): boolean {
    if (reportAuthorized) return true;
    if (!adminId) return false;
    const row = this.appDb
      .prepare(
        `SELECT id, admin_id AS adminId, expires_at AS expiresAt, revoked_at AS revokedAt
         FROM ADMIN_AUTHORIZATION
         WHERE target_type = 'FEEDBACK' AND target_id = ? AND admin_id = ?
         ORDER BY created_at DESC, rowid DESC LIMIT 1`,
      )
      .get(feedbackId, adminId) as
      | { id: string; adminId: string; expiresAt: string | null; revokedAt: string | null }
      | undefined;
    if (!row) return false;
    if (row.revokedAt) return false;
    if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) return false;
    return true;
  }

  /** 详情（含四类版本）；用户只能看自己的 */
  detail(id: string, requesterUserId?: string): {
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
  } {
    const row = this.appDb
      .prepare(
        `SELECT id, user_id AS userId, analysis_id AS analysisId, help_type AS helpType,
                unsolved_question AS unsolvedQuestion, is_error_report AS isErrorReport, created_at AS createdAt
         FROM FEEDBACK WHERE id = ?`,
      )
      .get(id) as {
      id: string;
      userId: string;
      analysisId: string | null;
      helpType: string | null;
      unsolvedQuestion: string | null;
      isErrorReport: number;
      createdAt: string;
    } | undefined;
    if (!row) throw ERR.NOT_FOUND('反馈不存在');
    if (requesterUserId && row.userId !== requesterUserId) {
      throw ERR.FORBIDDEN('无权查看他人的反馈');
    }
    let versions: VersionSnapshot | null = null;
    if (row.analysisId) {
      versions = this.getVersions(row.analysisId);
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

  /** 单条授权查看用户原始内容（仅管理端）：写入授权表（默认 7 天有效）并记审计 */
  authorize(actorId: string, id: string) {
    const row = this.appDb
      .prepare('SELECT id, is_error_report AS isErrorReport FROM FEEDBACK WHERE id = ?')
      .get(id) as { id: string; isErrorReport: number } | undefined;
    if (!row) throw ERR.NOT_FOUND('反馈不存在');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    // 写入单条授权表（每次授权写审计，授权 7 天有效）
    this.appDb
      .prepare(
        `INSERT INTO ADMIN_AUTHORIZATION (id, admin_id, target_type, target_id, reason, created_at, expires_at)
         VALUES (?, ?, 'FEEDBACK', ?, '单条授权查看反馈原文', ?, ?)`,
      )
      .run(crypto.randomUUID(), actorId, id, now.toISOString(), expiresAt.toISOString());
    if (row.isErrorReport) {
      // 仅错误举报生成处理工单
      this.appDb
        .prepare(
          `INSERT INTO FEEDBACK_REPORT (feedback_id, severity, status, resolution, authorized)
           VALUES (?, '中', '已授权', NULL, 1)
           ON CONFLICT(feedback_id) DO UPDATE SET authorized = 1`,
        )
        .run(id);
    }
    this.audit.record({ actorId, action: 'feedback:authorize', target: id });
    return { id, authorized: true };
  }

  /** 处置动作与处理记录（仅管理端）；帮助类反馈不生成举报工单 */
  handle(actorId: string, id: string, input: { action: string; resolution: string }) {
    const row = this.appDb
      .prepare('SELECT id, is_error_report AS isErrorReport FROM FEEDBACK WHERE id = ?')
      .get(id) as { id: string; isErrorReport: number } | undefined;
    if (!row) throw ERR.NOT_FOUND('反馈不存在');
    // 帮助类反馈不生成举报工单，只记录处置
    if (!row.isErrorReport) {
      this.audit.record({ actorId, action: 'feedback:handle', target: id, diff: input });
      return { id, status: '已记录', resolution: input.resolution, isErrorReport: false };
    }
    // 只接受预定义的处置动作（任意动作名都返回 201 会被利用）
    const ALLOWED_ACTIONS = ['回复用户', '转临床复核', '下线相关内容', '修订解释模板', '加入评测集'];
    if (!ALLOWED_ACTIONS.includes(input.action)) {
      throw ERR.PARAM_INVALID(`不支持的处置动作：${input.action}`);
    }
    // 不同处置动作对应不同状态
    const statusMap: Record<string, string> = {
      '回复用户': '已处理',
      '转临床复核': '临床复核中',
      '下线相关内容': '已处理',
      '修订解释模板': '已处理',
      '加入评测集': '已处理',
    };
    const status = statusMap[input.action] ?? '已处理';
    // 下线相关内容：把该分析引用的已发布内容全部下线（应急隐藏）
    if (input.action === '下线相关内容') {
      const analysis = this.appDb
        .prepare('SELECT id, sections FROM ANALYSIS WHERE id = (SELECT analysis_id FROM FEEDBACK WHERE id = ?)')
        .get(id) as { id: string; sections: string } | undefined;
      if (analysis) {
        const sections = JSON.parse(analysis.sections) as { 视频?: Array<{ contentId: string }> };
        const contentIds = (sections.视频 ?? []).map((v) => v.contentId);
        for (const contentId of contentIds) {
          this.appDb
            .prepare("UPDATE CONTENT_ITEM SET offline_switch = 1 WHERE id = ? AND current_status = '已发布'")
            .run(contentId);
        }
      }
    }
    // 加入评测集：把举报内容作为去标识化用例加入“关键遗漏”评测集
    if (input.action === '加入评测集') {
      const description = this.appDb
        .prepare('SELECT unsolved_question AS q FROM FEEDBACK WHERE id = ?')
        .get(id) as { q: string | null } | undefined;
      const evalSet = this.appDb
        .prepare("SELECT id FROM EVAL_SET WHERE name = '关键遗漏'")
        .get() as { id: string } | undefined;
      if (evalSet && description?.q) {
        this.appDb
          .prepare(
            `INSERT INTO EVAL_CASE (id, eval_set_id, case_key, input, expected, actual, result, source, created_at)
             VALUES (?, ?, ?, ?, '按举报描述修正输出', NULL, '未运行', '举报', ?)`,
          )
          .run(crypto.randomUUID(), evalSet.id, `FB-${id.slice(0, 8)}`, description.q.slice(0, 200), new Date().toISOString());
        this.appDb
          .prepare('UPDATE EVAL_SET SET case_count = case_count + 1 WHERE id = ?')
          .run(evalSet.id);
      }
    }
    this.appDb
      .prepare(
        `INSERT INTO FEEDBACK_REPORT (feedback_id, severity, status, resolution, authorized)
         VALUES (?, '中', ?, ?, 0)
         ON CONFLICT(feedback_id) DO UPDATE SET status = excluded.status, resolution = excluded.resolution`,
      )
      .run(id, status, input.resolution);
    this.audit.record({ actorId, action: 'feedback:handle', target: id, diff: input });
    return { id, status, resolution: input.resolution, isErrorReport: true };
  }

  /** 撤回单条授权（仅授权人本人可撤回，撤回后不能再查看原文） */
  revokeAuthorization(actorId: string, id: string) {
    const row = this.appDb
      .prepare('SELECT id, admin_id AS adminId FROM ADMIN_AUTHORIZATION WHERE target_type = ? AND target_id = ? AND admin_id = ?')
      .get('FEEDBACK', id, actorId) as { id: string; adminId: string } | undefined;
    if (!row) throw ERR.NOT_FOUND('授权记录不存在');
    this.appDb
      .prepare('UPDATE ADMIN_AUTHORIZATION SET revoked_at = ? WHERE id = ?')
      .run(new Date().toISOString(), row.id);
    this.audit.record({ actorId, action: 'feedback:authorize-revoke', target: id });
    return { id, revoked: true };
  }

  /** 校验分析属于当前用户 */
  private assertOwnAnalysis(userId: string, analysisId: string) {
    const analysis = this.appDb
      .prepare(
        `SELECT a.id FROM ANALYSIS a JOIN EPISODE e ON e.id = a.episode_id
         WHERE a.id = ? AND e.user_id = ?`,
      )
      .get(analysisId, userId) as { id: string } | undefined;
    if (!analysis) {
      throw ERR.NOT_FOUND('分析不存在');
    }
  }

  private getVersions(analysisId: string): VersionSnapshot {
    const analysis = this.appDb
      .prepare('SELECT version, retrieval_snapshot AS retrievalSnapshot FROM ANALYSIS WHERE id = ?')
      .get(analysisId) as { version: number; retrievalSnapshot: string } | undefined;
    if (!analysis) {
      return { analysisVersion: null, modelVersion: null, contentVersion: null, rulesetVersion: RULESET_VERSION };
    }
    const snapshot = JSON.parse(analysis.retrievalSnapshot ?? '{}') as {
      modelRelease?: string;
      contentLibVersion?: string;
    };
    const model = this.appDb
      .prepare("SELECT model_name || '/' || prompt_version AS v FROM MODEL_RELEASE WHERE id = ?")
      .get(snapshot.modelRelease ?? 'release-1') as { v: string } | undefined;
    return {
      analysisVersion: analysis.version,
      modelVersion: model?.v ?? null,
      contentVersion: snapshot.contentLibVersion ?? null,
      rulesetVersion: RULESET_VERSION,
    };
  }
}
