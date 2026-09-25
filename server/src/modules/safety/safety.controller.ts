import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('check')
  check(@Body() dto: { text: string }) {
    const result = this.safetyService.fullCheck(dto.text);
    return result;
  }

  @Get('rules/version')
  getRuleSetVersion() {
    return { version: this.safetyService.getRuleSetVersion() };
  }
}
