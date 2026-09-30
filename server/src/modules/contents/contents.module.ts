import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminGuardModule } from "../admin/admin-guard.module";
import { ContentsController } from "./contents.controller";
import { ContentsService } from "./contents.service";

@Module({
  imports: [AuthModule, AdminGuardModule],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [ContentsService],
})
export class ContentsModule {}
