import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { AdminGuard, RequirePermission } from '../admin/admin.guard';
import { CurrentAdmin } from '../admin/current-admin.decorator';
import { SwitchesService } from './switches.service';

class SetSwitchDto {
  @IsIn(['个性化分析', '视频推荐', '拍照提取', '案例卡片'])
  key!: string;

  @IsIn(['true', 'false'])
  enabled!: string;

  @IsString()
  @MaxLength(500)
  reason!: string;
}

@Controller('switches')
export class SwitchesController {
  constructor(private readonly switches: SwitchesService) {}

  /** 开关列表（需登录） */
  @Get()
  @UseGuards(AuthGuard)
  list() {
    return this.switches.list();
  }

  /** 变更开关（需 switch:write 权限，写审计） */
  @Post()
  @UseGuards(AdminGuard)
  @RequirePermission('switch:write')
  set(@CurrentAdmin() admin: { adminId: string }, @Body() dto: SetSwitchDto) {
    return this.switches.set(dto.key, dto.enabled === 'true', dto.reason, admin.adminId);
  }
}
