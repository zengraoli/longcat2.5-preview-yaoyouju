import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { SendCodeDto, LoginDto, ConsentDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body() dto: SendCodeDto) {
    this.authService.sendCode(dto.phone);
    return { sent: true };
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.phone, dto.code);
  }

  @Get('consent')
  @UseGuards(AuthGuard)
  getConsent(@Req() req: any) {
    return this.authService.getConsentStatus(req.user.userId);
  }

  @Post('consent')
  @UseGuards(AuthGuard)
  grantConsent(@Req() req: any, @Body() dto: ConsentDto) {
    this.authService.grantConsent(req.user.userId, dto.scopes);
    return { granted: true };
  }

  @Post('consent/revoke')
  @UseGuards(AuthGuard)
  revokeConsent(@Req() req: any, @Body() dto: { scope: string }) {
    this.authService.revokeConsent(req.user.userId, dto.scope);
    return { revoked: true };
  }
}
