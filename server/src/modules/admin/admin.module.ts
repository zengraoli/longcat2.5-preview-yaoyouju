import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminAuthService } from './admin-auth.service';

@Module({
  controllers: [AdminController, AdminDashboardController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AdminModule {}
