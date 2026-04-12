import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PayrollRunLinesController } from './payroll-run-lines.controller';
import { PayrollRunLinesService } from './payroll-run-lines.service';
import { PayrollReferencesController } from './payroll-references.controller';
import { PayrollReferencesService } from './payroll-references.service';
import { PayrollRunsController } from './payroll-runs.controller';
import { PayrollRunsService } from './payroll-runs.service';
import { PayrollReferenceService } from './payroll-reference.service';
import { SalaryStructuresController } from './salary-structures.controller';
import { SalaryStructuresService } from './salary-structures.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    SalaryStructuresController,
    PayrollRunsController,
    PayrollRunLinesController,
    PayrollReferencesController,
  ],
  providers: [
    PayrollReferenceService,
    PayrollReferencesService,
    SalaryStructuresService,
    PayrollRunsService,
    PayrollRunLinesService,
  ],
})
export class PayrollModule {}
