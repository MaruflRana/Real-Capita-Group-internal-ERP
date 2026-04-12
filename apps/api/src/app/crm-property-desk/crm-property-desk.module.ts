import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CrmPropertyDeskReferencesController } from './crm-property-desk-references.controller';
import { CrmPropertyDeskReferenceService } from './crm-property-desk-reference.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { InstallmentSchedulesController } from './installment-schedules.controller';
import { InstallmentSchedulesService } from './installment-schedules.service';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { SaleContractsController } from './sale-contracts.controller';
import { SaleContractsService } from './sale-contracts.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    CrmPropertyDeskReferencesController,
    CustomersController,
    LeadsController,
    BookingsController,
    SaleContractsController,
    InstallmentSchedulesController,
    CollectionsController,
  ],
  providers: [
    CrmPropertyDeskReferenceService,
    CustomersService,
    LeadsService,
    BookingsService,
    SaleContractsService,
    InstallmentSchedulesService,
    CollectionsService,
  ],
})
export class CrmPropertyDeskModule {}
