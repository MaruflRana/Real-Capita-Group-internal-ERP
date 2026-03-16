import {
  MiddlewareConsumer,
  Module,
  RequestMethod,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import storageConfig from './config/storage.config';
import { validateEnvironment } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { StorageModule } from './storage/storage.module';

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
      validate: validateEnvironment,
      load: [appConfig, authConfig, databaseConfig, storageConfig],
    }),
    DatabaseModule,
    StorageModule,
    HealthModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
