import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAuthService } from './admin-auth.service';

@Module({
  controllers: [AdminController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AdminModule {}
