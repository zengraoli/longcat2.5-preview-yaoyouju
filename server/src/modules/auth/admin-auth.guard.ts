import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';

/**
 * 后台管理端鉴权：校验 x-admin-token 头，等价于用户端的 AuthGuard。
 */
@Injectable()
export class AdminAuthGuard {
  constructor(private readonly adminService: AdminService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.headers['x-admin-token'];
    if (!token) {
      throw new UnauthorizedException('未登录');
    }
    const session = this.adminService.validateSession(token);
    if (!session) {
      throw new UnauthorizedException('登录已过期');
    }
    request.admin = session;
    return true;
  }
}
