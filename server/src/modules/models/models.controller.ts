import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsInt, IsString, MaxLength, Min } from 'class-validator';
import { AdminGuard, RequirePermission } from '../admin/admin.guard';
import { CurrentAdmin } from '../admin/current-admin.decorator';
import { ModelsService } from './models.service';

class CreateEvalSetDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(1)
  caseCount!: number;
}

class ImportCasesDto {
  @IsString()
  content!: string;
}

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

  /** 发布组合列表（模型读取权限） */
  @Get('releases')
  @RequirePermission('model:read')
  listReleases() {
    return this.models.listReleases();
  }

  /** 评测集列表（评测读取权限） */
  @Get('eval-sets')
  @RequirePermission('eval:read')
  listEvalSets() {
    return this.models.listEvalSets();
  }

  /** 新建评测集 */
  @Post('eval-sets')
  @RequirePermission('eval:run')
  createEvalSet(@CurrentAdmin() admin: { adminId: string }, @Body() dto: CreateEvalSetDto) {
    return this.models.createEvalSet(admin.adminId, dto);
  }

  /** 评测集的运行记录 */
  @Get('eval-sets/:id/runs')
  @RequirePermission('eval:read')
  listEvalSetRuns(@Param('id') id: string) {
    return this.models.listEvalSetRuns(id);
  }

  /** 全部运行记录（最近） */
  @Get('eval-runs')
  @RequirePermission('eval:read')
  listAllEvalRuns() {
    return this.models.listAllEvalRuns();
  }

  /** 导入用例（去标识化） */
  @Post('eval-sets/:id/cases')
  @RequirePermission('eval:run')
  importCases(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string, @Body() dto: ImportCasesDto) {
    return this.models.importCases(admin.adminId, id, dto.content);
  }

  /** 评测集用例（可按结果过滤） */
  @Get('eval-sets/:id/cases')
  @RequirePermission('eval:read')
  listCases(@Param('id') id: string, @Query('result') result: string) {
    return this.models.listCases(id, result);
  }

  /** 标记用例已修复并重跑该评测集 */
  @Post('eval-cases/:caseId/fix')
  @RequirePermission('eval:run')
  fixCase(@CurrentAdmin() admin: { adminId: string }, @Param('caseId') caseId: string) {
    return this.models.fixCase(admin.adminId, caseId);
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

  /** 评测运行记录（评测读取权限） */
  @Get('releases/:id/eval-runs')
  @RequirePermission('eval:read')
  listEvalRuns(@Param('id') id: string) {
    return this.models.listEvalRuns(id);
  }

  /** 发布（候选 → 评测门禁 → 灰度 → 生效；双人确认） */
  @Post('releases/:id/publish')
  @RequirePermission('model:release')
  publish(@CurrentAdmin() admin: { adminId: string; permissions: string[] }, @Param('id') id: string) {
    return this.models.publish(admin.adminId, id, admin.permissions);
  }

  /** 回滚（双人确认） */
  @Post('releases/:id/rollback')
  @RequirePermission('model:release')
  rollback(@CurrentAdmin() admin: { adminId: string; permissions: string[] }, @Param('id') id: string) {
    return this.models.rollback(admin.adminId, id, admin.permissions);
  }
}
