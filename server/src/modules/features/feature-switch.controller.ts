import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FeatureSwitchService } from './feature-switch.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('features')
export class FeatureSwitchController {
  constructor(private readonly featureSwitchService: FeatureSwitchService) {}

  @Get('switches')
  @UseGuards(AdminAuthGuard)
  getAll() {
    return this.featureSwitchService.getAllSwitches();
  }

  @Get('switch')
  get(@Body() dto: { key: string }) {
    return this.featureSwitchService.getSwitch(dto.key);
  }

  @Post('switch')
  @UseGuards(AdminAuthGuard)
  set(@Body() dto: { key: string; enabled: boolean; reason?: string }, @Req() req: any) {
    this.featureSwitchService.setSwitch(dto.key, dto.enabled, dto.reason, req.admin.adminUserId);
    return { updated: true };
  }
}
