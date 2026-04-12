import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AccountClassesController } from './account-classes.controller';
import { AccountGroupsController } from './account-groups.controller';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { LedgerAccountsController } from './ledger-accounts.controller';
import { ParticularAccountsController } from './particular-accounts.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    AccountClassesController,
    AccountGroupsController,
    LedgerAccountsController,
    ParticularAccountsController,
  ],
  providers: [ChartOfAccountsService],
  exports: [ChartOfAccountsService],
})
export class ChartOfAccountsModule {}
