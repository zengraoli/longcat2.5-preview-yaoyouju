import {
  ConflictException,
  ForbiddenException,
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

  /** 编辑内容（仅草稿 / 更正中 / 已撤回状态可编辑，编辑后回到草稿） */
  updateItem(
    actorId: string,
    itemId: string,
    input: {
      type?: string;
      title?: string;
      applicableScope?: string;
      notApplicable?: string;
      script?: string;
      subtitleText?: string;
    },
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
    if (!['草稿', '更正中', '已撤回'].includes(item.current_status)) {
      throw new ConflictException(`「${item.current_status}」状态不可编辑，请先撤回或更正`);
    }
    this.appDb
      .prepare(
        `UPDATE CONTENT_ITEM SET type = ?, title = ?, applicable_scope = ?, not_applicable = ?
         WHERE id = ?`,
      )
      .run(
        input.type ?? item.type,
        input.title ?? item.title,
        input.applicableScope !== undefined ? input.applicableScope : item.applicable_scope,
        input.notApplicable !== undefined ? input.notApplicable : item.not_applicable,
        itemId,
      );
    if (input.script !== undefined) {
      const versionRow = this.appDb
        .prepare('SELECT MAX(version) AS v FROM CONTENT_VERSION WHERE item_id = ?')
        .get(itemId) as { v: number | null };
      const nextVersion = (versionRow.v ?? 0) + 1;
      this.appDb
        .prepare(
          `INSERT INTO CONTENT_VERSION (id, item_id, version, script, asset_key, subtitle_text, model_asset_version, published_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        )
        .run(
          crypto.randomUUID(),
          itemId,
          nextVersion,
          input.script,
          `assets/${itemId}.mp4`,
          input.subtitleText ?? null,
          'asset-v1',
        );
    }
    this.audit.record({ actorId, action: 'content:update', target: itemId, diff: { title: input.title } });
    return this.getView(itemId);
  }

  /** 取内容行 */
  private getItem(itemId: string) {
    return this.appDb
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
  }

  /** 查最近的待确认发起记录 */
  private pendingByDecision(itemId: string, decision: string) {
    return this.appDb
      .prepare(
        `SELECT reviewer_id AS reviewerId FROM REVIEW_RECORD
         WHERE target_id = ? AND target_type = 'CONTENT_ITEM' AND decision = ?
         ORDER BY reviewed_at DESC, rowid DESC LIMIT 1`,
      )
      .get(itemId, decision) as { reviewerId: string } | undefined;
  }

  private hasPermission(permissions: string[], ...needed: string[]): boolean {
    return needed.some((n) => permissions.includes(n));
  }

  private insertReview(itemId: string, actorId: string, decision: string, scope: string, comment: string | null) {
    this.appDb
      .prepare(
        `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
         VALUES (?, ?, 'CONTENT_ITEM', ?, ?, ?, ?, ?)`,
      )
      .run(crypto.randomUUID(), itemId, actorId, decision, scope, comment, new Date().toISOString());
  }

  /** 状态机流转（非法流转返回错误）；发布/撤回/下线/更正需双人确认 */
  transitionItem(
    actorId: string,
    itemId: string,
    action: ContentAction,
    comment?: string,
    permissions: string[] = [],
  ): ContentItemView {
    const item = this.getItem(itemId);
    if (!item) throw new NotFoundException('内容不存在');
    const now = new Date().toISOString();

    // 通过 / 退回：仅临床审核（B10 中超管无此权限）
    if (action === '通过' || action === '退回') {
      if (!this.hasPermission(permissions, 'content:review')) {
        throw new ForbiddenException(`无权限执行「${action}」`);
      }
      if (action === '退回' && !comment?.trim()) {
        throw new ConflictException('退回时必须填写审核意见');
      }
      const next = transition(item.current_status, action);
      if (!next) throw new ConflictException(`非法状态流转：${item.current_status} 不能执行「${action}」`);
      this.appDb.prepare('UPDATE CONTENT_ITEM SET current_status = ? WHERE id = ?').run(next, itemId);
      this.insertReview(itemId, actorId, action, '内容与医学准确性', comment ?? null);
      this.audit.record({ actorId, action: 'content:transition', target: itemId, diff: { from: item.current_status, to: next, action } });
      return this.getView(itemId);
    }

    // 提交审核：运营编辑 / 超管
    if (action === '提交审核') {
      if (!this.hasPermission(permissions, 'content:edit')) {
        throw new ForbiddenException(`无权限执行「${action}」`);
      }
      const next = transition(item.current_status, action);
      if (!next) throw new ConflictException(`非法状态流转：${item.current_status} 不能执行「${action}」`);
      this.appDb.prepare('UPDATE CONTENT_ITEM SET current_status = ? WHERE id = ?').run(next, itemId);
      this.insertReview(itemId, actorId, action, '内容与医学准确性', comment ?? null);
      this.audit.record({ actorId, action: 'content:transition', target: itemId, diff: { from: item.current_status, to: next, action } });
      return this.getView(itemId);
    }

    // 更正：运营发起 + 临床/超管确认（双人）
    if (action === '更正') {
      const pending = this.pendingByDecision(itemId, '更正-发起');
      if (!pending) {
        if (!this.hasPermission(permissions, 'content:correct:initiate')) {
          throw new ForbiddenException('无权限发起更正');
        }
        this.insertReview(itemId, actorId, '更正-发起', '更正第一操作人', comment ?? null);
        this.audit.record({ actorId, action: 'content:correct-initiate', target: itemId });
        return { ...this.getView(itemId), pending: '待第二人确认' } as ContentItemView & { pending: string };
      }
      if (pending.reviewerId === actorId) {
        throw new ConflictException('更正需双人确认：不能由同一操作人发起并确认');
      }
      if (!this.hasPermission(permissions, 'content:correct:confirm')) {
        throw new ForbiddenException('无权限确认更正');
      }
      const next = transition(item.current_status, action);
      if (!next) throw new ConflictException(`非法状态流转：${item.current_status} 不能执行「${action}」`);
      this.appDb.prepare('UPDATE CONTENT_ITEM SET current_status = ? WHERE id = ?').run(next, itemId);
      this.insertReview(itemId, actorId, '更正-确认', '更正第二操作人', comment ?? null);
      this.audit.record({ actorId, action: 'content:transition', target: itemId, diff: { from: item.current_status, to: next, action } });
      return this.getView(itemId);
    }

    // 撤回 / 应急下线：临床审核 + 超管（双人）
    if (action === '撤回' || action === '下线') {
      const decision = action === '撤回' ? '撤回-发起' : '下线-发起';
      const pending = this.pendingByDecision(itemId, decision);
      if (!pending) {
        if (!this.hasPermission(permissions, 'content:offline')) {
          throw new ForbiddenException(`无权限执行「${action}」`);
        }
        this.insertReview(itemId, actorId, decision, `${action}第一操作人`, comment ?? null);
        this.audit.record({ actorId, action: 'content:offline-initiate', target: itemId });
        return { ...this.getView(itemId), pending: '待第二人确认' } as ContentItemView & { pending: string };
      }
      if (pending.reviewerId === actorId) {
        throw new ConflictException(`${action}需双人确认：不能由同一操作人发起并确认`);
      }
      if (!this.hasPermission(permissions, 'content:offline')) {
        throw new ForbiddenException(`无权限执行「${action}」`);
      }
      const next = transition(item.current_status, action);
      if (!next) throw new ConflictException(`非法状态流转：${item.current_status} 不能执行「${action}」`);
      this.appDb
        .prepare('UPDATE CONTENT_ITEM SET current_status = ?, offline_switch = ? WHERE id = ?')
        .run(next, next === '已撤回' || next === '已下线' ? 1 : 0, itemId);
      this.insertReview(itemId, actorId, `${action}-确认`, `${action}第二操作人`, comment ?? null);
      this.audit.record({ actorId, action: 'content:transition', target: itemId, diff: { from: item.current_status, to: next, action } });
      return this.getView(itemId);
    }

    throw new ConflictException(`非法状态流转：${item.current_status} 不能执行「${action}」`);
  }

  /** 发布需双人确认：运营编辑发起，临床审核 / 超管确认 */
  publish(actorId: string, itemId: string, permissions: string[] = []) {
    const item = this.getItem(itemId);
    if (!item) throw new NotFoundException('内容不存在');
    if (item.current_status !== '已审定') {
      throw new ConflictException('只有「已审定」状态可以发布');
    }
    const pending = this.pendingByDecision(itemId, '发布-发起');
    if (!pending) {
      if (!this.hasPermission(permissions, 'content:publish:initiate')) {
        throw new ForbiddenException('无权限发起发布');
      }
      this.insertReview(itemId, actorId, '发布-发起', '发布第一审核人', null);
      this.audit.record({ actorId, action: 'content:publish-initiate', target: itemId });
      return { status: '待第二人确认', pendingReviewer: actorId };
    }
    if (pending.reviewerId === actorId) {
      throw new ConflictException('发布需双人确认：不能由同一审核人发起并确认');
    }
    if (!this.hasPermission(permissions, 'content:publish:confirm')) {
      throw new ForbiddenException('无权限确认发布');
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
    this.insertReview(itemId, actorId, '发布-确认', '发布第二审核人', null);
    this.audit.record({ actorId, action: 'content:publish', target: itemId, diff: { version } });
    return { status: '已发布', version };
  }

  /** 一键下线并定位引用页面（需双人确认，与撤回一致） */
  offline(actorId: string, itemId: string, permissions: string[] = []) {
    const item = this.getItem(itemId);
    if (!item) throw new NotFoundException('内容不存在');
    if (item.current_status !== '已发布') {
      throw new ConflictException('只有「已发布」状态可以下线');
    }
    const pending = this.pendingByDecision(itemId, '下线-发起');
    if (!pending) {
      if (!this.hasPermission(permissions, 'content:offline')) {
        throw new ForbiddenException('无权限执行下线');
      }
      this.insertReview(itemId, actorId, '下线-发起', '下线第一操作人', null);
      this.audit.record({ actorId, action: 'content:offline-initiate', target: itemId });
      return { status: '待第二人确认', pendingReviewer: actorId } as { status: string; pendingReviewer: string };
    }
    if (pending.reviewerId === actorId) {
      throw new ConflictException('下线需双人确认：不能由同一操作人发起并确认');
    }
    if (!this.hasPermission(permissions, 'content:offline')) {
      throw new ForbiddenException('无权限执行下线');
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
    this.insertReview(itemId, actorId, '下线-确认', '下线第二操作人', null);
    this.audit.record({ actorId, action: 'content:offline', target: itemId, diff: { references } });
    return { status: '已下线', references };
  }

  /** 取消下线（应急下线开关复位；若状态为“已下线”则恢复为“已发布”） */
  restore(actorId: string, itemId: string, permissions: string[] = []) {
    const item = this.getItem(itemId);
    if (!item) throw new NotFoundException('内容不存在');
    if (!this.hasPermission(permissions, 'content:offline')) {
      throw new ForbiddenException('无权限执行取消下线');
    }
    const nextStatus = item.current_status === '已下线' ? '已发布' : item.current_status;
    this.appDb
      .prepare('UPDATE CONTENT_ITEM SET offline_switch = 0, current_status = ? WHERE id = ?')
      .run(nextStatus, itemId);
    this.audit.record({ actorId, action: 'content:restore', target: itemId });
    return this.getView(itemId);
  }

  /** 下线开关：立即对用户端隐藏 / 恢复内容，不改变审核状态（应急用） */
  setOfflineSwitch(actorId: string, itemId: string, offline: boolean, permissions: string[] = []) {
    const item = this.getItem(itemId);
    if (!item) throw new NotFoundException('内容不存在');
    if (!this.hasPermission(permissions, 'content:offline')) {
      throw new ForbiddenException('无权限操作下线开关');
    }
    this.appDb.prepare('UPDATE CONTENT_ITEM SET offline_switch = ? WHERE id = ?').run(offline ? 1 : 0, itemId);
    this.audit.record({ actorId, action: offline ? 'content:offline-switch-on' : 'content:offline-switch-off', target: itemId });
    return this.getView(itemId);
  }

  /** 批量下线：需双人确认（与发布一致） */
  batchOffline(actorId: string, itemIds: string[], permissions: string[] = []) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new ConflictException('批量下线需要至少选择一条内容');
    }
    for (const itemId of itemIds) {
      const item = this.getItem(itemId);
      if (!item) throw new NotFoundException(`内容不存在：${itemId}`);
      if (item.current_status !== '已发布') {
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
      if (!this.hasPermission(permissions, 'content:offline')) {
        throw new ForbiddenException('无权限执行批量下线');
      }
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
    if (!this.hasPermission(permissions, 'content:offline')) {
      throw new ForbiddenException('无权限执行批量下线');
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

  /** 用户端：只能看到已发布内容（含时长与审核版本） */
  listPublished() {
    return this.appDb
      .prepare(
        `SELECT i.id, i.type, i.title, i.applicable_scope AS applicableScope, i.not_applicable AS notApplicable,
                v.duration,
                (SELECT MAX(v2.version) FROM CONTENT_VERSION v2 WHERE v2.item_id = i.id) AS auditVersion
         FROM CONTENT_ITEM i LEFT JOIN CONTENT_VERSION v ON v.item_id = i.id
         WHERE i.current_status = '已发布' AND i.offline_switch = 0
         ORDER BY v.version DESC, i.rowid ASC`,
      )
      .all();
  }

  /** 推荐理由：基于适用范围与标题关键词 */
  recommend(scope: string | null) {
    const items = this.appDb
      .prepare(
        `SELECT i.id, i.type, i.title, i.applicable_scope AS applicableScope, i.not_applicable AS notApplicable,
                v.duration,
                (SELECT MAX(v2.version) FROM CONTENT_VERSION v2 WHERE v2.item_id = i.id) AS auditVersion
         FROM CONTENT_ITEM i LEFT JOIN CONTENT_VERSION v ON v.item_id = i.id
         WHERE i.current_status = '已发布' AND i.offline_switch = 0
         ORDER BY v.version DESC, i.rowid ASC`,
      )
      .all() as Array<{
      id: string;
      type: string;
      title: string;
      applicableScope: string;
      notApplicable: string;
      duration: string | null;
      auditVersion: number | null;
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

  /** 用户端：内容详情（含脚本、字幕、审核记录、版本） */
  publishedDetail(itemId: string) {
    const item = this.appDb
      .prepare(
        `SELECT i.id, i.type, i.title, i.applicable_scope AS applicableScope, i.not_applicable AS notApplicable,
                v.script, v.subtitle_text AS subtitleText, v.model_asset_version AS modelAssetVersion,
                v.duration, v.published_at AS publishedAt
         FROM CONTENT_ITEM i LEFT JOIN CONTENT_VERSION v ON v.item_id = i.id
         WHERE i.id = ? AND i.current_status = '已发布' AND i.offline_switch = 0
         ORDER BY v.version DESC LIMIT 1`,
      )
      .get(itemId) as
      | {
          id: string;
          type: string;
          title: string;
          applicableScope: string | null;
          notApplicable: string | null;
          script: string | null;
          subtitleText: string | null;
          modelAssetVersion: string | null;
          duration: string | null;
          publishedAt: string | null;
        }
      | undefined;
    if (!item) throw new NotFoundException('内容不存在或已下线');
    const reviews = this.appDb
      .prepare(
        `SELECT r.decision, r.comment, r.reviewed_at AS reviewedAt, au.name AS reviewerName
         FROM REVIEW_RECORD r LEFT JOIN ADMIN_USER au ON au.id = r.reviewer_id
         WHERE r.target_id = ? ORDER BY r.reviewed_at ASC`,
      )
      .all(itemId) as Array<{ decision: string; string: string; comment: string | null; reviewedAt: string; reviewerName: string | null }>;
    const versions = this.appDb
      .prepare('SELECT version, published_at AS publishedAt FROM CONTENT_VERSION WHERE item_id = ? ORDER BY version ASC')
      .all(itemId) as Array<{ version: number; publishedAt: string | null }>;
    return { ...item, reviews, versions };
  }

  /** 保存用户的内容复述（检验理解） */
  saveRetell(userId: string, itemId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) throw new ConflictException('复述内容不能为空');
    const item = this.getItem(itemId);
    if (!item || item.current_status !== '已发布' || item.offline_switch) {
      throw new NotFoundException('内容不存在或已下线');
    }
    const id = crypto.randomUUID();
    this.appDb
      .prepare('INSERT INTO CONTENT_RETELL (id, content_id, user_id, text, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, itemId, userId, trimmed.slice(0, 500), new Date().toISOString());
    return { id, contentId: itemId, saved: true };
  }

  /** 管理端列表（全部状态） */
  listAll() {
    return this.appDb
      .prepare(
        `SELECT i.id, i.type, i.title, i.applicable_scope AS applicableScope, i.not_applicable AS notApplicable,
                i.current_status AS currentStatus, i.offline_switch AS offlineSwitch,
                (SELECT MAX(v.version) FROM CONTENT_VERSION v WHERE v.item_id = i.id) AS version,
                (SELECT au.name FROM REVIEW_RECORD r JOIN ADMIN_USER au ON au.id = r.reviewer_id
                 WHERE r.target_id = i.id ORDER BY r.reviewed_at DESC, r.rowid DESC LIMIT 1) AS reviewer,
                (SELECT v.published_at FROM CONTENT_VERSION v WHERE v.item_id = i.id AND v.published_at IS NOT NULL
                 ORDER BY v.version DESC LIMIT 1) AS publishedAt,
                (SELECT COUNT(DISTINCT a.id) FROM ANALYSIS a
                 WHERE a.sections LIKE '%' || i.id || '%') AS refCount
         FROM CONTENT_ITEM i ORDER BY i.rowid ASC`,
      )
      .all();
  }

  /** 审核记录（含审核人姓名） */
  reviewRecords(itemId: string) {
    return this.appDb
      .prepare(
        `SELECT r.id, au.name AS reviewerName, r.decision, r.review_scope AS reviewScope, r.comment, r.reviewed_at AS reviewedAt
         FROM REVIEW_RECORD r LEFT JOIN ADMIN_USER au ON au.id = r.reviewer_id
         WHERE r.target_id = ? ORDER BY r.reviewed_at ASC, r.rowid ASC`,
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
