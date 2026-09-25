import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { IdentityDatabaseModule } from './database/identity-database.module';
import { SeedService } from './database/seed.service';
import { EncryptionService } from './database/encryption.service';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { SafetyModule } from './modules/safety/safety.module';
import { FeatureSwitchModule } from './modules/features/feature-switch.module';
import { EpisodeModule } from './modules/episodes/episode.module';
import { ReportModule } from './modules/reports/report.module';
import { AnalysisModule } from './modules/analyses/analysis.module';
import { QaModule } from './modules/qa/qa.module';
import { FollowupModule } from './modules/followup/followup.module';
import { ContentModule } from './modules/contents/content.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { FeedbackModule } from './modules/feedback/feedback.module';

@Module({
  imports: [ConfigModule, DatabaseModule, IdentityDatabaseModule, AuthModule, SafetyModule, FeatureSwitchModule, EpisodeModule, ReportModule, AnalysisModule, QaModule, FollowupModule, ContentModule, EvidenceModule, FeedbackModule],
  controllers: [HealthController],
  providers: [EncryptionService, SeedService],
})
export class AppModule {}
