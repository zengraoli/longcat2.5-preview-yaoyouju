import { Body, Controller, Get, Post, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { FeatureSwitchService } from './feature-switch.service';
import { getDb } from '../../database/database.module';
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
    const roleId = req.admin.roleId;
    const role = getDb().prepare('SELECT * FROM role WHERE id = ?').get(roleId) as any | undefined;
    const permissions = role ? JSON.parse(role.permissions) : [];
    if (!permissions.includes('*') && !permissions.includes('feature:toggle')) {
      throw new ForbiddenException('无权限');
    }
    this.featureSwitchService.setSwitch(dto.key, dto.enabled, dto.reason, req.admin.adminUserId);
    return { updated: true };
  }
}
