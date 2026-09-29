import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
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

  /** 安全预检（需登录）：返回命中的红旗与越界规则，不写库 */
  @Post('check')
  @UseGuards(AuthGuard)
  check(@CurrentUser() user: { userId: string }, @Body() dto: CheckDto) {
    return this.safety.checkAndRecord(user.userId, dto.source ?? 'safety-check', dto.text);
  }

  /** 就医提示：无需登录、不被任何流程阻断 */
  @Get('tips')
  tips() {
    return {
      title: '出现以下情况请及时就医',
      redFlags: [
        '大小便功能异常或鞍区麻木',
        '进行性下肢肌力下降',
        '夜间痛醒伴体重明显下降',
        '外伤后腰部剧痛',
        '发热伴腰痛',
      ],
      note: '本提示不构成诊断；如症状持续或加重，请前往正规医疗机构就诊。',
    };
  }
}
