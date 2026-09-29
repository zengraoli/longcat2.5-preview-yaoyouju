import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
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

  /** 管理端：全部内容 */
  @Get()
  @UseGuards(AuthGuard)
  listAll(@CurrentUser() _user: { userId: string }) {
    return this.contents.listAll();
  }

  /** 管理端：创建内容（草稿） */
  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateItemDto) {
    return this.contents.createItem(user.userId, dto);
  }

  /** 管理端：状态机流转 */
  @Post(':id/transition')
  @UseGuards(AuthGuard)
  transition(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: TransitionDto,
  ) {
    return this.contents.transitionItem(user.userId, id, dto.action, dto.comment);
  }

  /** 管理端：发布（双人确认） */
  @Post(':id/publish')
  @UseGuards(AuthGuard)
  publish(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.contents.publish(user.userId, id);
  }

  /** 管理端：一键下线并定位引用页面 */
  @Post(':id/offline')
  @UseGuards(AuthGuard)
  offline(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.contents.offline(user.userId, id);
  }

  /** 审核记录 */
  @Get(':id/reviews')
  @UseGuards(AuthGuard)
  reviews(@Param('id') id: string) {
    return this.contents.reviewRecords(id);
  }

  /** 版本链 */
  @Get(':id/versions')
  @UseGuards(AuthGuard)
  versions(@Param('id') id: string) {
    return this.contents.versions(id);
  }
}
