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
  getRecommendations(@Body() dto: { userId: string }) {
    return this.contentService.getRecommendations(dto.userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.contentService.getContentById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateContentDto) {
    return this.contentService.createContent(dto);
  }

  @Post('submit')
  @UseGuards(AdminAuthGuard)
  submit(@Body() dto: SubmitReviewDto) {
    return this.contentService.submitForReview(dto);
  }

  @Post('restore')
  @UseGuards(AdminAuthGuard)
  restore(@Body() dto: { contentId: string }) {
    return this.contentService.restore(dto);
  }

  @Post('review')
  @UseGuards(AdminAuthGuard)
  review(@Body() dto: ReviewDecisionDto, @Req() req: any) {
    return this.contentService.reviewDecision({ ...dto, reviewerId: req.admin.adminUserId });
  }

  @Post('publish')
  @UseGuards(AdminAuthGuard)
  publish(@Body() dto: PublishDto) {
    return this.contentService.publish(dto);
  }

  @Post('offline')
  @UseGuards(AdminAuthGuard)
  offline(@Body() dto: OfflineDto & { operatorId: string }) {
    return this.contentService.offline(dto);
  }
}
