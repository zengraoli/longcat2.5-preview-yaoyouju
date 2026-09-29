import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

/** 登录态校验：Authorization: Bearer <token> */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers['authorization'] ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const userId = token ? this.auth.resolveSession(token) : null;
    if (!userId) {
      throw new UnauthorizedException('未登录或会话已过期');
    }
    req.user = { userId };
    return true;
  }
}
