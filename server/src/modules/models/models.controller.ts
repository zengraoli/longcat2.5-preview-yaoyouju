import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { AdminGuard, RequirePermission } from '../admin/admin.guard';
import { CurrentAdmin } from '../admin/current-admin.decorator';
import { ModelsService } from './models.service';

class CreateReleaseDto {
  @IsString()
  @MaxLength(100)
  modelName!: string;

  @IsString()
  @MaxLength(100)
  promptVersion!: string;

  @IsString()
  @MaxLength(100)
  retrievalStrategy!: string;

  @IsString()
  @MaxLength(100)
  contentLibVersion!: string;
}

@Controller('models')
@UseGuards(AdminGuard)
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  /** 发布组合列表 */
  @Get('releases')
  @RequirePermission('model:release')
  listReleases() {
    return this.models.listReleases();
  }

  /** 评测集列表 */
  @Get('eval-sets')
  @RequirePermission('eval:run')
  listEvalSets() {
    return this.models.listEvalSets();
  }

  /** 创建发布组合（候选） */
  @Post('releases')
  @RequirePermission('model:release')
  createRelease(@CurrentAdmin() admin: { adminId: string }, @Body() dto: CreateReleaseDto) {
    return this.models.createRelease(admin.adminId, dto);
  }

  /** 运行评测 */
  @Post('releases/:id/eval')
  @RequirePermission('eval:run')
  runEval(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.models.runEval(admin.adminId, id);
  }

  /** 评测运行记录 */
  @Get('releases/:id/eval-runs')
  @RequirePermission('eval:run')
  listEvalRuns(@Param('id') id: string) {
    return this.models.listEvalRuns(id);
  }

  /** 发布（候选 → 评测门禁 → 灰度 → 生效） */
  @Post('releases/:id/publish')
  @RequirePermission('model:release')
  publish(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.models.publish(admin.adminId, id);
  }

  /** 回滚 */
  @Post('releases/:id/rollback')
  @RequirePermission('model:release')
  rollback(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.models.rollback(admin.adminId, id);
  }
}
