import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminAuthService } from './admin-auth.service';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

/** 要求后台账号具有指定权限（最小必要，不含完整病历）；传多个时任一即可 */
export function RequirePermission(...permissions: string[]) {
  return applyDecorators(
    SetMetadata(REQUIRE_PERMISSION_KEY, permissions),
    UseGuards(AdminGuard),
  );
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers['x-admin-token'] ?? '';
    const session = header ? this.auth.resolveSession(header) : null;
    if (!session) {
      throw new UnauthorizedException('未登录或会话已过期');
    }
    const permission = this.reflector.getAllAndOverride<string | string[]>(REQUIRE_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const required = Array.isArray(permission) ? permission : permission ? [permission] : [];
    if (required.length > 0 && !required.some((p) => session.permissions.includes(p))) {
      // 越权：已登录但无权限，返回 1003（区别于未登录的 1002）
      throw new ForbiddenException('无权限执行该操作');
    }
    req.admin = session;
    return true;
  }
}
