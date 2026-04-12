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
import { AttachmentsModule } from './attachments/attachments.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { CompaniesModule } from './companies/companies.module';
import { ChartOfAccountsModule } from './chart-of-accounts/chart-of-accounts.module';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import storageConfig from './config/storage.config';
import { validateEnvironment } from './config/env.validation';
import { CrmPropertyDeskModule } from './crm-property-desk/crm-property-desk.module';
import { DatabaseModule } from './database/database.module';
import { DepartmentsModule } from './departments/departments.module';
import { FinancialReportingModule } from './financial-reporting/financial-reporting.module';
import { HealthModule } from './health/health.module';
import { HrModule } from './hr/hr.module';
import { LocationsModule } from './locations/locations.module';
import { ProjectPropertyModule } from './project-property/project-property.module';
import { PayrollModule } from './payroll/payroll.module';
import { RoleAssignmentsModule } from './role-assignments/role-assignments.module';
import { RolesModule } from './roles/roles.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { VouchersModule } from './vouchers/vouchers.module';

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
    AuditModule,
    StorageModule,
    HealthModule,
    AuthModule,
    AttachmentsModule,
    HrModule,
    CompaniesModule,
    ChartOfAccountsModule,
    FinancialReportingModule,
    LocationsModule,
    ProjectPropertyModule,
    PayrollModule,
    DepartmentsModule,
    RolesModule,
    UsersModule,
    RoleAssignmentsModule,
    VouchersModule,
    CrmPropertyDeskModule,
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
