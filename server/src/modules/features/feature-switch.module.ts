import { Module } from '@nestjs/common';
import { FeatureSwitchController } from './feature-switch.controller';
import { FeatureSwitchService } from './feature-switch.service';

@Module({
  controllers: [FeatureSwitchController],
  providers: [FeatureSwitchService],
  exports: [FeatureSwitchService],
})
export class FeatureSwitchModule {}
