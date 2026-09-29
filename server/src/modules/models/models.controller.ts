import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
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
@UseGuards(AuthGuard)
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  /** 发布组合列表 */
  @Get('releases')
  listReleases(@CurrentUser() _user: { userId: string }) {
    return this.models.listReleases();
  }

  /** 评测集列表 */
  @Get('eval-sets')
  listEvalSets(@CurrentUser() _user: { userId: string }) {
    return this.models.listEvalSets();
  }

  /** 创建发布组合（候选） */
  @Post('releases')
  createRelease(@CurrentUser() user: { userId: string }, @Body() dto: CreateReleaseDto) {
    return this.models.createRelease(user.userId, dto);
  }

  /** 运行评测 */
  @Post('releases/:id/eval')
  runEval(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.models.runEval(user.userId, id);
  }

  /** 评测运行记录 */
  @Get('releases/:id/eval-runs')
  listEvalRuns(@CurrentUser() _user: { userId: string }, @Param('id') id: string) {
    return this.models.listEvalRuns(id);
  }

  /** 发布（候选 → 评测门禁 → 灰度 → 生效） */
  @Post('releases/:id/publish')
  publish(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.models.publish(user.userId, id);
  }

  /** 回滚 */
  @Post('releases/:id/rollback')
  rollback(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.models.rollback(user.userId, id);
  }
}
