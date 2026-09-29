import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
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
  ) {}

  /** 后台登录（账号密码 + TOTP） */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.name, dto.password, dto.totp);
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

  /** 单条授权记录（查看用户原始内容需授权） */
  @Post('authorizations')
  @UseGuards(AdminGuard)
  createAuthorization(@CurrentAdmin() admin: { adminId: string }, @Body() dto: AuthorizationDto) {
    return this.audit.record({
      actorId: admin.adminId,
      action: 'admin:authorize',
      target: `${dto.targetType}:${dto.targetId}`,
      diff: { reason: dto.reason },
    });
  }

  /** 反馈与举报列表（管理端） */
  @Get('feedback')
  @UseGuards(AdminGuard)
  @RequirePermission('feedback:handle')
  listFeedback(@CurrentAdmin() _admin: unknown) {
    return this.feedback.list();
  }
}
