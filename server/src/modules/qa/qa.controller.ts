import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { ConsentGuard, RequireConsent } from '../auth/consent.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { QaService } from './qa.service';

class CreateSessionDto {
  /** 可空：没有分析时创建自由提问会话 */
  @IsOptional()
  @IsString()
  analysisId?: string | null;

  @IsString()
  title!: string;
}

class AskDto {
  @IsString()
  @MaxLength(2000)
  question!: string;
}

class AddFollowupDto {
  @IsString()
  @MaxLength(500)
  question!: string;
}

@Controller('qa')
@UseGuards(AuthGuard, ConsentGuard)
export class QaController {
  constructor(private readonly qa: QaService) {}

  @Post('sessions')
  @RequireConsent('健康信息处理')
  createSession(@CurrentUser() user: { userId: string }, @Body() dto: CreateSessionDto) {
    return this.qa.createSession(user.userId, dto.analysisId ?? null, dto.title);
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: { userId: string }) {
    return this.qa.listSessions(user.userId);
  }

  @Get('sessions/:id')
  @RequireConsent('健康信息处理')
  getSession(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.qa.getSession(user.userId, id);
  }

  @Post('sessions/:id/messages')
  @RequireConsent('健康信息处理')
  ask(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: AskDto) {
    return this.qa.ask(user.userId, id, dto.question);
  }

  @Post('sessions/:id/followup-questions')
  addFollowup(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: AddFollowupDto,
  ) {
    return this.qa.addFollowupQuestion(user.userId, id, dto.question);
  }

  @Get('sessions/:id/followup-questions')
  listFollowup(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.qa.listFollowupQuestions(user.userId, id);
  }
}
