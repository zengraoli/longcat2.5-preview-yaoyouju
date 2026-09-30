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
    // 安全规则引擎：红旗与服务范围校验（提交文字 + 病程中用户自述的事件原文；
    // 医嘱等医生记录中的红旗关键词是条件性建议，不作为用户症状）
    const episodeEvents = this.appDb
      .prepare("SELECT raw_text AS rawText FROM CARE_EVENT WHERE episode_id = ? AND raw_text IS NOT NULL AND source_type = '自述'")
      .all(episodeId) as Array<{ rawText: string }>;
    const combinedText = [safetyText ?? '', ...episodeEvents.map((e) => e.rawText)].join('\n');
    const safetyResult = this.safety.checkAndRecord(userId, 'analysis-submit', combinedText);

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

  /** 引用列表（带证据文档标题，供前端显示来源） */
  private getCitations(analysisId: string) {
    return this.appDb
      .prepare(
        `SELECT c.id, c.evidence_doc_id AS evidenceDocId, d.title AS evidenceDocTitle,
                c.statement, c.supported
         FROM ANALYSIS_CITATION c LEFT JOIN EVIDENCE_DOC d ON d.id = c.evidence_doc_id
         WHERE c.analysis_id = ?`,
      )
      .all(analysisId) as Array<{
        id: string;
        evidenceDocId: string;
        evidenceDocTitle: string | null;
        statement: string;
        supported: number;
      }>;
  }

  /** 过滤分析中已下线的内容推荐（已下线内容不再对用户可见） */
  private filterOfflineVideos<T>(analysis: T): T {
    const videos = (analysis as { 视频?: Array<{ contentId: string }> }).视频;
    if (!videos || videos.length === 0) return analysis;
    const placeholders = videos.map(() => '?').join(',');
    const offline = this.appDb
      .prepare(
        `SELECT id FROM CONTENT_ITEM WHERE id IN (${placeholders}) AND (current_status != '已发布' OR offline_switch = 1)`,
      )
      .all(...videos.map((v) => v.contentId)) as Array<{ id: string }>;
    const offlineIds = new Set(offline.map((r) => r.id));
    return { ...analysis, 视频: videos.filter((v) => !offlineIds.has(v.contentId)) } as T;
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
      const citations = this.getCitations(id);
      return {
        taskId: task.id,
        status: '完成',
        analysis: this.filterOfflineVideos({
          id: analysis.id,
          episodeId: analysis.episodeId,
          version: analysis.version,
          modelReleaseId: analysis.modelReleaseId,
          sections: JSON.parse(analysis.sections),
          retrievalSnapshot: JSON.parse(analysis.retrievalSnapshot),
          safetyFlag: analysis.safetyFlag,
          createdAt: analysis.createdAt,
          citations,
        }),
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
    const citations = this.getCitations(analysis.id);
    return this.filterOfflineVideos({
      id: analysis.id,
      episodeId: analysis.episodeId,
      version: analysis.version,
      modelReleaseId: analysis.modelReleaseId,
      sections: JSON.parse(analysis.sections),
      retrievalSnapshot: JSON.parse(analysis.retrievalSnapshot),
      safetyFlag: analysis.safetyFlag,
      createdAt: analysis.createdAt,
      citations,
    });
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
