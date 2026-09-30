import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { SafetyService } from '../safety/safety.service';

/** 分析编排：安全校验、任务入队、结果查询与回退（Worker 见 src/worker/worker.ts） */
@Injectable()
export class AnalysesService {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly safety: SafetyService,
  ) {}

  /** 提交分析：先调安全规则引擎，再创建排队任务，返回 202 与任务 ID（附安全提示） */
  enqueue(
    userId: string,
    episodeId: string,
    context: Record<string, unknown>,
    safetyText?: string,
  ) {
    const episode = this.appDb
      .prepare('SELECT id FROM EPISODE WHERE id = ? AND user_id = ?')
      .get(episodeId, userId) as { id: string } | undefined;
    if (!episode) {
      throw new NotFoundException('病程不存在');
    }
    // 安全规则引擎：红旗与服务范围校验
    const safetyResult = safetyText
      ? this.safety.checkAndRecord(userId, 'analysis-submit', safetyText)
      : { rulesetVersion: 'RF-v1', redFlags: [], outOfScope: [], passed: true, safetyTips: [] };

    // 命中红旗或越界：不创建分析任务，停止个性化分析
    if (!safetyResult.passed) {
      return {
        taskId: null,
        status: 'blocked',
        safety: {
          passed: false,
          rulesetVersion: safetyResult.rulesetVersion,
          redFlags: safetyResult.redFlags,
          outOfScope: safetyResult.outOfScope,
          safetyTips: safetyResult.safetyTips,
        },
      };
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.appDb
      .prepare(
        `INSERT INTO ANALYSIS_TASK (id, episode_id, status, payload, attempts, created_at, updated_at)
         VALUES (?, ?, '排队', ?, 0, ?, ?)`,
      )
      .run(id, episodeId, JSON.stringify({ context }), now, now);
    return {
      taskId: id,
      status: '排队',
      safety: {
        passed: true,
        rulesetVersion: safetyResult.rulesetVersion,
        redFlags: [],
        outOfScope: [],
        safetyTips: [],
      },
    };
  }

  /** 查询分析：完成时返回五段结果与引用；排队/处理中返回状态；失败返回回退状态 */
  getAnalysis(userId: string, id: string) {
    const task = this.appDb
      .prepare(
        `SELECT id, episode_id AS episodeId, status, error, attempts, created_at AS createdAt, updated_at AS updatedAt
         FROM ANALYSIS_TASK WHERE id = ?`,
      )
      .get(id) as
      | {
          id: string;
          episodeId: string;
          status: string;
          error: string | null;
          attempts: number;
          createdAt: string;
          updatedAt: string;
        }
      | undefined;
    if (!task) throw new NotFoundException('任务不存在');
    const episode = this.appDb
      .prepare('SELECT user_id AS userId FROM EPISODE WHERE id = ?')
      .get(task.episodeId) as { userId: string } | undefined;
    if (!episode || episode.userId !== userId) {
      throw new NotFoundException('任务不存在');
    }

    if (task.status === '完成') {
      const analysis = this.appDb
        .prepare(
          `SELECT id, episode_id AS episodeId, version, model_release_id AS modelReleaseId,
                  sections, retrieval_snapshot AS retrievalSnapshot, safety_flag AS safetyFlag, created_at AS createdAt
           FROM ANALYSIS WHERE id = ?`,
        )
        .get(id) as
        | {
            id: string;
            episodeId: string;
            version: number;
            modelReleaseId: string;
            sections: string;
            retrievalSnapshot: string;
            safetyFlag: string;
            createdAt: string;
          }
        | undefined;
      if (!analysis) throw new NotFoundException('分析结果不存在');
      const citations = this.appDb
        .prepare(
          `SELECT id, evidence_doc_id AS evidenceDocId, statement, supported FROM ANALYSIS_CITATION WHERE analysis_id = ?`,
        )
        .all(id) as Array<{ id: string; evidenceDocId: string; statement: string; supported: number }>;
      return {
        taskId: task.id,
        status: '完成',
        analysis: {
          id: analysis.id,
          episodeId: analysis.episodeId,
          version: analysis.version,
          modelReleaseId: analysis.modelReleaseId,
          sections: JSON.parse(analysis.sections),
          retrievalSnapshot: JSON.parse(analysis.retrievalSnapshot),
          safetyFlag: analysis.safetyFlag,
          createdAt: analysis.createdAt,
          citations,
        },
      };
    }

    if (task.status === '失败') {
      return {
        taskId: task.id,
        status: '失败',
        fallback: true,
        reason: task.error || '分析生成失败',
        notice: '分析服务暂时不可用。你仍然可以查看已审核资料与复诊摘要。',
        available: ['已审核资料', '复诊摘要'],
        attempts: task.attempts,
      };
    }

    return {
      taskId: task.id,
      status: task.status,
      attempts: task.attempts,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /** 病程的最新分析 */
  getLatestByEpisode(userId: string, episodeId: string) {
    const episode = this.appDb
      .prepare('SELECT id FROM EPISODE WHERE id = ? AND user_id = ?')
      .get(episodeId, userId) as { id: string } | undefined;
    if (!episode) throw new NotFoundException('病程不存在');
    const analysis = this.appDb
      .prepare(
        `SELECT id, episode_id AS episodeId, version, model_release_id AS modelReleaseId,
                sections, retrieval_snapshot AS retrievalSnapshot, safety_flag AS safetyFlag, created_at AS createdAt
         FROM ANALYSIS WHERE episode_id = ? ORDER BY version DESC LIMIT 1`,
      )
      .get(episodeId) as
      | {
          id: string;
          episodeId: string;
          version: number;
          modelReleaseId: string;
          sections: string;
          retrievalSnapshot: string;
          safetyFlag: string;
          createdAt: string;
        }
      | undefined;
    if (!analysis) return null;
    const citations = this.appDb
      .prepare(
        `SELECT id, evidence_doc_id AS evidenceDocId, statement, supported FROM ANALYSIS_CITATION WHERE analysis_id = ?`,
      )
      .all(analysis.id) as Array<{ id: string; evidenceDocId: string; statement: string; supported: number }>;
    return {
      id: analysis.id,
      episodeId: analysis.episodeId,
      version: analysis.version,
      modelReleaseId: analysis.modelReleaseId,
      sections: JSON.parse(analysis.sections),
      retrievalSnapshot: JSON.parse(analysis.retrievalSnapshot),
      safetyFlag: analysis.safetyFlag,
      createdAt: analysis.createdAt,
      citations,
    };
  }

  /** 回退结果：明确说明原因，不无限重试 */
  fallback(reason: string) {
    return {
      fallback: true,
      reason,
      notice: '个性化分析暂时不可用。你仍然可以查看已审核资料与复诊摘要。',
      available: ['已审核资料', '复诊摘要'],
    };
  }
}
