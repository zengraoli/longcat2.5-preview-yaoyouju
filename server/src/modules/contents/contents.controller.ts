import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminGuard, RequirePermission } from '../admin/admin.guard';
import { CurrentAdmin, CurrentAdminInfo } from '../admin/current-admin.decorator';

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
  @IsIn(['提交审核', '通过', '退回', '撤回', '下线', '更正'])
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

  /** 用户端：提交内容复述（检验理解，保存记录） */
  @Post('published/:id/retell')
  @UseGuards(AuthGuard)
  retell(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() body: { text?: string }) {
    return this.contents.saveRetell(user.userId, id, body.text ?? '');
  }

  /** 管理端：全部内容（需 content:read） */
  @Get()
  @UseGuards(AdminGuard)
  @RequirePermission('content:read')
  listAll() {
    return this.contents.listAll();
  }

  /** 管理端：创建内容（草稿） */
  @Post()
  @UseGuards(AdminGuard)
  @RequirePermission('content:edit')
  create(@CurrentAdmin() admin: { adminId: string }, @Body() dto: CreateItemDto) {
    return this.contents.createItem(admin.adminId, dto);
  }

  /** 管理端：编辑内容（草稿/更正中可编辑） */
  @Put(':id')
  @UseGuards(AdminGuard)
  @RequirePermission('content:edit')
  update(
    @CurrentAdmin() admin: { adminId: string },
    @Param('id') id: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.contents.updateItem(admin.adminId, id, dto);
  }

  /** 管理端：状态机流转（发布/撤回/下线/更正需双人确认） */
  @Post(':id/transition')
  @UseGuards(AdminGuard)
  transition(
    @CurrentAdmin() admin: CurrentAdminInfo,
    @Param('id') id: string,
    @Body() dto: TransitionDto,
  ) {
    return this.contents.transitionItem(admin.adminId, id, dto.action, dto.comment, admin.permissions);
  }

  /** 管理端：发布（双人确认：运营发起 + 临床/超管确认） */
  @Post(':id/publish')
  @UseGuards(AdminGuard)
  publish(@CurrentAdmin() admin: CurrentAdminInfo, @Param('id') id: string) {
    return this.contents.publish(admin.adminId, id, admin.permissions);
  }

  /** 管理端：一键下线并定位引用页面（双人确认） */
  @Post(':id/offline')
  @UseGuards(AdminGuard)
  offline(@CurrentAdmin() admin: CurrentAdminInfo, @Param('id') id: string) {
    return this.contents.offline(admin.adminId, id, admin.permissions);
  }

  /** 管理端：取消下线（应急下线开关复位） */
  @Post(':id/restore')
  @UseGuards(AdminGuard)
  restore(@CurrentAdmin() admin: CurrentAdminInfo, @Param('id') id: string) {
    return this.contents.restore(admin.adminId, id, admin.permissions);
  }

  /** 管理端：下线开关（应急隐藏 / 恢复，不改变审核状态） */
  @Post(':id/offline-switch')
  @UseGuards(AdminGuard)
  setOfflineSwitch(@CurrentAdmin() admin: CurrentAdminInfo, @Param('id') id: string, @Body() body: { offline: boolean }) {
    return this.contents.setOfflineSwitch(admin.adminId, id, !!body.offline, admin.permissions);
  }

  /** 管理端：批量下线（双人确认） */
  @Post('batch-offline')
  @UseGuards(AdminGuard)
  batchOffline(@CurrentAdmin() admin: CurrentAdminInfo, @Body() dto: BatchOfflineDto) {
    return this.contents.batchOffline(admin.adminId, dto.itemIds, admin.permissions);
  }

  /** 审核记录（content:read 即可查看） */
  @Get(':id/reviews')
  @UseGuards(AdminGuard)
  @RequirePermission('content:read')
  reviews(@Param('id') id: string) {
    return this.contents.reviewRecords(id);
  }

  /** 版本链 */
  @Get(':id/versions')
  @UseGuards(AdminGuard)
  @RequirePermission('content:read')
  versions(@Param('id') id: string) {
    return this.contents.versions(id);
  }
}
