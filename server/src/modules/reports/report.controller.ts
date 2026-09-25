import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ReportService } from './report.service';
import { CreateReportDto, OcrExtractDto, VerifyReportDto } from './dto/report.dto';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  createReport(@Body() dto: CreateReportDto) {
    return this.reportService.createReport(dto);
  }

  @Post('ocr')
  ocrExtract(@Body() dto: OcrExtractDto) {
    return this.reportService.ocrExtract(dto);
  }

  @Get(':id')
  getReport(@Param('id') id: string) {
    return this.reportService.getReport(id);
  }

  @Get(':id/structured')
  getStructuredInfo(@Param('id') id: string) {
    return this.reportService.getStructuredInfo(id);
  }

  @Post(':id/verify')
  verifyReport(@Param('id') id: string, @Body() dto: VerifyReportDto) {
    return this.reportService.verifyReport(id, dto);
  }
}
