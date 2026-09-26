import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDocDto, ToggleEvidenceDto } from './dto/evidence.dto';

@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get()
  @UseGuards(AdminAuthGuard)
  getAll() {
    return this.evidenceService.getAllDocs();
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.evidenceService.search(q || '');
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  getById(@Param('id') id: string) {
    return this.evidenceService.getDoc(id);
  }

  @Get(':id/deactivation-impact')
  @UseGuards(AdminAuthGuard)
  getDeactivationImpact(@Param('id') id: string) {
    return this.evidenceService.getDeactivationImpact(id);
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() dto: CreateEvidenceDocDto) {
    return this.evidenceService.createDoc(dto);
  }

  @Post('toggle')
  @UseGuards(AdminAuthGuard)
  toggle(@Body() dto: ToggleEvidenceDto) {
    return this.evidenceService.toggleDoc(dto);
  }
}
