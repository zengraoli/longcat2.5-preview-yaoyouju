import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FollowupController } from './followup.controller';
import { FollowupService } from './followup.service';

@Module({
  imports: [AuthModule],
  controllers: [FollowupController],
  providers: [FollowupService],
  exports: [FollowupService],
})
export class FollowupModule {}
