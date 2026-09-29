import { Inject, Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB, IDENTITY_DB } from '../../database/database.module';
import { encryptField, maskPhone } from '../../database/crypto';

export const CONSENT_SCOPES = ['健康信息处理', '分享', '产品改进'] as const;
export type ConsentScope = (typeof CONSENT_SCOPES)[number];

export interface ConsentView {
  scope: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    @Inject(IDENTITY_DB) private readonly identityDb: Database.Database,
  ) {}

  /** 发送短信验证码：演示固定 123456，只写日志且手机号脱敏 */
  sendSmsCode(phone: string): { sent: boolean } {
    if (!/^1\d{10}$/.test(phone)) {
      throw Object.assign(new Error('手机号格式不正确'), { status: 400 });
    }
    const code = process.env.SMS_CODE ?? '123456';
    this.logger.log(`短信验证码已发送（演示固定码 ${code}）至 ${maskPhone(phone)}`);
    return { sent: true };
  }

  /** 手机号验证码登录；首次登录自动创建匿名用户与身份档案 */
  login(phone: string, code: string): {
    token: string;
    user: { id: string };
    consents: ConsentView[];
  } {
    const expected = process.env.SMS_CODE ?? '123456';
    if (code !== expected) {
      throw Object.assign(new Error('验证码错误'), { status: 400, code: 2001 });
    }
    const user = this.findOrCreateUser(phone);
    const token = crypto.randomUUID();
    const ttlHours = parseInt(process.env.SESSION_TTL_HOURS ?? '72', 10);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ttlHours * 3600 * 1000);
    this.appDb
      .prepare(
        'INSERT INTO SESSION (id, user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(crypto.randomUUID(), user.id, token, createdAt.toISOString(), expiresAt.toISOString());
    this.logger.log(`用户登录成功：${user.id}`);
    return { token, user: { id: user.id }, consents: this.getConsents(user.id) };
  }

  getConsents(userId: string): ConsentView[] {
    const rows = this.appDb
      .prepare(
        'SELECT scope, granted_at AS grantedAt, revoked_at AS revokedAt FROM CONSENT WHERE user_id = ?',
      )
      .all(userId) as Array<{ scope: string; grantedAt: string | null; revokedAt: string | null }>;
    const byScope = new Map(rows.map((r) => [r.scope, r]));
    return CONSENT_SCOPES.map((scope) => {
      const row = byScope.get(scope);
      return {
        scope,
        granted: !!row && !row.revokedAt,
        grantedAt: row?.grantedAt ?? null,
        revokedAt: row?.revokedAt ?? null,
      };
    });
  }

  /** 单独勾选同意；撤回立即生效 */
  setConsent(userId: string, scope: string, granted: boolean): ConsentView[] {
    if (!CONSENT_SCOPES.includes(scope as ConsentScope)) {
      throw Object.assign(new Error('未知的同意范围'), { status: 400 });
    }
    const existing = this.appDb
      .prepare('SELECT id, revoked_at AS revokedAt FROM CONSENT WHERE user_id = ? AND scope = ?')
      .get(userId, scope) as { id: string; revokedAt: string | null } | undefined;
    if (granted) {
      if (existing && !existing.revokedAt) {
        // 已同意，无需重复写入
      } else if (existing) {
        this.appDb
          .prepare('UPDATE CONSENT SET granted_at = ?, revoked_at = NULL WHERE id = ?')
          .run(new Date().toISOString(), existing.id);
      } else {
        this.appDb
          .prepare('INSERT INTO CONSENT (id, user_id, scope, granted_at, revoked_at) VALUES (?, ?, ?, ?, NULL)')
          .run(crypto.randomUUID(), userId, scope, new Date().toISOString());
      }
    } else {
      if (existing && !existing.revokedAt) {
        this.appDb
          .prepare('UPDATE CONSENT SET revoked_at = ? WHERE id = ?')
          .run(new Date().toISOString(), existing.id);
      }
    }
    return this.getConsents(userId);
  }

  hasConsent(userId: string, scope: string): boolean {
    const row = this.appDb
      .prepare(
        'SELECT revoked_at AS revokedAt FROM CONSENT WHERE user_id = ? AND scope = ? AND revoked_at IS NULL',
      )
      .get(userId, scope);
    return !!row;
  }

  /** 校验会话，返回 userId；无效或过期抛 401 */
  resolveSession(token: string): string | null {
    const session = this.appDb
      .prepare('SELECT user_id AS userId, expires_at AS expiresAt FROM SESSION WHERE token = ?')
      .get(token) as { userId: string; expiresAt: string } | undefined;
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;
    return session.userId;
  }

  private findOrCreateUser(phone: string): { id: string } {
    const phoneHash = crypto.createHash('sha256').update(phone).digest('hex');
    const existing = this.identityDb
      .prepare('SELECT user_id AS userId FROM IDENTITY_PROFILE WHERE phone_hash = ?')
      .get(phoneHash) as { userId: string } | undefined;
    if (existing) return { id: existing.userId };
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const retentionUntil = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    this.appDb
      .prepare('INSERT INTO USER (id, status, created_at, retention_until) VALUES (?, ?, ?, ?)')
      .run(id, 'active', createdAt, retentionUntil);
    this.identityDb
      .prepare(
        'INSERT INTO IDENTITY_PROFILE (user_id, phone_hash, phone_enc, real_name_enc) VALUES (?, ?, ?, NULL)',
      )
      .run(id, phoneHash, encryptField(phone));
    return { id };
  }
}
