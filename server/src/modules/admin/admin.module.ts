import { Module } from '@nestjs/common';
import { FeedbackModule } from '../feedback/feedback.module';
import { AdminController } from './admin.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminGuardModule } from './admin-guard.module';

@Module({
  imports: [AdminGuardModule, FeedbackModule],
  controllers: [AdminController, AdminDashboardController],
})
export class AdminModule {}
