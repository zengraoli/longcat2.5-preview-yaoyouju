import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentAdmin } from '../admin/current-admin.decorator';

import { ContentsService } from './contents.service';
import { ContentAction } from './state-machine';

class CreateItemDto {
  @IsIn(['视频', '图文组件'])
  type!: string;

  @IsString()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  applicableScope?: string;

  @IsOptional()
  @IsString()
  notApplicable?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  script?: string;

  @IsOptional()
  @IsString()
  subtitleText?: string;
}

class TransitionDto {
  @IsIn(['提交审核', '通过', '退回', '发布', '撤回', '下线', '更正'])
  action!: ContentAction;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

class BatchOfflineDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  itemIds!: string[];
}

@Controller('contents')
export class ContentsController {
  constructor(private readonly contents: ContentsService) {}

  /** 用户端：只能看到已发布内容 */
  @Get('published')
  listPublished() {
    return this.contents.listPublished();
  }

  /** 推荐理由 */
  @Get('recommended')
  recommended() {
    return this.contents.recommend(null);
  }

  /** 用户端：内容详情（含脚本、字幕、审核记录、版本） */
  @Get('published/:id')
  publishedDetail(@Param('id') id: string) {
    return this.contents.publishedDetail(id);
  }

  /** 管理端：全部内容 */
  @Get()
  @UseGuards(AdminGuard)
  listAll() {
    return this.contents.listAll();
  }

  /** 管理端：创建内容（草稿） */
  @Post()
  @UseGuards(AdminGuard)
  create(@CurrentAdmin() admin: { adminId: string }, @Body() dto: CreateItemDto) {
    return this.contents.createItem(admin.adminId, dto);
  }

  /** 管理端：编辑内容（草稿/更正中可编辑） */
  @Put(':id')
  @UseGuards(AdminGuard)
  update(
    @CurrentAdmin() admin: { adminId: string },
    @Param('id') id: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.contents.updateItem(admin.adminId, id, dto);
  }

  /** 管理端：状态机流转 */
  @Post(':id/transition')
  @UseGuards(AdminGuard)
  transition(
    @CurrentAdmin() admin: { adminId: string },
    @Param('id') id: string,
    @Body() dto: TransitionDto,
  ) {
    return this.contents.transitionItem(admin.adminId, id, dto.action, dto.comment);
  }

  /** 管理端：发布（双人确认） */
  @Post(':id/publish')
  @UseGuards(AdminGuard)
  publish(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.contents.publish(admin.adminId, id);
  }

  /** 管理端：一键下线并定位引用页面 */
  @Post(':id/offline')
  @UseGuards(AdminGuard)
  offline(@CurrentAdmin() admin: { adminId: string }, @Param('id') id: string) {
    return this.contents.offline(admin.adminId, id);
  }

  /** 管理端：批量下线（双人确认） */
  @Post('batch-offline')
  @UseGuards(AdminGuard)
  batchOffline(@CurrentAdmin() admin: { adminId: string }, @Body() dto: BatchOfflineDto) {
    return this.contents.batchOffline(admin.adminId, dto.itemIds);
  }

  /** 审核记录 */
  @Get(':id/reviews')
  @UseGuards(AdminGuard)
  reviews(@Param('id') id: string) {
    return this.contents.reviewRecords(id);
  }

  /** 版本链 */
  @Get(':id/versions')
  @UseGuards(AdminGuard)
  versions(@Param('id') id: string) {
    return this.contents.versions(id);
  }
}
