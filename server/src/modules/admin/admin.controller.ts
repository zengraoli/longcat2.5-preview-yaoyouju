import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { APP_DB } from '../../database/database.module';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard, RequirePermission } from './admin.guard';
import { AuditService } from '../audit/audit.service';
import { FeedbackService } from '../feedback/feedback.service';
import { CurrentAdmin } from './current-admin.decorator';

class LoginDto {
  @IsString()
  name!: string;

  @IsString()
  password!: string;

  @IsString()
  totp!: string;
}

class AuthorizationDto {
  @IsString()
  targetType!: string;

  @IsString()
  targetId!: string;

  @IsString()
  @MaxLength(500)
  reason!: string;
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly audit: AuditService,
    private readonly feedback: FeedbackService,
    @Inject(APP_DB) private readonly appDb: Database.Database,
  ) {}

  /** 后台登录（账号密码 + TOTP） */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.name, dto.password, dto.totp);
  }

  /** 后台退出登录 */
  @Post('logout')
  @UseGuards(AdminGuard)
  logout(@Req() req: { headers: Record<string, string> }) {
    const header = req.headers['x-admin-token'] ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) this.auth.logout(token);
    return { loggedOut: true };
  }

  /** 审计日志列表 */
  @Get('audit-logs')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:read')
  listAuditLogs(@CurrentAdmin() _admin: unknown) {
    return this.audit.list(200);
  }

  /** 审计哈希链校验 */
  @Get('audit-logs/verify')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:read')
  verifyAuditLogs(@CurrentAdmin() _admin: unknown) {
    const tampered = this.audit.verify();
    return { valid: !tampered, tampered };
  }

  /** 单条授权记录（查看用户原始内容需授权）：写入授权表并记审计 */
  @Post('authorizations')
  @UseGuards(AdminGuard)
  createAuthorization(@CurrentAdmin() admin: { adminId: string }, @Body() dto: AuthorizationDto) {
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO ADMIN_AUTHORIZATION (id, admin_id, target_type, target_id, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, admin.adminId, dto.targetType, dto.targetId, dto.reason, new Date().toISOString());
    this.audit.record({
      actorId: admin.adminId,
      action: 'admin:authorize',
      target: `${dto.targetType}:${dto.targetId}`,
      diff: { reason: dto.reason },
    });
    return { id, authorized: true };
  }

  /** 反馈与举报列表（管理端） */
  @Get('feedback')
  @UseGuards(AdminGuard)
  @RequirePermission('feedback:handle')
  listFeedback(@CurrentAdmin() _admin: unknown) {
    return this.feedback.list();
  }

  /** 后台成员列表 */
  @Get('users')
  @UseGuards(AdminGuard)
  listUsers(@CurrentAdmin() _admin: unknown) {
    return this.appDb
      .prepare(
        `SELECT u.id, u.name, u.mfa_enabled AS mfaEnabled, u.status, u.last_login_at AS lastLoginAt, r.name AS roleName
         FROM ADMIN_USER u JOIN ROLE r ON r.id = u.role_id ORDER BY u.rowid ASC`,
      )
      .all();
  }

  /** 安全事件列表（匿名标识，不含问卷原文） */
  @Get('safety-events')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:read')
  listSafetyEvents(@CurrentAdmin() _admin: unknown) {
    return this.appDb
      .prepare(
        `SELECT id, user_id AS userId, rule_code AS ruleCode, severity, action_taken AS actionTaken,
                source, created_at AS createdAt
         FROM SAFETY_EVENT ORDER BY created_at DESC, rowid DESC LIMIT 200`,
      )
      .all();
  }

  /** 案例投稿列表 */
  @Get('cases')
  @UseGuards(AdminGuard)
  @RequirePermission('case:review')
  listCases(@CurrentAdmin() _admin: unknown) {
    return this.appDb
      .prepare(
        `SELECT id, user_id AS userId, edited_content AS editedContent, consent_scope AS consentScope,
                status, created_at AS createdAt
         FROM CASE_SUBMISSION ORDER BY created_at DESC, rowid DESC`,
      )
      .all();
  }

  /** 审计导出（需审批，这里返回 CSV 文本） */
  @Get('audit-logs/export')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:read')
  exportAuditLogs(@CurrentAdmin() admin: { adminId: string }) {
    const logs = this.audit.list(1000);
    const header = '时间,操作人,角色,动作,对象,请求ID,哈希';
    const lines = logs.map((l) =>
      [
        l.createdAt,
        l.actorName ?? l.actorId ?? '系统',
        l.actorRole ?? '',
        l.action,
        l.target ?? '',
        l.requestId ?? '',
        l.hash.slice(0, 8),
      ].join(','),
    );
    this.audit.record({ actorId: admin.adminId, action: 'admin:audit-export', target: 'audit-logs' });
    return { csv: [header, ...lines].join('\n'), count: logs.length };
  }
}
