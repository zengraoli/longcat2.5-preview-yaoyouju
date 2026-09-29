import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';

/** 分析编排：任务入队与回退（完整流水线见 T07） */
@Injectable()
export class AnalysesService {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  /** 创建排队任务，返回 202 与任务 ID */
  enqueue(userId: string, episodeId: string, context: Record<string, unknown>) {
    const task = this.appDb
      .prepare('SELECT id FROM EPISODE WHERE id = ? AND user_id = ?')
      .get(episodeId, userId) as { id: string } | undefined;
    if (!task) {
      throw new NotFoundException('病程不存在');
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.appDb
      .prepare(
        `INSERT INTO ANALYSIS_TASK (id, episode_id, status, payload, attempts, created_at, updated_at)
         VALUES (?, ?, '排队', ?, 0, ?, ?)`,
      )
      .run(id, episodeId, JSON.stringify({ context }), now, now);
    return { taskId: id, status: '排队' };
  }

  getTask(id: string) {
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
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
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
