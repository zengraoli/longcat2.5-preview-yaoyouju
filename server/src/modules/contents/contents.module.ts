import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';

@Module({
  imports: [AuthModule, AdminModule],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [ContentsService],
})
export class ContentsModule {}
