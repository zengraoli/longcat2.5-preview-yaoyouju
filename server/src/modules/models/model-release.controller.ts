import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
  publish(@Body() dto: PublishModelDto) {
    return this.modelReleaseService.publish(dto);
  }

  @Post('rollback')
  rollback(@Body() dto: RollbackModelDto) {
    return this.modelReleaseService.rollback(dto);
  }

  @Get(':id/eval-runs')
  getEvalRuns(@Param('id') id: string) {
    return this.modelReleaseService.getEvalRuns(id);
  }
}
