import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RULESET_VERSION, SAFETY_TIPS } from './rules';
import { SafetyService } from './safety.service';

class CheckDto {
  @IsString()
  @MaxLength(4000)
  text!: string;

  @IsOptional()
  @IsString()
  source?: string;
}

@Controller('safety')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  /** 安全预检（需登录）：返回命中的红旗与越界规则，不写库（纯校验，避免预检污染安全事件） */
  @Post('check')
  @UseGuards(AuthGuard)
  check(@CurrentUser() user: { userId: string }, @Body() dto: CheckDto) {
    return this.safety.check(dto.text);
  }

  /** 就医提示：无需登录、不被任何流程阻断 */
  @Get('tips')
  tips() {
    return {
      title: '出现以下情况请及时就医',
      redFlags: SAFETY_TIPS,
      rulesetVersion: RULESET_VERSION,
      note: '本提示不构成诊断；如症状持续或加重，请前往正规医疗机构就诊。',
    };
  }
}
