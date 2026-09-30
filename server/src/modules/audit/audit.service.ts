import { Inject, Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  target: string | null;
  diff: unknown;
  requestId: string | null;
  prevHash: string | null;
  hash: string;
  createdAt: string;
}

/** 审计日志：只追加，每条带哈希并串成哈希链；哈希链头单独存，用于发现末尾记录被删 */
@Injectable()
export class AuditService {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  record(entry: {
    actorId?: string | null;
    action: string;
    target?: string | null;
    diff?: unknown;
    requestId?: string | null;
  }): AuditEntry {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const requestId = entry.requestId ?? crypto.randomUUID();
    const prev = this.appDb
      .prepare('SELECT hash FROM AUDIT_LOG ORDER BY created_at DESC, rowid DESC LIMIT 1')
      .get() as { hash: string } | undefined;
    const prevHash = prev?.hash ?? null;
    const hash = this.computeHash({ id, createdAt, prevHash, ...entry, requestId });
    this.appDb
      .prepare(
        `INSERT INTO AUDIT_LOG (id, actor_id, action, target, diff, request_id, prev_hash, hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        entry.actorId ?? null,
        entry.action,
        entry.target ?? null,
        entry.diff ? JSON.stringify(entry.diff) : null,
        requestId,
        prevHash,
        hash,
        createdAt,
      );
    // 记录哈希链头，用于发现末尾记录被删除
    this.appDb
      .prepare(
        `CREATE TABLE IF NOT EXISTS AUDIT_META (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
      )
      .run();
    this.appDb
      .prepare('INSERT INTO AUDIT_META (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run('head_hash', hash);
    return {
      id,
      actorId: entry.actorId ?? null,
      actorName: null,
      actorRole: null,
      action: entry.action,
      target: entry.target ?? null,
      diff: entry.diff ?? null,
      requestId,
      prevHash,
      hash,
      createdAt,
    };
  }

  list(limit = 100): AuditEntry[] {
    return this.appDb
      .prepare(
        `SELECT a.id, a.actor_id AS actorId, a.action, a.target, a.diff, a.request_id AS requestId,
                a.prev_hash AS prevHash, a.hash, a.created_at AS createdAt,
                au.name AS actorName, r.name AS actorRole
         FROM AUDIT_LOG a
         LEFT JOIN ADMIN_USER au ON au.id = a.actor_id
         LEFT JOIN ROLE r ON r.id = au.role_id
         ORDER BY a.created_at DESC, a.rowid DESC LIMIT ?`,
      )
      .all(limit) as AuditEntry[];
  }

  /** 校验哈希链完整性，返回第一个被篡改的记录（null 表示完整） */
  verify(): { id: string; expected: string; actual: string } | null {
    const rows = this.appDb
      .prepare(
        `SELECT id, actor_id AS actorId, action, target, diff, request_id AS requestId,
                prev_hash AS prevHash, hash, created_at AS createdAt
         FROM AUDIT_LOG ORDER BY created_at ASC, rowid ASC`,
      )
      .all() as AuditEntry[];
    if (rows.length === 0) return null;
    // 第一条记录的 prevHash 必须为 null（创世记录）；若首条被删，新首条 prevHash 非 null 即可发现
    if (rows[0].prevHash !== null) {
      return { id: rows[0].id, expected: 'null', actual: String(rows[0].prevHash) };
    }
    let prevHash: string | null = null;
    for (const row of rows) {
      if (row.prevHash !== prevHash) {
        return { id: row.id, expected: String(prevHash), actual: String(row.prevHash) };
      }
      const expected = this.computeHash({
        id: row.id,
        createdAt: row.createdAt,
        prevHash: row.prevHash,
        actorId: row.actorId,
        action: row.action,
        target: row.target,
        diff: row.diff ? JSON.parse(row.diff as string) : null,
        requestId: row.requestId,
      });
      if (expected !== row.hash) {
        return { id: row.id, expected, actual: row.hash };
      }
      prevHash = row.hash;
    }
    // 末尾记录被删除时，链本身仍连续，但哈希链头对不上即可发现
    const head = this.appDb
      .prepare("SELECT value FROM AUDIT_META WHERE key = 'head_hash'")
      .get() as { value: string } | undefined;
    if (head && rows.length > 0 && head.value !== rows[rows.length - 1].hash) {
      return { id: rows[rows.length - 1].id, expected: head.value, actual: rows[rows.length - 1].hash };
    }
    return null;
  }

  private computeHash(fields: {
    id: string;
    createdAt: string;
    prevHash: string | null;
    actorId?: string | null;
    action: string;
    target?: string | null;
    diff?: unknown;
    requestId?: string | null;
  }): string {
    const payload = JSON.stringify({
      id: fields.id,
      createdAt: fields.createdAt,
      prevHash: fields.prevHash,
      actorId: fields.actorId ?? null,
      action: fields.action,
      target: fields.target ?? null,
      diff: fields.diff ?? null,
      requestId: fields.requestId ?? null,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }
}
