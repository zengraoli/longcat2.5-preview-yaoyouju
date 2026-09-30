import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
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

  /** 登录页勾选的同意范围（如“单独同意：处理我的健康信息”） */
  @IsOptional()
  @IsString({ each: true })
  agreedScopes?: string[];
}

class ConsentDto {
  @IsIn(CONSENT_SCOPES as unknown as string[])
  scope!: ConsentScope;

  /** 只接受 true/false 字符串，避免 "abc" 等被当作撤回 */
  @IsIn(['true', 'false'])
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

  /** 手机号验证码登录（可附带登录页勾选的同意） */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.phone, dto.code, dto.agreedScopes);
  }

  /** 当前用户的同意记录（可查） */
  @Get('consents')
  @UseGuards(AuthGuard)
  getConsents(@CurrentUser() user: { userId: string }) {
    return this.auth.getConsents(user.userId);
  }

  /** 当前用户信息（匿名标识 + 脱敏手机号） */
  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: { userId: string }) {
    return this.auth.me(user.userId);
  }

  /** 单独勾选 / 撤回同意 */
  @Post('consents')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  setConsent(@CurrentUser() user: { userId: string }, @Body() dto: ConsentDto) {
    return this.auth.setConsent(user.userId, dto.scope, dto.granted);
  }

  /** 退出登录（服务端销毁当前会话） */
  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  logout(@Req() req: { headers: Record<string, string> }) {
    const header = req.headers['authorization'] ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) this.auth.logout(token);
    return { loggedOut: true };
  }

  /** 注销账户与数据（不可恢复） */
  @Post('delete')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  deleteAccount(@CurrentUser() user: { userId: string }) {
    this.auth.deleteAccount(user.userId);
    return { deleted: true };
  }
}
