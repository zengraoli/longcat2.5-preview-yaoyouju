import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsIn, IsObject, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FollowupService, SummaryContent } from './followup.service';

class SaveSummaryDto {
  @IsString()
  episodeId!: string;

  @IsObject()
  content!: SummaryContent;
}

class CorrectSummaryDto {
  @IsObject()
  content!: SummaryContent;
}

class ReorderDto {
  @IsArray()
  questions!: string[];
}

class ExportDto {
  @IsIn(['文本', 'PDF', '图片'])
  format!: '文本' | 'PDF' | '图片';
}

@Controller('followup')
@UseGuards(AuthGuard)
export class FollowupController {
  constructor(private readonly followup: FollowupService) {}

  /** 预览（不保存） */
  @Get('summary')
  preview(@CurrentUser() user: { userId: string }, @Query('episodeId') episodeId: string) {
    return this.followup.preview(user.userId, episodeId);
  }

  /** 保存/更新摘要 */
  @Post('summary')
  save(@CurrentUser() user: { userId: string }, @Body() dto: SaveSummaryDto) {
    return this.followup.save(user.userId, dto.episodeId, dto.content);
  }

  /** 纠正摘要 */
  @Put('summary/:id')
  correct(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: CorrectSummaryDto) {
    return this.followup.correct(user.userId, id, dto.content);
  }

  /** 问题清单排序 */
  @Put('summary/:id/questions')
  reorder(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: ReorderDto) {
    return this.followup.reorderQuestions(user.userId, id, dto.questions);
  }

  /** 导出（记录导出时间与格式） */
  @Post('summary/:id/export')
  export(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: ExportDto) {
    return this.followup.export(user.userId, id, dto.format);
  }
}
