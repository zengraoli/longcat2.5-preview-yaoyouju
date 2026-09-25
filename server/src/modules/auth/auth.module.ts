import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { EncryptionService } from '../../database/encryption.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, EncryptionService],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
