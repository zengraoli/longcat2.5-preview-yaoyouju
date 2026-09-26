import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

/**
 * 统一审计日志：只追加，哈希链保证完整性。
 */
@Injectable()
export class AuditService {
  log(actorId: string, action: string, target?: string, diff?: Record<string, unknown> | string): void {
    const db = getDb();
    const lastEntry = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 1').get() as any | undefined;
    const prevHash = lastEntry?.hash || 'genesis';
    const now = new Date().toISOString();
    const diffStr = typeof diff === 'string' ? diff : JSON.stringify(diff || {});
    const data = `${prevHash}|${actorId}|${action}|${target || ''}|${diffStr}|${now}`;
    const hash = createHash('sha256').update(data).digest('hex');
    db.prepare('INSERT INTO audit_log (id, actor_id, action, target, diff, created_at, hash, prev_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      randomUUID(), actorId, action, target || null, diffStr, now, hash, prevHash,
    );
  }

  list(limit = 50) {
    const db = getDb();
    return db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').all(limit);
  }

  verify(): { valid: boolean; brokenAt?: string } {
    const db = getDb();
    const entries = db.prepare('SELECT * FROM audit_log ORDER BY created_at ASC').all() as any[];
    let prevHash = 'genesis';
    for (const entry of entries) {
      const data = `${entry.prev_hash}|${entry.actor_id}|${entry.action}|${entry.target || ''}|${entry.diff || ''}|${entry.created_at}`;
      const computedHash = createHash('sha256').update(data).digest('hex');
      if (computedHash !== entry.hash || entry.prev_hash !== prevHash) {
        return { valid: false, brokenAt: entry.id };
      }
      prevHash = entry.hash;
    }
    return { valid: true };
  }
}
