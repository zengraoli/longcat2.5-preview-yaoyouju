import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { SafetyModule } from '../safety/safety.module';
import { FeatureSwitchModule } from '../features/feature-switch.module';

@Module({
  imports: [SafetyModule, FeatureSwitchModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
