import { Module } from '@nestjs/common';
import { FeedbackModule } from '../feedback/feedback.module';
import { AdminController } from './admin.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [FeedbackModule],
  controllers: [AdminController, AdminDashboardController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AdminModule {}
