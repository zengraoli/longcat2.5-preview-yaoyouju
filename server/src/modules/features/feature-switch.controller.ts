import { Controller, Get, Post, Body } from '@nestjs/common';
import { FeatureSwitchService } from './feature-switch.service';

@Controller('features')
export class FeatureSwitchController {
  constructor(private readonly featureSwitchService: FeatureSwitchService) {}

  @Get('switches')
  getAll() {
    return this.featureSwitchService.getAllSwitches();
  }

  @Get('switch')
  get(@Body() dto: { key: string }) {
    return this.featureSwitchService.getSwitch(dto.key);
  }

  @Post('switch')
  set(@Body() dto: { key: string; enabled: boolean; reason?: string }) {
    this.featureSwitchService.setSwitch(dto.key, dto.enabled, dto.reason);
    return { updated: true };
  }
}
