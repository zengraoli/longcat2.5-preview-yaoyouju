import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { AuditService } from '../audit/audit.service';

export interface SwitchView {
  key: string;
  enabled: boolean;
  reason: string | null;
  updatedAt: string;
}

/** 功能开关：立即生效，变更写审计 */
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
        'SELECT key, enabled, reason, updated_at AS updatedAt FROM FEATURE_SWITCH ORDER BY key',
      )
      .all()
      .map((r: { key: string; enabled: number; reason: string | null; updatedAt: string }) => ({
        key: r.key,
        enabled: !!r.enabled,
        reason: r.reason,
        updatedAt: r.updatedAt,
      }));
  }

  set(key: string, enabled: boolean, reason: string, actorId: string | null): SwitchView[] {
    const existing = this.appDb
      .prepare('SELECT id, enabled FROM FEATURE_SWITCH WHERE key = ?')
      .get(key) as { id: string; enabled: number } | undefined;
    if (!existing) {
      throw new NotFoundException(`开关不存在：${key}`);
    }
    const now = new Date().toISOString();
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
    return this.list();
  }
}
