import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, RequirePermission } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentAdmin, CurrentAdminInfo } from '../admin/current-admin.decorator';
import { FeedbackService } from './feedback.service';

class HelpFeedbackDto {
  @IsString()
  analysisId!: string;

  @IsIn(['看懂了', '知道下一步', '都不好'])
  helpType!: '看懂了' | '知道下一步' | '都不好';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  unsolvedQuestion?: string;
}

class ErrorReportDto {
  @IsString()
  analysisId!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsIn(['高', '中', '低'])
  severity!: '高' | '中' | '低';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  problemTypes?: string[];

  @IsOptional()
  @IsBoolean()
  authorized?: boolean;
}

class HandleDto {
  @IsString()
  action!: string;

  @IsString()
  @MaxLength(2000)
  resolution!: string;
}

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  /** 帮助类型反馈（不自动进入训练或内容库） */
  @Post()
  @UseGuards(AuthGuard)
  createHelp(@CurrentUser() user: { userId: string }, @Body() dto: HelpFeedbackDto) {
    return this.feedback.createHelpFeedback(user.userId, dto);
  }

  /** 错误举报（自动附带四类版本） */
  @Post('reports')
  @UseGuards(AuthGuard)
  createReport(@CurrentUser() user: { userId: string }, @Body() dto: ErrorReportDto) {
    return this.feedback.createErrorReport(user.userId, dto);
  }

  /** 用户端：我的反馈 */
  @Get('mine')
  @UseGuards(AuthGuard)
  listMine(@CurrentUser() user: { userId: string }) {
    return this.feedback.listOwn(user.userId);
  }

  /** 用户端：反馈详情（只能看自己的） */
  @Get(':id')
  @UseGuards(AuthGuard)
  detail(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.feedback.detail(id, user.userId);
  }

  /** 管理端：全部反馈（未授权时原文脱敏；临床复核也可读） */
  @Get()
  @UseGuards(AdminGuard)
  @RequirePermission('feedback:triage', 'feedback:review')
  list(@CurrentAdmin() admin: CurrentAdminInfo) {
    return this.feedback.listForAdmin(admin.adminId, admin.permissions);
  }

  /** 管理端：单条授权查看用户原始内容（临床审核 / 超管） */
  @Post(':id/authorize')
  @UseGuards(AdminGuard)
  @RequirePermission('user:read:authorized')
  authorize(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.feedback.authorize(admin.adminId, id);
  }

  /** 管理端：撤回单条授权（仅授权人本人） */
  @Post('authorizations/:id/revoke')
  @UseGuards(AdminGuard)
  @RequirePermission('user:read:authorized')
  revokeAuthorization(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.feedback.revokeAuthorization(admin.adminId, id);
  }

  /** 管理端：处置动作与处理记录（运营初筛或临床复核） */
  @Post(':id/handle')
  @UseGuards(AdminGuard)
  @RequirePermission('feedback:triage', 'feedback:review')
  handle(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string, @Body() dto: HandleDto) {
    return this.feedback.handle(admin.adminId, id, dto);
  }
}
