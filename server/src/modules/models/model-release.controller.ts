import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ModelReleaseService } from './model-release.service';
import { CreateModelReleaseDto, SubmitEvalRunDto, EvalResultDto, PublishModelDto, RollbackModelDto } from './dto/model.dto';

@Controller('models')
@UseGuards(AdminAuthGuard)
export class ModelReleaseController {
  constructor(private readonly modelReleaseService: ModelReleaseService) {}

  @Post()
  create(@Body() dto: CreateModelReleaseDto) {
    return this.modelReleaseService.createRelease(dto);
  }

  @Get()
  getAll() {
    return this.modelReleaseService.getReleases();
  }

  @Post('eval/submit')
  submitEval(@Body() dto: SubmitEvalRunDto) {
    return this.modelReleaseService.submitForEval(dto);
  }

  @Post('eval/result')
  submitResult(@Body() dto: EvalResultDto) {
    return this.modelReleaseService.submitEvalResult(dto);
  }

  @Post('publish')
  publish(@Body() dto: PublishModelDto, @Req() req: any) {
    return this.modelReleaseService.publish({ releaseId: dto.releaseId, reviewerId: req.admin.adminUserId });
  }

  @Post('rollback')
  rollback(@Body() dto: RollbackModelDto, @Req() req: any) {
    return this.modelReleaseService.rollback({ releaseId: dto.releaseId, operatorId: req.admin.adminUserId });
  }

  @Get(':id/eval-runs')
  getEvalRuns(@Param('id') id: string) {
    return this.modelReleaseService.getEvalRuns(id);
  }
}
