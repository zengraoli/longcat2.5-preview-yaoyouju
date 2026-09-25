import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

export interface FeatureSwitchState {
  key: string;
  enabled: boolean;
  reason: string | null;
}

@Injectable()
export class FeatureSwitchService {
  getSwitch(key: string): FeatureSwitchState | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM feature_switch WHERE key = ?').get(key) as { key: string; enabled: number; reason: string | null } | undefined;
    if (!row) return null;
    return { key: row.key, enabled: !!row.enabled, reason: row.reason };
  }

  isEnabled(key: string): boolean {
    const state = this.getSwitch(key);
    return state?.enabled ?? false;
  }

  setSwitch(key: string, enabled: boolean, reason?: string): void {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM feature_switch WHERE key = ?').get(key) as { id: string } | undefined;
    if (existing) {
      db.prepare('UPDATE feature_switch SET enabled = ?, reason = ? WHERE key = ?').run(enabled ? 1 : 0, reason || null, key);
    } else {
      db.prepare('INSERT INTO feature_switch (id, key, enabled, reason) VALUES (?, ?, ?, ?)').run(randomUUID(), key, enabled ? 1 : 0, reason || null);
    }
    db.prepare('INSERT INTO audit_log (id, actor_id, action, target, diff, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      randomUUID(), 'system', 'feature_switch.changed', key, JSON.stringify({ enabled, reason }), new Date().toISOString(),
    );
  }

  getAllSwitches(): FeatureSwitchState[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM feature_switch').all() as { key: string; enabled: number; reason: string | null }[];
    return rows.map((r) => ({ key: r.key, enabled: !!r.enabled, reason: r.reason }));
  }
}
