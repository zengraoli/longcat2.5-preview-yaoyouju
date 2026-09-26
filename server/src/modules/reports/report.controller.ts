import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ReportService } from './report.service';
import { CreateReportDto, OcrExtractDto, VerifyReportDto } from './dto/report.dto';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  createReport(@Req() req: any, @Body() dto: CreateReportDto) {
    return this.reportService.createReport(req.user.userId, dto);
  }

  @Post('ocr')
  ocrExtract(@Req() req: any, @Body() dto: OcrExtractDto) {
    return this.reportService.ocrExtract(req.user.userId, dto);
  }

  @Get()
  listReports(@Query('episodeId') episodeId: string, @Req() req: any) {
    return this.reportService.getReportsByEpisode(episodeId, req.user.userId);
  }

  @Get(':id')
  getReport(@Param('id') id: string, @Req() req: any) {
    return this.reportService.getReport(id, req.user.userId);
  }

  @Get(':id/structured')
  getStructuredInfo(@Param('id') id: string, @Req() req: any) {
    return this.reportService.getStructuredInfo(id, req.user.userId);
  }

  @Post(':id/verify')
  verifyReport(@Param('id') id: string, @Req() req: any, @Body() dto: VerifyReportDto) {
    return this.reportService.verifyReport(id, req.user.userId, dto);
  }
}
