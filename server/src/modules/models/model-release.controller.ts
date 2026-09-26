import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminService } from '../admin/admin.service';
import { ModelReleaseService } from './model-release.service';
import { CreateModelReleaseDto, SubmitEvalRunDto, EvalResultDto, PublishModelDto, RollbackModelDto } from './dto/model.dto';

@Controller('models')
@UseGuards(AdminAuthGuard)
export class ModelReleaseController {
  constructor(private readonly modelReleaseService: ModelReleaseService, private readonly adminService: AdminService) {}

  private requirePerm(req: any, perm: string) {
    this.adminService.requirePermission(req.admin.roleId, perm);
  }

  @Post()
  create(@Body() dto: CreateModelReleaseDto, @Req() req: any) {
    this.requirePerm(req, 'models:publish');
    return this.modelReleaseService.createRelease(dto);
  }

  @Get()
  getAll(@Req() req: any) {
    this.requirePerm(req, 'models:read');
    return this.modelReleaseService.getReleases();
  }

  @Post('eval/submit')
  submitEval(@Body() dto: SubmitEvalRunDto, @Req() req: any) {
    this.requirePerm(req, 'eval:run');
    return this.modelReleaseService.submitForEval(dto);
  }

  @Post('eval/result')
  submitResult(@Body() dto: EvalResultDto, @Req() req: any) {
    this.requirePerm(req, 'eval:run');
    return this.modelReleaseService.submitEvalResult(dto);
  }

  @Post('publish')
  publish(@Body() dto: PublishModelDto, @Req() req: any) {
    this.requirePerm(req, 'models:publish');
    return this.modelReleaseService.publish({ releaseId: dto.releaseId, reviewerId: req.admin.adminUserId });
  }

  @Post('rollback')
  rollback(@Body() dto: RollbackModelDto, @Req() req: any) {
    this.requirePerm(req, 'models:rollback');
    return this.modelReleaseService.rollback({ releaseId: dto.releaseId, operatorId: req.admin.adminUserId });
  }

  @Get(':id/eval-runs')
  getEvalRuns(@Param('id') id: string, @Req() req: any) {
    this.requirePerm(req, 'eval:read');
    return this.modelReleaseService.getEvalRuns(id);
  }
}
