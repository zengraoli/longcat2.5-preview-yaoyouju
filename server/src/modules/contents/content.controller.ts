import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ContentService } from './content.service';
import { CreateContentDto, SubmitReviewDto, ReviewDecisionDto, PublishDto, OfflineDto } from './dto/content.dto';

@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  getPublished() {
    return this.contentService.getPublishedContent();
  }

  @Get('all')
  @UseGuards(AdminAuthGuard)
  getAll() {
    return this.contentService.getAllContent();
  }

  @Get('recommendations')
  @UseGuards(AuthGuard)
  getRecommendations(@Req() req: any) {
    return this.contentService.getRecommendations(req.user.userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.contentService.getContentById(id);
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() dto: CreateContentDto, @Req() req: any) {
    return this.contentService.createContent(req.admin.adminUserId, dto);
  }

  @Post('submit')
  @UseGuards(AdminAuthGuard)
  submit(@Body() dto: SubmitReviewDto, @Req() req: any) {
    return this.contentService.submitForReview(dto, req.admin.adminUserId);
  }

  @Post('restore')
  @UseGuards(AdminAuthGuard)
  restore(@Body() dto: { contentId: string }, @Req() req: any) {
    return this.contentService.restore(dto, req.admin.adminUserId);
  }

  @Post('review')
  @UseGuards(AdminAuthGuard)
  review(@Body() dto: ReviewDecisionDto, @Req() req: any) {
    return this.contentService.reviewDecision({ ...dto, reviewerId: req.admin.adminUserId });
  }

  @Post('publish')
  @UseGuards(AdminAuthGuard)
  publish(@Body() dto: PublishDto, @Req() req: any) {
    return this.contentService.publish({ ...dto, reviewerId: req.admin.adminUserId });
  }

  @Post('offline')
  @UseGuards(AdminAuthGuard)
  offline(@Body() dto: OfflineDto, @Req() req: any) {
    return this.contentService.offline({ ...dto, operatorId: req.admin.adminUserId });
  }
}
