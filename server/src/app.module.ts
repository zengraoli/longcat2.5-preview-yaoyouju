import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { IdentityDatabaseModule } from './database/identity-database.module';
import { SeedService } from './database/seed.service';
import { EncryptionService } from './database/encryption.service';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, IdentityDatabaseModule],
  controllers: [HealthController],
  providers: [EncryptionService, SeedService],
})
export class AppModule {}
