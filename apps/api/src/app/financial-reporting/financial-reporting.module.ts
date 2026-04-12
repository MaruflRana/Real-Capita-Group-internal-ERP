import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { FinancialReportingController } from './financial-reporting.controller';
import { FinancialReportingRepository } from './financial-reporting.repository';
import { FinancialReportingService } from './financial-reporting.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [FinancialReportingController],
  providers: [FinancialReportingRepository, FinancialReportingService],
})
export class FinancialReportingModule {}
