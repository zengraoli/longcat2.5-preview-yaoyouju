import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { verifyPassword } from '../../database/crypto';
import { ERR } from '../../common/utils/business-exception';
import { AuditService } from '../audit/audit.service';

export interface AdminSession {
  token: string;
  adminId: string;
  name: string;
  roleName: string;
  permissions: string[];
}

/** 后台登录：账号密码 + TOTP（演示固定码），无自助注册，连续失败锁定，短会话 */
@Injectable()
export class AdminAuthService {
  constructor(
    @Inject(APP_DB) private readonly appDb: Database.Database,
    private readonly audit: AuditService,
  ) {}

  login(name: string, password: string, totp: string): AdminSession {
    const admin = this.appDb
      .prepare(
        `SELECT id, name, role_id AS roleId, password_hash AS passwordHash, mfa_enabled AS mfaEnabled,
                status, failed_attempts AS failedAttempts, locked_until AS lockedUntil
         FROM ADMIN_USER WHERE name = ?`,
      )
      .get(name) as
      | {
          id: string;
          name: string;
          roleId: string;
          passwordHash: string;
          mfaEnabled: number;
          status: string;
          failedAttempts: number;
          lockedUntil: string | null;
        }
      | undefined;
    if (!admin) {
      this.audit.record({ actorId: null, action: 'admin:login-failed', target: name, diff: { reason: '账号或密码错误' } });
      throw ERR.ADMIN_CREDENTIALS();
    }
    // 停用账号不提前泄露状态：先校验密码，再检查状态
    const passwordValid = verifyPassword(password, admin.passwordHash);
    // 锁定到期后重置失败计数
    if (admin.lockedUntil && new Date(admin.lockedUntil).getTime() <= Date.now()) {
      this.appDb
        .prepare('UPDATE ADMIN_USER SET failed_attempts = 0, locked_until = NULL WHERE id = ?')
        .run(admin.id);
      admin.failedAttempts = 0;
      admin.lockedUntil = null;
    }
    if (admin.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now()) {
      this.audit.record({ actorId: admin.id, action: 'admin:login-failed', target: admin.name, diff: { reason: '账号已锁定' } });
      throw ERR.LOCKED('账号已锁定，请稍后再试');
    }
    const expectedTotp = process.env.ADMIN_TOTP_CODE ?? '123456';
    if (admin.mfaEnabled && totp !== expectedTotp) {
      this.recordFailure(admin.id, admin.failedAttempts);
      this.audit.record({ actorId: admin.id, action: 'admin:login-failed', target: admin.name, diff: { reason: '账号或密码错误' } });
      throw ERR.ADMIN_CREDENTIALS();
    }
    if (!passwordValid) {
      this.recordFailure(admin.id, admin.failedAttempts);
      this.audit.record({ actorId: admin.id, action: 'admin:login-failed', target: admin.name, diff: { reason: '账号或密码错误' } });
      throw ERR.ADMIN_CREDENTIALS();
    }
    if (admin.status !== 'active') {
      this.audit.record({ actorId: admin.id, action: 'admin:login-failed', target: admin.name, diff: { reason: '账号已停用' } });
      throw ERR.ADMIN_CREDENTIALS();
    }
    // 登录成功：重置失败计数，创建短会话（30 分钟）；令牌哈希存储
    const token = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    this.appDb
      .prepare(
        `INSERT INTO ADMIN_SESSION (id, admin_id, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(crypto.randomUUID(), admin.id, tokenHash, now.toISOString(), expiresAt.toISOString());
    this.appDb
      .prepare('UPDATE ADMIN_USER SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?')
      .run(now.toISOString(), admin.id);
    const role = this.appDb
      .prepare('SELECT name, permissions FROM ROLE WHERE id = ?')
      .get(admin.roleId) as { name: string; permissions: string };
    this.audit.record({ actorId: admin.id, action: 'admin:login', target: admin.name, diff: { role: role.name } });
    return {
      token,
      adminId: admin.id,
      name: admin.name,
      roleName: role.name,
      permissions: JSON.parse(role.permissions),
    };
  }

  /** 校验后台会话（同时检查账号是否已停用、是否处于锁定期间）；令牌以哈希比对 */
  resolveSession(token: string): AdminSession | null {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = this.appDb
      .prepare('SELECT admin_id AS adminId, expires_at AS expiresAt FROM ADMIN_SESSION WHERE token = ?')
      .get(tokenHash) as { adminId: string; expiresAt: string } | undefined;
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;
    const admin = this.appDb
      .prepare('SELECT id, name, role_id AS roleId, status, locked_until AS lockedUntil FROM ADMIN_USER WHERE id = ?')
      .get(session.adminId) as { id: string; name: string; roleId: string; status: string; lockedUntil: string | null } | undefined;
    if (!admin || admin.status !== 'active') return null;
    // 锁定期间旧会话立即失效
    if (admin.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now()) return null;
    const role = this.appDb
      .prepare('SELECT name, permissions FROM ROLE WHERE id = ?')
      .get(admin.roleId) as { name: string; permissions: string };
    return {
      token,
      adminId: admin.id,
      name: admin.name,
      roleName: role.name,
      permissions: JSON.parse(role.permissions),
    };
  }

  /** 退出登录（令牌以哈希比对） */
  logout(token: string): void {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    this.appDb.prepare('DELETE FROM ADMIN_SESSION WHERE token = ?').run(tokenHash);
  }

  private recordFailure(adminId: string, failedAttempts: number) {
    const threshold = parseInt(process.env.ADMIN_LOCK_THRESHOLD ?? '5', 10);
    const lockMinutes = parseInt(process.env.ADMIN_LOCK_MINUTES ?? '15', 10);
    const attempts = failedAttempts + 1;
    const lockedUntil =
      attempts >= threshold ? new Date(Date.now() + lockMinutes * 60 * 1000).toISOString() : null;
    this.appDb
      .prepare('UPDATE ADMIN_USER SET failed_attempts = ?, locked_until = ? WHERE id = ?')
      .run(attempts, lockedUntil, adminId);
  }
}
