import { Body, Controller, Get, Post, Query, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { QaService } from './qa.service';
import { AskQuestionDto, AddFollowupQuestionDto } from './dto/qa.dto';

@Controller('qa')
@UseGuards(AuthGuard)
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post('ask')
  askQuestion(@Req() req: any, @Body() dto: AskQuestionDto) {
    if (!dto.question || !dto.question.trim()) {
      throw new BadRequestException('问题不能为空');
    }
    return this.qaService.askQuestion(req.user.userId, dto);
  }

  @Get('history')
  getHistory(@Req() req: any, @Query('episodeId') episodeId?: string) {
    return this.qaService.getSessionHistory(req.user.userId, episodeId);
  }
}
