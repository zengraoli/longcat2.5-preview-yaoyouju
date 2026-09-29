import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsString, Matches } from 'class-validator';
import { AuthService, CONSENT_SCOPES, ConsentScope } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';

class SmsCodeDto {
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone!: string;
}

class LoginDto {
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone!: string;

  @IsString()
  code!: string;
}

class ConsentDto {
  @IsIn(CONSENT_SCOPES as unknown as string[])
  scope!: ConsentScope;

  @IsString()
  granted!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 发送短信验证码（演示固定 123456） */
  @Post('sms-code')
  @HttpCode(200)
  sendSmsCode(@Body() dto: SmsCodeDto) {
    return this.auth.sendSmsCode(dto.phone);
  }

  /** 手机号验证码登录 */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.phone, dto.code);
  }

  /** 当前用户的同意记录（可查） */
  @Get('consents')
  @UseGuards(AuthGuard)
  getConsents(@CurrentUser() user: { userId: string }) {
    return this.auth.getConsents(user.userId);
  }

  /** 单独勾选 / 撤回同意 */
  @Post('consents')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  setConsent(@CurrentUser() user: { userId: string }, @Body() dto: ConsentDto) {
    return this.auth.setConsent(user.userId, dto.scope, dto.granted === 'true');
  }
}
