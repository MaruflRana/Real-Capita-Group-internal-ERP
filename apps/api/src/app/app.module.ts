import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import apiRuntimeConfig from './config/runtime-config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [
        'apps/api/.env.local',
        'apps/api/.env',
        '.env.local',
        '.env',
      ],
      load: [apiRuntimeConfig],
    }),
    HealthModule,
  ],
})
export class AppModule {}
