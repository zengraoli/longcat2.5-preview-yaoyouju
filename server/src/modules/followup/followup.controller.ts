import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { FollowupService } from './followup.service';
import { PreviewFollowupDto, ExportFollowupDto, ReorderQuestionsDto } from './dto/followup.dto';

@Controller('followup')
@UseGuards(AuthGuard)
export class FollowupController {
  constructor(private readonly followupService: FollowupService) {}

  @Post('preview')
  preview(@Req() req: any, @Body() dto: PreviewFollowupDto) {
    return this.followupService.generatePreview(req.user.userId, dto.episodeId);
  }

  @Post('export')
  export(@Req() req: any, @Body() dto: ExportFollowupDto) {
    return this.followupService.exportSummary(req.user.userId, dto);
  }
}
