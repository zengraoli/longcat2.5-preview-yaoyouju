import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/analysis.dto';

@Controller('analyses')
@UseGuards(AuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  createAnalysis(@Req() req: any, @Body() dto: CreateAnalysisDto) {
    return this.analysisService.createAnalysis(req.user.userId, dto);
  }

  @Get(':id')
  getAnalysis(@Param('id') id: string) {
    return this.analysisService.getAnalysis(id);
  }
}
