import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminService } from '../admin/admin.service';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, GrantFeedbackViewDto } from './dto/feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService, private readonly adminService: AdminService) {}

  private requirePerm(req: any, perm: string) {
    this.adminService.requirePermission(req.admin.roleId, perm);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(req.user.userId, dto);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  list(@Query('isErrorReport') isErrorReport?: string, @Req() req?: any) {
    this.requirePerm(req, 'feedback:triage');
    return this.feedbackService.getFeedbackList({ isErrorReport: isErrorReport === 'true' });
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  getById(@Param('id') id: string, @Req() req: any) {
    this.requirePerm(req, 'feedback:triage');
    return this.feedbackService.getFeedbackById(id);
  }

  @Post('grant-view')
  @UseGuards(AdminAuthGuard)
  grantView(@Body() dto: GrantFeedbackViewDto, @Req() req: any) {
    this.requirePerm(req, 'feedback:grant-plaintext');
    return this.feedbackService.grantView(dto);
  }
}
