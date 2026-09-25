import { Module } from '@nestjs/common';
import { ModelReleaseController } from './model-release.controller';
import { ModelReleaseService } from './model-release.service';

@Module({
  controllers: [ModelReleaseController],
  providers: [ModelReleaseService],
  exports: [ModelReleaseService],
})
export class ModelReleaseModule {}
