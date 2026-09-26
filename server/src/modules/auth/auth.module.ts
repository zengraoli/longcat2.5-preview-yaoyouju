import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AdminAuthGuard } from './admin-auth.guard';
import { EncryptionService } from '../../database/encryption.service';
import { AdminModule } from '../admin/admin.module';

@Global()
@Module({
  imports: [AdminModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AdminAuthGuard, EncryptionService],
  exports: [AuthService, AuthGuard, AdminAuthGuard],
})
export class AuthModule {}
