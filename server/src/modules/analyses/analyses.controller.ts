import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
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

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  safetyText?: string;
}

@Controller('analyses')
@UseGuards(AuthGuard, ConsentGuard)
export class AnalysesController {
  constructor(
    private readonly analyses: AnalysesService,
    private readonly switches: SwitchesService,
  ) {}

  /** 提交分析：安全校验 → 开关检查 → 入队，返回 202 与任务 ID（附安全提示） */
  @Post()
  @RequireConsent('健康信息处理')
  @HttpCode(202)
  async create(@CurrentUser() user: { userId: string }, @Body() dto: CreateAnalysisDto) {
    if (!this.switches.isOn('个性化分析')) {
      return this.analyses.fallback('个性化分析功能已暂时关闭，请稍后再试');
    }
    return this.analyses.enqueue(user.userId, dto.episodeId, dto.context ?? {}, dto.safetyText);
  }

  /** 查询分析结果或任务状态 */
  @Get(':id')
  get(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.analyses.getAnalysis(user.userId, id);
  }
}
