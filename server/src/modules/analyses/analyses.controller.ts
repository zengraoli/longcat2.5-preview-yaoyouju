import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { ConsentGuard, RequireConsent } from '../auth/consent.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SwitchesService } from '../switches/switches.service';
import { AnalysesService } from './analyses.service';

class CreateAnalysisDto {
  @IsString()
  episodeId!: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

@Controller('analyses')
@UseGuards(AuthGuard, ConsentGuard)
export class AnalysesController {
  constructor(
    private readonly analyses: AnalysesService,
    private readonly switches: SwitchesService,
  ) {}

  /** 提交分析：先检查功能开关，关闭时返回回退结果 */
  @Post()
  @RequireConsent('健康信息处理')
  @HttpCode(202)
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateAnalysisDto) {
    if (!this.switches.isOn('个性化分析')) {
      return this.analyses.fallback('个性化分析功能已暂时关闭，请稍后再试');
    }
    return this.analyses.enqueue(user.userId, dto.episodeId, dto.context ?? {});
  }

  /** 查询分析任务状态 */
  @Get('tasks/:id')
  @UseGuards(AuthGuard)
  task(@Param('id') id: string) {
    return this.analyses.getTask(id);
  }
}
