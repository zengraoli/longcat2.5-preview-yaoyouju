import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ReportsService } from './reports.service';

class CreateReportDto {
  @IsString()
  careEventId!: string;

  @IsOptional()
  @IsISO8601()
  reportDate?: string;

  @IsIn(['自述', '报告原文', '医生记录'])
  sourceType!: string;

  @IsString()
  @MaxLength(20000)
  rawText!: string;
}

class ConfirmReportDto {
  @IsIn(['已确认', '有冲突'])
  verifyStatus!: '已确认' | '有冲突';
}

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** 录入报告（粘贴文字为主） */
  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateReportDto) {
    return this.reports.createReport(user.userId, dto);
  }

  /** 拍照提取：模拟 OCR，返回示例文本 */
  @Post('ocr')
  ocr(@Body() dto: { careEventId: string }) {
    return this.reports.ocr(dto.careEventId);
  }

  @Get(':id')
  detail(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.reports.getReport(user.userId, id);
  }

  /** 结构化核对：来源、时间、核实状态、冲突项 */
  @Get(':id/verify')
  verify(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.reports.verify(user.userId, id);
  }

  /** 用户确认报告（解决冲突项） */
  @Put(':id/confirm')
  confirm(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: ConfirmReportDto,
  ) {
    return this.reports.confirm(user.userId, id, dto.verifyStatus);
  }
}
