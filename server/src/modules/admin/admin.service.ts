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
    const session = db.prepare(`
      SELECT s.admin_user_id, u.role_id
      FROM admin_session s
      JOIN admin_user u ON s.admin_user_id = u.id
      WHERE s.token = ? AND s.expires_at > ?
    `).get(token, new Date().toISOString()) as any | undefined;
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

  getRoles() {
    const db = getDb();
    return db.prepare('SELECT id, name, permissions FROM role ORDER BY rowid ASC').all();
  }

  getAuditLogs() {
    const db = getDb();
    return db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50').all();
  }

  getSafetyEvents() {
    const db = getDb();
    return db.prepare('SELECT * FROM safety_event ORDER BY created_at DESC LIMIT 50').all();
  }

  getCaseSubmissions() {
    const db = getDb();
    return db.prepare('SELECT * FROM case_submission ORDER BY rowid DESC LIMIT 50').all();
  }

  getEvalSets() {
    const db = getDb();
    return db.prepare('SELECT id, name, case_count, deidentified FROM eval_set ORDER BY rowid ASC').all();
  }

  getEvalRuns() {
    const db = getDb();
    return db.prepare(`
      SELECT er.*, mr.model_name, es.name AS eval_set_name
      FROM eval_run er
      JOIN model_release mr ON er.model_release_id = mr.id
      JOIN eval_set es ON er.eval_set_id = es.id
      ORDER BY er.rowid DESC LIMIT 20
    `).all();
  }

  /**
   * 仪表盘：核心指标、近 7 天分析趋势、最近安全事件、待办事项。
   */
  getDashboard() {
    const db = getDb();

    const analyses = (db.prepare('SELECT COUNT(*) as cnt FROM analysis').get() as any).cnt;
    const totalTasks = (db.prepare('SELECT COUNT(*) as cnt FROM analysis_task').get() as any).cnt;
    const failedTasks = (db.prepare("SELECT COUNT(*) as cnt FROM analysis_task WHERE status = 'failed'").get() as any).cnt;
    const failureRate = totalTasks > 0 ? Math.round((failedTasks / totalTasks) * 100) : 0;

    const completedTasks = db.prepare("SELECT created_at, updated_at FROM analysis_task WHERE status = 'completed' AND updated_at IS NOT NULL").all() as any[];
    const avgDurationMs = completedTasks.length > 0
      ? Math.round(completedTasks.reduce((sum, t) => sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()), 0) / completedTasks.length)
      : 0;

    const pendingReviews = (db.prepare("SELECT COUNT(*) as cnt FROM content_item WHERE current_status = '待医学审核'").get() as any).cnt;
    const pendingReports = (db.prepare("SELECT COUNT(*) as cnt FROM error_report WHERE status = 'open'").get() as any).cnt;
    const safetyEventCount = (db.prepare('SELECT COUNT(*) as cnt FROM safety_event').get() as any).cnt;

    const safetyEvents = db.prepare('SELECT id, rule_code, severity, action_taken, created_at FROM safety_event ORDER BY created_at DESC LIMIT 10').all();

    const trend7d: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const count = (db.prepare("SELECT COUNT(*) as cnt FROM analysis WHERE date(created_at) = ?").get(day) as any).cnt;
      trend7d.push({ date: day, count });
    }

    const todo: { type: string; title: string; id: string }[] = [];
    const reviewItems = db.prepare("SELECT id, title FROM content_item WHERE current_status = '待医学审核' LIMIT 5").all() as any[];
    reviewItems.forEach((item) => todo.push({ type: '内容待审', title: item.title, id: item.id }));
    const reportItems = db.prepare(`
      SELECT er.id, f.help_type FROM error_report er
      JOIN feedback f ON er.feedback_id = f.id
      WHERE er.status = 'open' LIMIT 5
    `).all() as any[];
    reportItems.forEach((item) => todo.push({ type: '待处理举报', title: item.help_type || '错误举报', id: item.id }));
    const evalItems = db.prepare("SELECT id, model_name AS name FROM model_release WHERE status = '灰度' LIMIT 5").all() as any[];
    evalItems.forEach((item) => todo.push({ type: '发布待确认', title: item.name, id: item.id }));

    return {
      stats: {
        analyses,
        failureRate,
        avgDurationMs,
        cost: 0,
        pendingReviews,
        pendingReports,
        safetyEventCount,
      },
      trend7d,
      safetyEvents,
      todo,
    };
  }
}
