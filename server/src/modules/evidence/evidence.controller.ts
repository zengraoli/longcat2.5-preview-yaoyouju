import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminGuard, RequirePermission } from '../admin/admin.guard';
import { CurrentAdmin } from '../admin/current-admin.decorator';
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
@UseGuards(AdminGuard)
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  /** 证据文档列表 */
  @Get('docs')
  @RequirePermission('evidence:review')
  list() {
    return this.evidence.list();
  }

  /** 切分入库管线状态 */
  @Get('pipeline')
  @RequirePermission('evidence:review')
  pipeline() {
    return this.evidence.pipelineStatus();
  }

  /** 本地检索（只检索启用证据） */
  @Get('search')
  @RequirePermission('evidence:review')
  search(@Query('q') q: string) {
    return this.evidence.search(q ?? '');
  }

  /** 创建证据文档（自动切分入库） */
  @Post('docs')
  @RequirePermission('evidence:review')
  create(@CurrentAdmin() admin: { adminId: string }, @Body() dto: CreateDocDto) {
    return this.evidence.create(admin.adminId, dto);
  }

  /** 停用影响预览 */
  @Get('docs/:id/impact')
  @RequirePermission('evidence:review')
  impact(@Param('id') id: string) {
    return this.evidence.impactPreview(id);
  }

  /** 停用证据 */
  @Post('docs/:id/deactivate')
  @RequirePermission('evidence:review')
  deactivate(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.evidence.deactivate(admin.adminId, id);
  }
}
