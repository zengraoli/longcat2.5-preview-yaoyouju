import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';
import { ContentAction, ContentStatus, transition } from './state-machine';

export interface ContentItemView {
  id: string;
  type: string;
  title: string;
  applicableScope: string | null;
  notApplicable: string | null;
  currentStatus: string;
  offlineSwitch: boolean;
  version: number | null;
  reviewer: string | null;
  reason: string | null;
}

@Injectable()
export class ContentsService {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly audit: AuditService,
  ) {}

  /** 创建内容（草稿） */
  createItem(actorId: string, input: {
    type: string;
    title: string;
    applicableScope?: string;
    notApplicable?: string;
    script?: string;
    subtitleText?: string;
    basis?: string;
  }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.appDb
      .prepare(
        `INSERT INTO CONTENT_ITEM (id, type, title, applicable_scope, not_applicable, current_status, offline_switch)
         VALUES (?, ?, ?, ?, ?, '草稿', 0)`,
      )
      .run(id, input.type, input.title, input.applicableScope ?? null, input.notApplicable ?? null);
    if (input.script) {
      this.appDb
        .prepare(
          `INSERT INTO CONTENT_VERSION (id, item_id, version, script, asset_key, subtitle_text, model_asset_version, published_at)
           VALUES (?, ?, 1, ?, ?, ?, ?, NULL)`,
        )
        .run(crypto.randomUUID(), id, input.script, `assets/${id}.mp4`, input.subtitleText ?? null, 'asset-v1');
    }
    this.audit.record({ actorId, action: 'content:create', target: id, diff: { title: input.title } });
    return { id, currentStatus: '草稿' };
  }

  /** 状态机流转（非法流转返回错误） */
  transitionItem(
    actorId: string,
    itemId: string,
    action: ContentAction,
    comment?: string,
  ): ContentItemView {
    const item = this.appDb
      .prepare('SELECT * FROM CONTENT_ITEM WHERE id = ?')
      .get(itemId) as {
      id: string;
      type: string;
      title: string;
      applicable_scope: string | null;
      not_applicable: string | null;
      current_status: ContentStatus;
      offline_switch: number;
    } | undefined;
    if (!item) throw new NotFoundException('内容不存在');
    const next = transition(item.current_status, action);
    if (!next) {
      throw new ConflictException(`非法状态流转：${item.current_status} 不能执行「${action}」`);
    }
    const now = new Date().toISOString();
    this.appDb
      .prepare('UPDATE CONTENT_ITEM SET current_status = ?, offline_switch = ? WHERE id = ?')
      .run(next, next === '已撤回' || next === '已下线' ? 1 : 0, itemId);
    this.appDb
      .prepare(
        `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
         VALUES (?, ?, 'CONTENT_ITEM', ?, ?, ?, ?, ?)`,
      )
      .run(crypto.randomUUID(), itemId, actorId, action, '内容与医学准确性', comment ?? null, now);
    this.audit.record({
      actorId,
      action: 'content:transition',
      target: itemId,
      diff: { from: item.current_status, to: next, action },
    });
    return this.getView(itemId);
  }

  /** 发布需双人确认：第一个审核人发起，第二个审核人确认 */
  publish(actorId: string, itemId: string) {
    const item = this.appDb
      .prepare('SELECT current_status AS s FROM CONTENT_ITEM WHERE id = ?')
      .get(itemId) as { s: ContentStatus } | undefined;
    if (!item) throw new NotFoundException('内容不存在');
    if (item.s !== '已审定') {
      throw new ConflictException('只有「已审定」状态可以发布');
    }
    const pending = this.appDb
      .prepare(
        `SELECT reviewer_id AS reviewerId FROM REVIEW_RECORD
         WHERE target_id = ? AND decision = '发布' ORDER BY reviewed_at DESC, rowid DESC LIMIT 1`,
      )
      .get(itemId) as { reviewerId: string } | undefined;
    if (!pending) {
      // 第一个审核人发起发布确认
      this.appDb
        .prepare(
          `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
           VALUES (?, ?, 'CONTENT_ITEM', ?, '发布', '第一审核人发起', NULL, ?)`,
        )
        .run(crypto.randomUUID(), itemId, actorId, new Date().toISOString());
      return { status: '待第二人确认', pendingReviewer: actorId };
    }
    if (pending.reviewerId === actorId) {
      throw new ConflictException('发布需双人确认：不能由同一审核人发起并确认');
    }
    // 第二个审核人确认 → 已发布，生成版本号
    const now = new Date().toISOString();
    this.appDb
      .prepare('UPDATE CONTENT_ITEM SET current_status = ?, offline_switch = 0 WHERE id = ?')
      .run('已发布', itemId);
    // 发布的是当前最新版本（不新建版本号）
    const versionRow = this.appDb
      .prepare('SELECT MAX(version) AS v FROM CONTENT_VERSION WHERE item_id = ?')
      .get(itemId) as { v: number | null };
    const version = versionRow.v ?? 1;
    this.appDb
      .prepare('UPDATE CONTENT_VERSION SET published_at = ? WHERE item_id = ? AND version = ?')
      .run(now, itemId, version);
    this.appDb
      .prepare(
        `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
         VALUES (?, ?, 'CONTENT_ITEM', ?, '发布', '第二审核人确认', NULL, ?)`,
      )
      .run(crypto.randomUUID(), itemId, actorId, now);
    this.audit.record({ actorId, action: 'content:publish', target: itemId, diff: { version } });
    return { status: '已发布', version };
  }

  /** 一键下线并定位引用页面 */
  offline(actorId: string, itemId: string) {
    const item = this.appDb
      .prepare('SELECT current_status AS s FROM CONTENT_ITEM WHERE id = ?')
      .get(itemId) as { s: ContentStatus } | undefined;
    if (!item) throw new NotFoundException('内容不存在');
    if (item.s !== '已发布') {
      throw new ConflictException('只有「已发布」状态可以下线');
    }
    const now = new Date().toISOString();
    this.appDb
      .prepare('UPDATE CONTENT_ITEM SET current_status = ?, offline_switch = 1 WHERE id = ?')
      .run('已下线', itemId);
    // 定位引用页面：引用该内容的分析
    const references = this.appDb
      .prepare(
        `SELECT DISTINCT a.id, a.episode_id AS episodeId FROM ANALYSIS a
         WHERE a.sections LIKE ?`,
      )
      .all(`%${itemId}%`) as Array<{ id: string; episodeId: string }>;
    this.audit.record({ actorId, action: 'content:offline', target: itemId, diff: { references } });
    return { status: '已下线', references };
  }

  /** 批量下线：需双人确认（与发布一致） */
  batchOffline(actorId: string, itemIds: string[]) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new ConflictException('批量下线需要至少选择一条内容');
    }
    for (const itemId of itemIds) {
      const item = this.appDb
        .prepare('SELECT current_status AS s FROM CONTENT_ITEM WHERE id = ?')
        .get(itemId) as { s: ContentStatus } | undefined;
      if (!item) throw new NotFoundException(`内容不存在：${itemId}`);
      if (item.s !== '已发布') {
        throw new ConflictException(`只有「已发布」状态可以下线：${itemId}`);
      }
    }
    const target = itemIds.join(',');
    const first = this.appDb
      .prepare(
        `SELECT reviewer_id AS reviewerId FROM REVIEW_RECORD
         WHERE target_id = ? AND decision = '批量下线-发起' ORDER BY reviewed_at DESC, rowid DESC LIMIT 1`,
      )
      .get(target) as { reviewerId: string } | undefined;
    const now = new Date().toISOString();
    if (!first) {
      // 第一个操作人发起
      this.appDb
        .prepare(
          `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
           VALUES (?, ?, 'BATCH_OFFLINE', ?, '批量下线-发起', '批量下线第一操作人', NULL, ?)`,
        )
        .run(crypto.randomUUID(), target, actorId, now);
      return { status: '待第二人确认', itemIds };
    }
    if (first.reviewerId === actorId) {
      throw new ConflictException('批量下线需双人确认：不能由同一操作人发起并确认');
    }
    // 第二个操作人确认 → 全部下线
    const results: Array<{ id: string; status: string }> = [];
    for (const itemId of itemIds) {
      this.appDb
        .prepare('UPDATE CONTENT_ITEM SET current_status = ?, offline_switch = 1 WHERE id = ?')
        .run('已下线', itemId);
      results.push({ id: itemId, status: '已下线' });
    }
    this.appDb
      .prepare(
        `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
         VALUES (?, ?, 'BATCH_OFFLINE', ?, '批量下线-确认', '批量下线第二操作人', NULL, ?)`,
      )
      .run(crypto.randomUUID(), target, actorId, now);
    this.audit.record({ actorId, action: 'content:batch-offline', target, diff: { count: itemIds.length } });
    return { status: '已下线', results };
  }

  /** 用户端：只能看到已发布内容 */
  listPublished() {
    return this.appDb
      .prepare(
        `SELECT id, type, title, applicable_scope AS applicableScope, not_applicable AS notApplicable
         FROM CONTENT_ITEM WHERE current_status = '已发布' AND offline_switch = 0
         ORDER BY rowid ASC`,
      )
      .all();
  }

  /** 推荐理由：基于适用范围与标题关键词 */
  recommend(scope: string | null) {
    const items = this.appDb
      .prepare(
        `SELECT id, type, title, applicable_scope AS applicableScope, not_applicable AS notApplicable
         FROM CONTENT_ITEM WHERE current_status = '已发布' AND offline_switch = 0`,
      )
      .all() as Array<{
      id: string;
      type: string;
      title: string;
      applicableScope: string;
      notApplicable: string;
    }>;
    if (!scope) return items.map((i) => ({ ...i, reason: '已发布的审核内容' }));
    const tokens = (scope.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z0-9/]{2,}/g) ?? []).filter((t) => t.length >= 2);
    return items
      .map((i) => {
        let score = 0;
        for (const t of tokens) {
          if (i.title.includes(t) || i.applicableScope.includes(t)) score += 1;
        }
        return { ...i, score, reason: score > 0 ? '适用范围与当前情况匹配' : '已发布的审核内容' };
      })
      .filter((i) => i.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  /** 管理端列表（全部状态） */
  listAll() {
    return this.appDb
      .prepare(
        `SELECT i.id, i.type, i.title, i.applicable_scope AS applicableScope, i.not_applicable AS notApplicable,
                i.current_status AS currentStatus, i.offline_switch AS offlineSwitch,
                (SELECT MAX(v.version) FROM CONTENT_VERSION v WHERE v.item_id = i.id) AS version,
                (SELECT r.reviewer_id FROM REVIEW_RECORD r WHERE r.target_id = i.id ORDER BY r.reviewed_at DESC, r.rowid DESC LIMIT 1) AS reviewer
         FROM CONTENT_ITEM i ORDER BY i.rowid ASC`,
      )
      .all();
  }

  /** 审核记录 */
  reviewRecords(itemId: string) {
    return this.appDb
      .prepare(
        `SELECT id, reviewer_id AS reviewerId, decision, review_scope AS reviewScope, comment, reviewed_at AS reviewedAt
         FROM REVIEW_RECORD WHERE target_id = ? ORDER BY reviewed_at ASC, rowid ASC`,
      )
      .all(itemId);
  }

  /** 版本链 */
  versions(itemId: string) {
    return this.appDb
      .prepare(
        `SELECT id, version, script, asset_key AS assetKey, subtitle_text AS subtitleText,
                model_asset_version AS modelAssetVersion, published_at AS publishedAt
         FROM CONTENT_VERSION WHERE item_id = ? ORDER BY version ASC`,
      )
      .all(itemId);
  }

  private getView(itemId: string): ContentItemView {
    const item = this.appDb
      .prepare(
        `SELECT i.id, i.type, i.title, i.applicable_scope AS applicableScope, i.not_applicable AS notApplicable,
                i.current_status AS currentStatus, i.offline_switch AS offlineSwitch,
                (SELECT MAX(v.version) FROM CONTENT_VERSION v WHERE v.item_id = i.id) AS version,
                (SELECT r.reviewer_id FROM REVIEW_RECORD r WHERE r.target_id = i.id ORDER BY r.reviewed_at DESC, r.rowid DESC LIMIT 1) AS reviewer
         FROM CONTENT_ITEM i WHERE i.id = ?`,
      )
      .get(itemId) as ContentItemView & { reviewer: string | null };
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      applicableScope: item.applicableScope,
      notApplicable: item.notApplicable,
      currentStatus: item.currentStatus,
      offlineSwitch: !!item.offlineSwitch,
      version: item.version,
      reviewer: item.reviewer,
      reason: null,
    };
  }
}
