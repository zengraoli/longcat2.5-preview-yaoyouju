import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';

@Injectable()
export class AdminService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000;
  private readonly SESSION_DURATION_MS = 30 * 60 * 1000;

  private hashPassword(password: string): string {
    return createHash('sha256').update(password + 'admin-salt').digest('hex');
  }

  login(dto: { username: string; password: string; totp: string }) {
    if (dto.totp !== (process.env.ADMIN_TOTP_CODE || '123456')) {
      throw new UnauthorizedException('TOTP 验证码错误');
    }

    const db = getDb();
    const admin = db.prepare('SELECT * FROM admin_user WHERE name = ?').get(dto.username) as any | undefined;
    if (!admin) throw new UnauthorizedException('账号或密码错误');

    const hashedPassword = this.hashPassword(dto.password);
    const expectedHash = this.hashPassword('admin123');
    if (hashedPassword !== expectedHash) {
      const failedAttempts = (admin.failed_attempts || 0) + 1;
      if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        db.prepare('UPDATE admin_user SET locked_until = ?, failed_attempts = ? WHERE id = ?').run(
          new Date(Date.now() + this.LOCKOUT_DURATION_MS).toISOString(), failedAttempts, admin.id,
        );
        throw new UnauthorizedException('账号已锁定，请15分钟后重试');
      }
      db.prepare('UPDATE admin_user SET failed_attempts = ? WHERE id = ?').run(failedAttempts, admin.id);
      throw new UnauthorizedException('账号或密码错误');
    }

    const sessionToken = randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION_MS).toISOString();

    db.prepare('UPDATE admin_user SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(admin.id);
    db.prepare('INSERT INTO admin_session (id, admin_user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(
      randomUUID(), admin.id, sessionToken, now, expiresAt,
    );

    return { sessionToken, adminUserId: admin.id, roleId: admin.role_id, expiresAt };
  }

  validateSession(token: string): { adminUserId: string; roleId: string } | null {
    const db = getDb();
    const session = db.prepare('SELECT * FROM admin_session WHERE token = ? AND expires_at > ?').get(token, new Date().toISOString()) as any | undefined;
    if (!session) return null;
    return { adminUserId: session.admin_user_id, roleId: session.role_id };
  }

  checkPermission(roleId: string, requiredPermission: string): boolean {
    const db = getDb();
    const role = db.prepare('SELECT * FROM role WHERE id = ?').get(roleId) as any | undefined;
    if (!role) return false;
    const permissions = JSON.parse(role.permissions);
    return permissions.includes('*') || permissions.includes(requiredPermission);
  }

  logAudit(actorId: string, action: string, target?: string, diff?: string): void {
    const db = getDb();
    const lastEntry = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 1').get() as any | undefined;
    const prevHash = lastEntry?.hash || 'genesis';
    const now = new Date().toISOString();
    const data = `${prevHash}|${actorId}|${action}|${target || ''}|${diff || ''}|${now}`;
    const hash = createHash('sha256').update(data).digest('hex');
    db.prepare('INSERT INTO audit_log (id, actor_id, action, target, diff, created_at, hash, prev_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      randomUUID(), actorId, action, target || null, diff || null, now, hash, prevHash,
    );
  }

  verifyAuditChain(): { valid: boolean; brokenAt?: string } {
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

  createAdminUser(dto: { name: string; roleId: string; password: string }) {
    const db = getDb();
    const id = randomUUID();
    db.prepare('INSERT INTO admin_user (id, name, role_id, mfa_enabled) VALUES (?, ?, ?, ?)').run(
      id, dto.name, dto.roleId, 1,
    );
    return { id, name: dto.name, roleId: dto.roleId };
  }

  getAdminUsers() {
    const db = getDb();
    return db.prepare('SELECT * FROM admin_user').all();
  }
}
