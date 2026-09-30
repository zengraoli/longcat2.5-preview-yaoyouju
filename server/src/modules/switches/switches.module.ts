import { Global, Module } from "@nestjs/common";
import { AdminGuardModule } from "../admin/admin-guard.module";
import { SwitchesController } from "./switches.controller";
import { SwitchesService } from "./switches.service";

@Global()
@Module({
  imports: [AdminGuardModule],
  controllers: [SwitchesController],
  providers: [SwitchesService],
  exports: [SwitchesService],
})
export class SwitchesModule {}
