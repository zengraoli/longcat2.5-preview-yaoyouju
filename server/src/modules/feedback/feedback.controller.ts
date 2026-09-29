import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
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

  /** 反馈列表（管理端） */
  @Get()
  @UseGuards(AuthGuard)
  list(@CurrentUser() _user: { userId: string }) {
    return this.feedback.list();
  }

  /** 详情（含四类版本） */
  @Get(':id')
  @UseGuards(AuthGuard)
  detail(@CurrentUser() _user: { userId: string }, @Param('id') id: string) {
    return this.feedback.detail(id);
  }

  /** 单条授权查看用户原始内容 */
  @Post(':id/authorize')
  @UseGuards(AuthGuard)
  authorize(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.feedback.authorize(user.userId, id);
  }

  /** 处置动作与处理记录 */
  @Post(':id/handle')
  @UseGuards(AuthGuard)
  handle(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: HandleDto) {
    return this.feedback.handle(user.userId, id, dto);
  }
}
