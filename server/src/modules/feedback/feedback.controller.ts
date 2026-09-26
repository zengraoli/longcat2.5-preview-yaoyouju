import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, GrantFeedbackViewDto } from './dto/feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(req.user.userId, dto);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  list(@Query('isErrorReport') isErrorReport?: string) {
    return this.feedbackService.getFeedbackList({ isErrorReport: isErrorReport === 'true' });
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  getById(@Param('id') id: string) {
    return this.feedbackService.getFeedbackById(id);
  }

  @Post('grant-view')
  @UseGuards(AdminAuthGuard)
  grantView(@Body() dto: GrantFeedbackViewDto) {
    return this.feedbackService.grantView(dto);
  }
}
