import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { FeatureSwitchController } from './feature-switch.controller';
import { FeatureSwitchService } from './feature-switch.service';

@Module({
  imports: [AuditModule],
  controllers: [FeatureSwitchController],
  providers: [FeatureSwitchService],
  exports: [FeatureSwitchService],
})
export class FeatureSwitchModule {}
