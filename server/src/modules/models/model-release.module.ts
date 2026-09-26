import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ModelReleaseController } from './model-release.controller';
import { ModelReleaseService } from './model-release.service';

@Module({
  imports: [AuditModule],
  controllers: [ModelReleaseController],
  providers: [ModelReleaseService],
  exports: [ModelReleaseService],
})
export class ModelReleaseModule {}
