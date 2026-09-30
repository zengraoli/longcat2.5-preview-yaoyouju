import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import crypto from 'node:crypto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { APP_DB } from '../../database/database.module';
import { Inject } from '@nestjs/common';
import Database from 'better-sqlite3';

class SubmitCaseDto {
  @IsString()
  @MaxLength(5000)
  editedContent!: string;

  @IsOptional()
  @IsIn(['发表', '产品改进', '训练'])
  consentScope?: string;
}

/** 案例投稿（二期预留）：用户提交去除第三方信息的案例内容，进入待审队列 */
@Controller('cases')
@UseGuards(AuthGuard)
export class CasesController {
  constructor(@Inject(APP_DB) private readonly appDb: Database.Database) {}

  @Post()
  submit(@CurrentUser() user: { userId: string }, @Body() dto: SubmitCaseDto) {
    const id = crypto.randomUUID();
    this.appDb
      .prepare(
        `INSERT INTO CASE_SUBMISSION (id, user_id, edited_content, consent_scope, status, created_at)
         VALUES (?, ?, ?, ?, '待审', ?)`,
      )
      .run(id, user.userId, dto.editedContent, dto.consentScope ?? null, new Date().toISOString());
    return { id, status: '待审' };
  }

  @Get('mine')
  listMine(@CurrentUser() user: { userId: string }) {
    return this.appDb
      .prepare(
        `SELECT id, edited_content AS editedContent, consent_scope AS consentScope, status, created_at AS createdAt
         FROM CASE_SUBMISSION WHERE user_id = ? ORDER BY created_at DESC, rowid DESC`,
      )
      .all(user.userId);
  }
}
