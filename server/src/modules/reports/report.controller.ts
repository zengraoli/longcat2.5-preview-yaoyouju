import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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

  @Get()
  listReports(@Query('episodeId') episodeId: string, @Req() req: any) {
    return this.reportService.getReportsByEpisode(episodeId, req.user.userId);
  }

  @Get(':id')
  getReport(@Param('id') id: string) {
    return this.reportService.getReport(id);
  }

  @Get(':id/structured')
  getStructuredInfo(@Param('id') id: string, @Req() req: any) {
    return this.reportService.getStructuredInfo(id, req.user.userId);
  }

  @Post(':id/verify')
  verifyReport(@Param('id') id: string, @Body() dto: VerifyReportDto) {
    return this.reportService.verifyReport(id, dto);
  }
}
