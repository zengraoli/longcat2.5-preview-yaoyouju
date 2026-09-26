import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ContentService } from './content.service';
import { AdminService } from '../admin/admin.service';
import { CreateContentDto, SubmitReviewDto, ReviewDecisionDto, PublishDto, OfflineDto } from './dto/content.dto';

@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService, private readonly adminService: AdminService) {}

  private requirePerm(req: any, perm: string) {
    this.adminService.requirePermission(req.admin.roleId, perm);
  }

  @Get()
  @UseGuards(AuthGuard)
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

  @Get('admin/:id')
  @UseGuards(AdminAuthGuard)
  getAdminById(@Param('id') id: string) {
    // 后台详情：含草稿/待审/下线内容与审核记录
    return this.contentService.getContentById(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getById(@Param('id') id: string) {
    // 用户端只读已发布内容；草稿/待审/下线内容返回 404
    return this.contentService.getPublishedContentById(id);
  }


  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() dto: CreateContentDto, @Req() req: any) {
    this.requirePerm(req, 'content:create');
    return this.contentService.createContent(req.admin.adminUserId, dto);
  }

  @Post('submit')
  @UseGuards(AdminAuthGuard)
  submit(@Body() dto: SubmitReviewDto, @Req() req: any) {
    this.requirePerm(req, 'content:submit');
    return this.contentService.submitForReview(dto, req.admin.adminUserId);
  }

  @Post('restore')
  @UseGuards(AdminAuthGuard)
  restore(@Body() dto: { contentId: string }, @Req() req: any) {
    this.requirePerm(req, 'content:offline');
    return this.contentService.restore(dto, req.admin.adminUserId);
  }

  @Post('publish-request')
  @UseGuards(AdminAuthGuard)
  publishRequest(@Body() dto: { contentId: string }, @Req() req: any) {
    this.requirePerm(req, 'content:submit');
    return { requested: true, contentId: dto.contentId, applicant: req.admin.adminUserId };
  }

  @Post('review')
  @UseGuards(AdminAuthGuard)
  review(@Body() dto: ReviewDecisionDto, @Req() req: any) {
    this.requirePerm(req, 'content:review');
    return this.contentService.reviewDecision({ ...dto, reviewerId: req.admin.adminUserId });
  }

  @Post('publish')
  @UseGuards(AdminAuthGuard)
  publish(@Body() dto: PublishDto, @Req() req: any) {
    this.requirePerm(req, 'content:approve');
    return this.contentService.publish({ ...dto, reviewerId: req.admin.adminUserId });
  }

  @Post('offline')
  @UseGuards(AdminAuthGuard)
  offline(@Body() dto: OfflineDto, @Req() req: any) {
    this.requirePerm(req, 'content:offline');
    return this.contentService.offline({ ...dto, operatorId: req.admin.adminUserId });
  }
}
