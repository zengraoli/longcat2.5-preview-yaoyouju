import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('未登录');
    }
    const result = this.authService.validateToken(token);
    if (!result) {
      throw new UnauthorizedException('登录已过期');
    }
    request.user = result;
    return true;
  }
}
