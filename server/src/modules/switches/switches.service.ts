import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';

export interface SwitchView {
  key: string;
  enabled: boolean;
  reason: string | null;
  confirmMode: string;
  updatedAt: string;
}

export interface SwitchSetResult {
  status: string;
  switches?: SwitchView[];
  pendingReviewer?: string;
}

/** 功能开关：高危开关需双人确认（技术负责人发起，临床审核 / 超管确认）；变更写审计 */
@Injectable()
export class SwitchesService {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly audit: AuditService,
  ) {}

  isOn(key: string): boolean {
    const row = this.appDb
      .prepare('SELECT enabled FROM FEATURE_SWITCH WHERE key = ?')
      .get(key) as { enabled: number } | undefined;
    return !!row?.enabled;
  }

  list(): SwitchView[] {
    return this.appDb
      .prepare(
        'SELECT key, enabled, reason, confirm_mode AS confirmMode, updated_at AS updatedAt FROM FEATURE_SWITCH ORDER BY key',
      )
      .all()
      .map((r: { key: string; enabled: number; reason: string | null; confirmMode: string; updatedAt: string }) => ({
        key: r.key,
        enabled: !!r.enabled,
        reason: r.reason,
        confirmMode: r.confirmMode,
        updatedAt: r.updatedAt,
      }));
  }

  /** 变更开关：单人开关直接生效；双人开关需第二人确认 */
  set(key: string, enabled: boolean, reason: string, actorId: string, permissions: string[] = []): SwitchSetResult {
    const existing = this.appDb
      .prepare('SELECT id, enabled, confirm_mode AS confirmMode FROM FEATURE_SWITCH WHERE key = ?')
      .get(key) as { id: string; enabled: number; confirmMode: string } | undefined;
    if (!existing) {
      throw new NotFoundException(`开关不存在：${key}`);
    }
    const now = new Date().toISOString();

    // 单人确认开关：直接生效（需 switch:write）
    if (existing.confirmMode === '单人') {
      if (!permissions.includes('switch:write')) {
        throw new ForbiddenException('无权限变更开关');
      }
      this.appDb
        .prepare('UPDATE FEATURE_SWITCH SET enabled = ?, reason = ?, updated_at = ? WHERE id = ?')
        .run(enabled ? 1 : 0, reason, now, existing.id);
      this.audit.record({
        actorId,
        action: 'switch:update',
        target: key,
        diff: { before: !!existing.enabled, after: enabled, reason },
        requestId: crypto.randomUUID(),
      });
      return { status: '已生效', switches: this.list() };
    }

    // 双人确认开关：第一个操作人发起（需 switch:write）
    const pending = this.appDb
      .prepare(
        `SELECT reviewer_id AS reviewerId FROM REVIEW_RECORD
         WHERE target_id = ? AND target_type = 'FEATURE_SWITCH' AND decision = '开关变更-发起'
         ORDER BY reviewed_at DESC, rowid DESC LIMIT 1`,
      )
      .get(key) as { reviewerId: string } | undefined;
    if (!pending) {
      if (!permissions.includes('switch:write')) {
        throw new ForbiddenException('无权限变更开关');
      }
      this.appDb
        .prepare(
          `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
           VALUES (?, ?, 'FEATURE_SWITCH', ?, '开关变更-发起', '开关第一操作人', ?, ?)`,
        )
        .run(crypto.randomUUID(), key, actorId, reason, now);
      this.audit.record({ actorId, action: 'switch:initiate', target: key, diff: { enabled, reason } });
      return { status: '待第二人确认', pendingReviewer: actorId };
    }
    if (pending.reviewerId === actorId) {
      throw new ConflictException('开关变更需双人确认：不能由同一操作人发起并确认');
    }
    // 第二个操作人确认（需 switch:confirm）
    if (!permissions.includes('switch:confirm')) {
      throw new ForbiddenException('无权限确认开关变更');
    }
    // 消费待确认发起记录（避免下次发起时读到过期 pending）
    this.appDb
      .prepare("DELETE FROM REVIEW_RECORD WHERE target_id = ? AND target_type = 'FEATURE_SWITCH' AND decision = '开关变更-发起'")
      .run(key);
    // 第二个操作人确认 → 生效
    this.appDb
      .prepare('UPDATE FEATURE_SWITCH SET enabled = ?, reason = ?, updated_at = ? WHERE id = ?')
      .run(enabled ? 1 : 0, reason, now, existing.id);
    this.appDb
      .prepare(
        `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
         VALUES (?, ?, 'FEATURE_SWITCH', ?, '开关变更-确认', '开关第二操作人', ?, ?)`,
      )
      .run(crypto.randomUUID(), key, actorId, reason, now);
    this.audit.record({
      actorId,
      action: 'switch:update',
      target: key,
      diff: { before: !!existing.enabled, after: enabled, reason },
      requestId: crypto.randomUUID(),
    });
    return { status: '已生效', switches: this.list() };
  }
}
