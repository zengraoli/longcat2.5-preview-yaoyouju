import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard, RequirePermission } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentAdmin } from '../admin/current-admin.decorator';
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

  /** 管理端：全部反馈 */
  @Get()
  @UseGuards(AdminGuard)
  @RequirePermission('feedback:handle')
  list(@CurrentAdmin() _admin: unknown) {
    return this.feedback.list();
  }

  /** 管理端：单条授权查看用户原始内容 */
  @Post(':id/authorize')
  @UseGuards(AdminGuard)
  @RequirePermission('feedback:handle')
  authorize(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.feedback.authorize(admin.adminId, id);
  }

  /** 管理端：处置动作与处理记录 */
  @Post(':id/handle')
  @UseGuards(AdminGuard)
  @RequirePermission('feedback:handle')
  handle(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string, @Body() dto: HandleDto) {
    return this.feedback.handle(admin.adminId, id, dto);
  }
}
