import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { getDb } from '../../database/database.module';
import { getIdentityDb } from '../../database/identity-database.module';
import { EncryptionService } from '../../database/encryption.service';

@Injectable()
export class AuthService {
  constructor(private readonly encryptionService: EncryptionService) {}

  private maskPhone(phone: string): string {
    if (phone.length < 7) return '***';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }

  sendCode(phone: string): void {
    const code = process.env.SMS_CODE || '123456';
    console.log(`[SMS] verification code for ${this.maskPhone(phone)}: ${code}`);
  }

  login(phone: string, code: string): { token: string; userId: string } {
    const expectedCode = process.env.SMS_CODE || '123456';
    if (code !== expectedCode) {
      throw new UnauthorizedException('验证码错误');
    }

    const db = getDb();
    const identityDb = getIdentityDb();

    const phoneHash = createHash('sha256').update(phone).digest('hex');
    const identity = identityDb.prepare('SELECT * FROM identity_profile WHERE phone_hash = ?').get(
      phoneHash,
    ) as { user_id: string } | undefined;

    if (!identity) {
      const userId = randomUUID();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO "user" (id, status, created_at) VALUES (?, ?, ?)').run(userId, 'active', now);
      identityDb.prepare('INSERT INTO identity_profile (user_id, phone_hash, phone_enc, real_name_enc) VALUES (?, ?, ?, ?)').run(
        userId,
        phoneHash,
        this.encryptionService.encrypt(phone),
        this.encryptionService.encrypt(''),
      );
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO user_session (id, user_id, phone_enc, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        randomUUID(), userId, this.encryptionService.encrypt(phone), token, now, expiresAt,
      );
      return { token, userId };
    }

    const userId = identity.user_id;
    const token = randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO user_session (id, user_id, phone_enc, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      randomUUID(), userId, this.encryptionService.encrypt(phone), token, now, expiresAt,
    );
    return { token, userId };
  }

  getConsentStatus(userId: string): { scope: string; granted: boolean; grantedAt: string | null; revokedAt: string | null }[] {
    const db = getDb();
    const scopes = ['健康信息处理', '分享', '产品改进'];
    const results: { scope: string; granted: boolean; grantedAt: string | null; revokedAt: string | null }[] = [];
    for (const scope of scopes) {
      const row = db.prepare(
        'SELECT * FROM consent WHERE user_id = ? AND scope = ? AND revoked_at IS NULL ORDER BY granted_at DESC LIMIT 1',
      ).get(userId, scope) as { granted_at: string; revoked_at: string | null } | undefined;
      results.push({
        scope,
        granted: !!row,
        grantedAt: row?.granted_at || null,
        revokedAt: row?.revoked_at || null,
      });
    }
    return results;
  }

  grantConsent(userId: string, scopes: string[]): void {
    const db = getDb();
    const now = new Date().toISOString();
    for (const scope of scopes) {
      const existing = db.prepare(
        'SELECT * FROM consent WHERE user_id = ? AND scope = ? AND revoked_at IS NULL',
      ).get(userId, scope);
      if (!existing) {
        db.prepare('INSERT INTO consent (id, user_id, scope, granted_at) VALUES (?, ?, ?, ?)').run(
          randomUUID(), userId, scope, now,
        );
      }
    }
  }

  revokeConsent(userId: string, scope: string): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare('UPDATE consent SET revoked_at = ? WHERE user_id = ? AND scope = ? AND revoked_at IS NULL').run(now, userId, scope);
  }

  validateToken(token: string): { userId: string } | null {
    const db = getDb();
    const session = db.prepare('SELECT * FROM user_session WHERE token = ? AND expires_at > ?').get(token, new Date().toISOString()) as { user_id: string } | undefined;
    return session ? { userId: session.user_id } : null;
  }
}
