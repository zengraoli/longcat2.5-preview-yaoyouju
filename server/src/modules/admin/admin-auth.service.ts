import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { verifyPassword } from '../../database/crypto';

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
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

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
      throw new UnauthorizedException('账号或密码错误');
    }
    if (admin.status !== 'active') {
      throw new UnauthorizedException('账号已停用');
    }
    if (admin.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now()) {
      throw new UnauthorizedException('账号已锁定，请稍后再试');
    }
    const expectedTotp = process.env.ADMIN_TOTP_CODE ?? '123456';
    if (admin.mfaEnabled && totp !== expectedTotp) {
      this.recordFailure(admin.id, admin.failedAttempts);
      throw new UnauthorizedException('MFA 验证码错误');
    }
    if (!verifyPassword(password, admin.passwordHash)) {
      this.recordFailure(admin.id, admin.failedAttempts);
      throw new UnauthorizedException('账号或密码错误');
    }
    // 登录成功：重置失败计数，创建短会话（2 小时）
    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 3600 * 1000);
    this.appDb
      .prepare(
        `INSERT INTO ADMIN_SESSION (id, admin_id, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(crypto.randomUUID(), admin.id, token, now.toISOString(), expiresAt.toISOString());
    this.appDb
      .prepare('UPDATE ADMIN_USER SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?')
      .run(now.toISOString(), admin.id);
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

  /** 校验后台会话 */
  resolveSession(token: string): AdminSession | null {
    const session = this.appDb
      .prepare('SELECT admin_id AS adminId, expires_at AS expiresAt FROM ADMIN_SESSION WHERE token = ?')
      .get(token) as { adminId: string; expiresAt: string } | undefined;
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;
    const admin = this.appDb
      .prepare('SELECT id, name, role_id AS roleId FROM ADMIN_USER WHERE id = ?')
      .get(session.adminId) as { id: string; name: string; roleId: string } | undefined;
    if (!admin) return null;
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
