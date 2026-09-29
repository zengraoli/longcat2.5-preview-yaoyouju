import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { EvidenceService } from './evidence.service';

class CreateDocDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsIn(['指南', '研究', '审核科普'])
  sourceType!: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsString()
  verifiedAt?: string;

  @IsString()
  @MaxLength(50000)
  content!: string;
}

@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  /** 证据文档列表 */
  @Get('docs')
  list() {
    return this.evidence.list();
  }

  /** 切分入库管线状态 */
  @Get('pipeline')
  pipeline() {
    return this.evidence.pipelineStatus();
  }

  /** 本地检索（只检索启用证据） */
  @Get('search')
  search(@Query('q') q: string) {
    return this.evidence.search(q ?? '');
  }

  /** 创建证据文档（自动切分入库） */
  @Post('docs')
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateDocDto) {
    return this.evidence.create(user.userId, dto);
  }

  /** 停用影响预览 */
  @Get('docs/:id/impact')
  impact(@Param('id') id: string) {
    return this.evidence.impactPreview(id);
  }

  /** 停用证据 */
  @Post('docs/:id/deactivate')
  @UseGuards(AuthGuard)
  deactivate(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.evidence.deactivate(user.userId, id);
  }
}
