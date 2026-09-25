import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { IdentityDatabaseModule } from './database/identity-database.module';
import { SeedService } from './database/seed.service';
import { EncryptionService } from './database/encryption.service';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConfigModule, DatabaseModule, IdentityDatabaseModule, AuthModule],
  controllers: [HealthController],
  providers: [EncryptionService, SeedService],
})
export class AppModule {}
