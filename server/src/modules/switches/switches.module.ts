import { Global, Module } from '@nestjs/common';
import { SwitchesService } from './switches.service';

@Global()
@Module({
  providers: [SwitchesService],
  exports: [SwitchesService],
})
export class SwitchesModule {}
