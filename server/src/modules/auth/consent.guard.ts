import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

export const REQUIRE_CONSENT_KEY = 'require_consent';

/** 要求当前用户已单独同意指定范围（如健康信息处理） */
export function RequireConsent(scope: string) {
  return applyDecorators(SetMetadata(REQUIRE_CONSENT_KEY, scope), UseGuards(ConsentGuard));
}

@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const scope = this.reflector.getAllAndOverride<string>(REQUIRE_CONSENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!scope) return true;
    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.userId;
    if (!userId || !this.auth.hasConsent(userId, scope)) {
      throw new ForbiddenException(`未同意「${scope}」，不能使用该功能`);
    }
    return true;
  }
}
