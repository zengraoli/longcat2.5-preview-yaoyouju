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

@Module({
  imports: [ConfigModule, DatabaseModule, IdentityDatabaseModule, AuthModule, SafetyModule, FeatureSwitchModule],
  controllers: [HealthController],
  providers: [EncryptionService, SeedService],
})
export class AppModule {}
