import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { QaService } from './qa.service';
import { AskQuestionDto, AddFollowupQuestionDto } from './dto/qa.dto';

@Controller('qa')
@UseGuards(AuthGuard)
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post('ask')
  askQuestion(@Req() req: any, @Body() dto: AskQuestionDto) {
    return this.qaService.askQuestion(req.user.userId, dto);
  }

  @Get('history')
  getHistory(@Req() req: any, @Query('episodeId') episodeId?: string) {
    return this.qaService.getSessionHistory(req.user.userId, episodeId);
  }
}
