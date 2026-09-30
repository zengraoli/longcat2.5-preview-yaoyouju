import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  /** 开关列表（需后台登录） */
  @Get()
  @UseGuards(AdminGuard)
  list() {
    return this.switches.list();
  }

  /** 变更开关（高危开关需双人确认：技术负责人发起，临床审核 / 超管确认） */
  @Post()
  @UseGuards(AdminGuard)
  set(@CurrentAdmin() admin: { adminId: string; permissions: string[] }, @Body() dto: SetSwitchDto) {
    return this.switches.set(dto.key, dto.enabled === 'true', dto.reason, admin.adminId, admin.permissions);
  }
}
