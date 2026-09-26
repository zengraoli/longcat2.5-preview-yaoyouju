import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminService } from '../admin/admin.service';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDocDto, ToggleEvidenceDto } from './dto/evidence.dto';

@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService, private readonly adminService: AdminService) {}

  private requirePerm(req: any, perm: string) {
    this.adminService.requirePermission(req.admin.roleId, perm);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  getAll(@Req() req: any) {
    this.requirePerm(req, 'evidence:read');
    return this.evidenceService.getAllDocs();
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.evidenceService.search(q || '');
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  getById(@Param('id') id: string, @Req() req: any) {
    this.requirePerm(req, 'evidence:read');
    return this.evidenceService.getDoc(id);
  }

  @Get(':id/deactivation-impact')
  @UseGuards(AdminAuthGuard)
  getDeactivationImpact(@Param('id') id: string, @Req() req: any) {
    this.requirePerm(req, 'evidence:read');
    return this.evidenceService.getDeactivationImpact(id);
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() dto: CreateEvidenceDocDto, @Req() req: any) {
    this.requirePerm(req, 'evidence:create');
    return this.evidenceService.createDoc(dto);
  }

  @Post('toggle')
  @UseGuards(AdminAuthGuard)
  toggle(@Body() dto: ToggleEvidenceDto, @Req() req: any) {
    this.requirePerm(req, 'evidence:offline');
    return this.evidenceService.toggleDoc(dto);
  }
}
