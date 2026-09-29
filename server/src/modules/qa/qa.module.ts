import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EvidenceRetrieval } from '../../ai/retrieval';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
  imports: [AuthModule],
  controllers: [QaController],
  providers: [QaService, EvidenceRetrieval],
  exports: [QaService],
})
export class QaModule {}
