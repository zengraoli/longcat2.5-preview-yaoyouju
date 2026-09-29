import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentsModule } from './modules/contents/contents.module';
import { EpisodesModule } from './modules/episodes/episodes.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { HealthController } from './modules/health/health.controller';
import { ModelsModule } from './modules/models/models.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SafetyModule } from './modules/safety/safety.module';
import { SwitchesModule } from './modules/switches/switches.module';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    AuthModule,
    EpisodesModule,
    ReportsModule,
    AnalysesModule,
    SafetyModule,
    ContentsModule,
    EvidenceModule,
    FeedbackModule,
    ModelsModule,
    AdminModule,
    SwitchesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
