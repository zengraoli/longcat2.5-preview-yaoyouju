import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CasesController } from './cases.controller';

@Module({
  imports: [AuthModule],
  controllers: [CasesController],
})
export class CasesModule {}
