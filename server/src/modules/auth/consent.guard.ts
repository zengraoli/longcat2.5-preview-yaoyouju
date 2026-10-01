import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { ERR } from '../../common/utils/business-exception';

export const REQUIRE_CONSENT_KEY = 'require_consent';

/** 标记接口需要的同意范围（配合控制器上的 ConsentGuard 使用） */
export function RequireConsent(scope: string) {
  return applyDecorators(SetMetadata(REQUIRE_CONSENT_KEY, scope));
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
      // 必须用业务码 2002（同意记录缺失），客户端才能区分“需要重新同意”与普通无权限
      throw ERR.CONSENT_MISSING(`未同意「${scope}」，不能使用该功能`);
    }
    return true;
  }
}
