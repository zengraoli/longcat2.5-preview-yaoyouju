import { Module } from "@nestjs/common";
import { AdminGuardModule } from "../admin/admin-guard.module";
import { ModelsController } from "./models.controller";
import { ModelsService } from "./models.service";

@Module({
  imports: [AdminGuardModule],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
