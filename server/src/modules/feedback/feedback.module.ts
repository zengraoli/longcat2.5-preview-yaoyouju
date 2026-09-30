import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminGuardModule } from "../admin/admin-guard.module";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";

@Module({
  imports: [AuthModule, AdminGuardModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
