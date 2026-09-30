import { Module } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard } from './admin.guard';

/** 后台认证模块：提供 AdminGuard 与 AdminAuthService，供需要后台认证的模块导入 */
@Module({
  providers: [AdminAuthService, AdminGuard],
  exports: [AdminAuthService, AdminGuard],
})
export class AdminGuardModule {}
