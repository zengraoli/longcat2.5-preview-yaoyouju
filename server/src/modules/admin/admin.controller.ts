import { BadRequestException, Body, ConflictException, Controller, Get, Inject, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ERR } from '../../common/utils/business-exception';
import { IsIn, IsString, MaxLength } from 'class-validator';
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

class ExportRequestDto {
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

  /** 后台退出登录（服务端销毁会话，令牌立即失效） */
  @Post('logout')
  @UseGuards(AdminGuard)
  logout(@Req() req: { headers: Record<string, string> }) {
    const token = req.headers['x-admin-token'] ?? '';
    if (token) this.auth.logout(token);
    return { loggedOut: true };
  }

  /** 审计日志列表（读取写审计） */
  @Get('audit-logs')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:read')
  listAuditLogs(@CurrentAdmin() admin: { adminId: string }) {
    this.audit.record({ actorId: admin.adminId, action: 'admin:audit-view', target: 'audit-logs' });
    return this.audit.list(1000);
  }

  /** 审计哈希链校验 */
  @Get('audit-logs/verify')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:read')
  verifyAuditLogs(@CurrentAdmin() _admin: unknown) {
    const tampered = this.audit.verify();
    return { valid: !tampered, tampered };
  }

  /** 审计导出申请（合规发起，超管审批） */
  @Post('audit-logs/export-requests')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:export:request')
  createExportRequest(@CurrentAdmin() admin: { adminId: string }, @Body() dto: ExportRequestDto) {
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO AUDIT_EXPORT_REQUEST (id, requester_id, reason, status, created_at)
         VALUES (?, ?, ?, '待审批', ?)`,
      )
      .run(id, admin.adminId, dto.reason, new Date().toISOString());
    this.audit.record({ actorId: admin.adminId, action: 'admin:audit-export-request', target: id, diff: { reason: dto.reason } });
    return { id, status: '待审批' };
  }

  /** 审计导出申请列表（超管审批） */
  @Get('audit-logs/export-requests')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:read')
  listExportRequests(@CurrentAdmin() _admin: unknown) {
    return this.appDb
      .prepare(
        `SELECT r.id, r.reason, r.status, r.created_at AS createdAt, r.reviewed_at AS reviewedAt,
                au.name AS requesterName
         FROM AUDIT_EXPORT_REQUEST r LEFT JOIN ADMIN_USER au ON au.id = r.requester_id
         ORDER BY r.created_at DESC, r.rowid DESC`,
      )
      .all();
  }

  /** 审批审计导出申请 */
  @Post('audit-logs/export-requests/:id/approve')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:export')
  approveExportRequest(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    const request = this.appDb
      .prepare('SELECT id, status FROM AUDIT_EXPORT_REQUEST WHERE id = ?')
      .get(id) as { id: string; status: string } | undefined;
    if (!request) throw new NotFoundException('申请不存在');
    if (request.status !== '待审批') throw new ConflictException('该申请已审批');
    this.appDb
      .prepare("UPDATE AUDIT_EXPORT_REQUEST SET status = '已批准', approver_id = ?, reviewed_at = ? WHERE id = ?")
      .run(admin.adminId, new Date().toISOString(), id);
    this.audit.record({ actorId: admin.adminId, action: 'admin:audit-export-approve', target: id });
    return { id, status: '已批准' };
  }

  /** 单条授权记录（查看用户原始内容需授权）：写入授权表并记审计 */
  @Post('authorizations')
  @UseGuards(AdminGuard)
  @RequirePermission('user:read:authorized')
  createAuthorization(@CurrentAdmin() admin: { adminId: string }, @Body() dto: AuthorizationDto) {
    // 校验目标对象存在（如 feedback:no-such-id 应被拒绝）
    if (dto.targetType === 'FEEDBACK') {
      const row = this.appDb.prepare('SELECT id FROM FEEDBACK WHERE id = ?').get(dto.targetId) as { id: string } | undefined;
      if (!row) throw ERR.NOT_FOUND('反馈不存在');
    }
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

  /** 反馈与举报列表（管理端；未授权时原文脱敏） */
  @Get('feedback')
  @UseGuards(AdminGuard)
  @RequirePermission('feedback:triage')
  listFeedback(@CurrentAdmin() admin: { adminId: string }) {
    this.audit.record({ actorId: admin.adminId, action: 'admin:feedback-view', target: 'feedback' });
    return this.feedback.listForAdmin(admin.adminId);
  }

  /** 后台成员列表（需 member:read 权限） */
  @Get('users')
  @UseGuards(AdminGuard)
  @RequirePermission('member:read')
  listUsers(@CurrentAdmin() _admin: unknown) {
    return this.appDb
      .prepare(
        `SELECT u.id, u.name, u.email, u.role_id AS roleId, r.name AS roleName,
                u.mfa_enabled AS mfaEnabled, u.status, u.last_login_at AS lastLoginAt
         FROM ADMIN_USER u JOIN ROLE r ON r.id = u.role_id ORDER BY u.rowid ASC`,
      )
      .all();
  }

  /** 单条授权记录列表 */
  @Get('authorizations')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:read')
  listAuthorizations(@CurrentAdmin() _admin: unknown) {
    return this.appDb
      .prepare(
        `SELECT a.id, a.admin_id AS adminId, au.name AS adminName, a.target_type AS targetType,
                a.target_id AS targetId, a.reason, a.created_at AS createdAt
         FROM ADMIN_AUTHORIZATION a LEFT JOIN ADMIN_USER au ON au.id = a.admin_id
         ORDER BY a.created_at DESC, a.rowid DESC`,
      )
      .all();
  }

  /** 停用 / 启用后台账号（不能停用自己，不能停用最后一个超管） */
  @Post('users/:id/status')
  @UseGuards(AdminGuard)
  @RequirePermission('member:read')
  setUserStatus(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string, @Body() body: { status: string }) {
    if (!['active', 'disabled'].includes(body.status)) {
      throw new BadRequestException('状态不合法');
    }
    if (id === admin.adminId) {
      throw new BadRequestException('不能停用当前登录的账号');
    }
    const target = this.appDb.prepare('SELECT id, role_id AS roleId FROM ADMIN_USER WHERE id = ?').get(id) as
      | { id: string; roleId: string }
      | undefined;
    if (!target) throw new NotFoundException('账号不存在');
    // 不能停用最后一个超级管理员
    if (body.status === 'disabled' && target.roleId === 'role-super') {
      const superCount = (
        this.appDb
          .prepare("SELECT COUNT(*) AS c FROM ADMIN_USER WHERE role_id = 'role-super' AND status = 'active'")
          .get() as { c: number }
      ).c;
      if (superCount <= 1) {
        throw new ConflictException('不能停用最后一个超级管理员');
      }
    }
    this.appDb.prepare('UPDATE ADMIN_USER SET status = ? WHERE id = ?').run(body.status, id);
    this.audit.record({ actorId: admin.adminId, action: 'admin:user-status', target: id, diff: { status: body.status } });
    return { id, status: body.status };
  }

  /** 修改后台账号角色（不能改自己的角色，不能把最后一个超管改成其他角色） */
  @Post('users/:id/role')
  @UseGuards(AdminGuard)
  @RequirePermission('member:read')
  setUserRole(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string, @Body() body: { roleId: string }) {
    if (id === admin.adminId) {
      throw new BadRequestException('不能修改当前登录账号的角色');
    }
    const target = this.appDb.prepare('SELECT id, role_id AS roleId FROM ADMIN_USER WHERE id = ?').get(id) as
      | { id: string; roleId: string }
      | undefined;
    if (!target) throw new NotFoundException('账号不存在');
    const role = this.appDb.prepare('SELECT id FROM ROLE WHERE id = ?').get(body.roleId) as { id: string } | undefined;
    if (!role) throw ERR.NOT_FOUND('角色不存在');
    // 不能把最后一个超管改成其他角色
    if (target.roleId === 'role-super' && body.roleId !== 'role-super') {
      const superCount = (
        this.appDb
          .prepare("SELECT COUNT(*) AS c FROM ADMIN_USER WHERE role_id = 'role-super' AND status = 'active'")
          .get() as { c: number }
      ).c;
      if (superCount <= 1) {
        throw new ConflictException('不能修改最后一个超级管理员的角色');
      }
    }
    this.appDb.prepare('UPDATE ADMIN_USER SET role_id = ? WHERE id = ?').run(body.roleId, id);
    this.audit.record({ actorId: admin.adminId, action: 'admin:user-role', target: id, diff: { roleId: body.roleId } });
    return { id, roleId: body.roleId };
  }

  /** 安全事件列表（匿名标识，不含问卷原文；所有后台角色可读） */
  @Get('safety-events')
  @UseGuards(AdminGuard)
  listSafetyEvents(@CurrentAdmin() admin: { adminId: string }) {
    this.audit.record({ actorId: admin.adminId, action: 'admin:safety-view', target: 'safety-events' });
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

  /** 案例投稿审核（发布 / 退回）；发布受“案例卡片”开关控制 */
  @Post('cases/:id/review')
  @UseGuards(AdminGuard)
  @RequirePermission('case:review')
  reviewCase(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string, @Body() body: { decision: string; comment?: string }) {
    const submission = this.appDb
      .prepare('SELECT id, status FROM CASE_SUBMISSION WHERE id = ?')
      .get(id) as { id: string; status: string } | undefined;
    if (!submission) throw new NotFoundException('投稿不存在');
    if (submission.status !== '待审') {
      throw new ConflictException('该投稿已处理');
    }
    if (body.decision !== '发布' && body.decision !== '退回') {
      throw new BadRequestException('decision 只能是“发布”或“退回”');
    }
    // 案例卡片开关关闭时禁止发布
    if (body.decision === '发布') {
      const switchRow = this.appDb
        .prepare("SELECT enabled FROM FEATURE_SWITCH WHERE key = '案例卡片'")
        .get() as { enabled: number } | undefined;
      if (switchRow && !switchRow.enabled) {
        throw ERR.SWITCH_OFF('案例卡片功能已关闭，不能发布案例');
      }
    }
    const next = body.decision === '发布' ? '已发布' : '已撤回';
    this.appDb
      .prepare('UPDATE CASE_SUBMISSION SET status = ? WHERE id = ?')
      .run(next, id);
    this.appDb
      .prepare(
        `INSERT INTO REVIEW_RECORD (id, target_id, target_type, reviewer_id, decision, review_scope, comment, reviewed_at)
         VALUES (?, ?, 'CASE_SUBMISSION', ?, ?, '案例投稿审核', ?, ?)`,
      )
      .run(crypto.randomUUID(), id, admin.adminId, body.decision, body.comment ?? null, new Date().toISOString());
    this.audit.record({ actorId: admin.adminId, action: 'case:review', target: id, diff: { decision: body.decision } });
    return { id, status: next };
  }

  /** 审计导出（需 audit:export 权限，写审计） */
  @Get('audit-logs/export')
  @UseGuards(AdminGuard)
  @RequirePermission('audit:export')
  exportAuditLogs(@CurrentAdmin() admin: { adminId: string }) {
    const logs = this.audit.list(1000);
    const header = '时间,操作人,角色,动作,对象,请求ID,哈希';
    // 字段含逗号/引号/换行时用双引号包裹并转义
    const escapeCsv = (value: string) => {
      if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
      return value;
    };
    const lines = logs.map((l) =>
      [
        l.createdAt,
        l.actorName ?? l.actorId ?? '系统',
        l.actorRole ?? '',
        l.action,
        l.target ?? '',
        l.requestId ?? '',
        l.hash.slice(0, 8),
      ].map(escapeCsv).join(','),
    );
    this.audit.record({ actorId: admin.adminId, action: 'admin:audit-export', target: 'audit-logs' });
    return { csv: [header, ...lines].join('\n'), count: logs.length };
  }
}
