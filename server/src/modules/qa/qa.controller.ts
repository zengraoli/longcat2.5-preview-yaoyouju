import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { QaService } from './qa.service';

class CreateSessionDto {
  @IsString()
  analysisId!: string;

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
@UseGuards(AuthGuard)
export class QaController {
  constructor(private readonly qa: QaService) {}

  @Post('sessions')
  createSession(@CurrentUser() user: { userId: string }, @Body() dto: CreateSessionDto) {
    return this.qa.createSession(user.userId, dto.analysisId, dto.title);
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: { userId: string }) {
    return this.qa.listSessions(user.userId);
  }

  @Get('sessions/:id')
  getSession(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.qa.getSession(user.userId, id);
  }

  @Post('sessions/:id/messages')
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
