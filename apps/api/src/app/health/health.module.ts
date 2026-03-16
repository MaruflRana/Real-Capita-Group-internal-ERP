import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
