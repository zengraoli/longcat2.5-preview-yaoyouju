import { Body, Controller, Get, Post, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { FeatureSwitchService } from './feature-switch.service';
import { getDb } from '../../database/database.module';

function getRolePermissions(roleId: string): string[] {
  const role = getDb().prepare('SELECT * FROM role WHERE id = ?').get(roleId) as any | undefined;
  return role ? JSON.parse(role.permissions) : [];
}
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
    const permissions = getRolePermissions(roleId);
    // 高危开关（如个性化分析总开关）仅技术负责人与超级管理员；其余角色可发起非高危开关的申请
    const HIGH_RISK = ['personalized_analysis'];
    if (!permissions.includes('*') && !permissions.includes('feature:toggle')) {
      if (!permissions.includes('feature:toggle:limited') || HIGH_RISK.includes(dto.key)) {
        throw new ForbiddenException('无权限');
      }
    }
    this.featureSwitchService.setSwitch(dto.key, dto.enabled, dto.reason, req.admin.adminUserId);
    return { updated: true };
  }
}
