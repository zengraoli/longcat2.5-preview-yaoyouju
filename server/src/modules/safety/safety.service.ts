import { Inject, Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { RULESET_VERSION, RuleHit, matchOutOfScope, matchRedFlags } from './rules';

export interface SafetyCheckResult {
  rulesetVersion: string;
  redFlags: RuleHit[];
  outOfScope: RuleHit[];
  passed: boolean;
  safetyTips: string[];
}

/** 安全规则引擎：红旗信号与服务范围校验，命中写安全事件 */
@Injectable()
export class SafetyService {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  /** 纯校验（不写库），供客户端在提交前预检 */
  check(text: string): SafetyCheckResult {
    const redFlags = matchRedFlags(text);
    const outOfScope = matchOutOfScope(text);
    return {
      rulesetVersion: RULESET_VERSION,
      redFlags,
      outOfScope,
      passed: redFlags.length === 0,
      safetyTips: [...redFlags, ...outOfScope].map((h) => h.message),
    };
  }

  /** 校验并写安全事件（规则、严重度、动作、来源） */
  checkAndRecord(userId: string | null, source: string, text: string): SafetyCheckResult {
    const result = this.check(text);
    const insert = this.appDb.prepare(
      `INSERT INTO SAFETY_EVENT (id, user_id, rule_code, severity, action_taken, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    const now = new Date().toISOString();
    for (const hit of [...result.redFlags, ...result.outOfScope]) {
      insert.run(
        crypto.randomUUID(),
        userId,
        hit.code,
        hit.severity,
        hit.action,
        source,
        now,
      );
    }
    return result;
  }

  listEvents(limit = 50) {
    return this.appDb
      .prepare(
        `SELECT id, user_id AS userId, rule_code AS ruleCode, severity, action_taken AS actionTaken,
                source, created_at AS createdAt
         FROM SAFETY_EVENT ORDER BY created_at DESC, rowid DESC LIMIT ?`,
      )
      .all(limit);
  }
}
