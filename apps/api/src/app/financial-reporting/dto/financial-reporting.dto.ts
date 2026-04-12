import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';

import {
  ACCOUNTING_DATE_PATTERN,
  ACCOUNTING_NATURAL_BALANCES,
  ACCOUNTING_VOUCHER_TYPES,
} from '../../common/constants/accounting.constants';

export class TrialBalanceQueryDto {
  @ApiProperty({
    description: 'Inclusive lower bound for the reporting period in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom!: string;

  @ApiProperty({
    description: 'Inclusive upper bound for the reporting period in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo!: string;

  @ApiPropertyOptional({
    enum: ACCOUNTING_VOUCHER_TYPES,
    description:
      'Optional voucher-type filter applied to the posted voucher source set.',
  })
  @IsOptional()
  @IsIn(ACCOUNTING_VOUCHER_TYPES)
  voucherType?: string;

  @ApiPropertyOptional({
    description:
      'Optional ledger-account filter. When supplied, the trial balance is limited to that ledger subtree.',
  })
  @IsOptional()
  @IsUUID()
  ledgerAccountId?: string;

  @ApiPropertyOptional({
    description:
      'Optional posting-account filter. When supplied, the trial balance is limited to that particular account.',
  })
  @IsOptional()
  @IsUUID()
  particularAccountId?: string;
}

export class GeneralLedgerQueryDto {
  @ApiProperty({
    description: 'Posting-level account identifier for the ledger view.',
  })
  @IsUUID()
  particularAccountId!: string;

  @ApiProperty({
    description: 'Inclusive lower bound for the ledger period in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom!: string;

  @ApiProperty({
    description: 'Inclusive upper bound for the ledger period in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo!: string;

  @ApiPropertyOptional({
    enum: ACCOUNTING_VOUCHER_TYPES,
    description:
      'Optional voucher-type filter applied to the posted voucher source set.',
  })
  @IsOptional()
  @IsIn(ACCOUNTING_VOUCHER_TYPES)
  voucherType?: string;
}

export class ProfitAndLossQueryDto {
  @ApiProperty({
    description: 'Inclusive lower bound for the statement period in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'dateFrom must be a valid YYYY-MM-DD value.',
  })
  dateFrom!: string;

  @ApiProperty({
    description: 'Inclusive upper bound for the statement period in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'dateTo must be a valid YYYY-MM-DD value.',
  })
  dateTo!: string;
}

export class BalanceSheetQueryDto {
  @ApiProperty({
    description: 'Statement as-of date in YYYY-MM-DD format.',
  })
  @Matches(ACCOUNTING_DATE_PATTERN, {
    message: 'asOfDate must be a valid YYYY-MM-DD value.',
  })
  asOfDate!: string;
}

export class TrialBalanceAmountsDto {
  @ApiProperty()
  openingDebit!: string;

  @ApiProperty()
  openingCredit!: string;

  @ApiProperty()
  movementDebit!: string;

  @ApiProperty()
  movementCredit!: string;

  @ApiProperty()
  closingDebit!: string;

  @ApiProperty()
  closingCredit!: string;
}

export class TrialBalancePostingAccountDto extends TrialBalanceAmountsDto {
  @ApiProperty()
  particularAccountId!: string;

  @ApiProperty()
  particularAccountCode!: string;

  @ApiProperty()
  particularAccountName!: string;
}

export class TrialBalanceLedgerAccountDto extends TrialBalanceAmountsDto {
  @ApiProperty()
  ledgerAccountId!: string;

  @ApiProperty()
  ledgerAccountCode!: string;

  @ApiProperty()
  ledgerAccountName!: string;

  @ApiProperty({
    type: () => [TrialBalancePostingAccountDto],
  })
  postingAccounts!: TrialBalancePostingAccountDto[];
}

export class TrialBalanceAccountGroupDto extends TrialBalanceAmountsDto {
  @ApiProperty()
  accountGroupId!: string;

  @ApiProperty()
  accountGroupCode!: string;

  @ApiProperty()
  accountGroupName!: string;

  @ApiProperty({
    type: () => [TrialBalanceLedgerAccountDto],
  })
  ledgerAccounts!: TrialBalanceLedgerAccountDto[];
}

export class TrialBalanceSectionDto extends TrialBalanceAmountsDto {
  @ApiProperty()
  accountClassId!: string;

  @ApiProperty()
  accountClassCode!: string;

  @ApiProperty()
  accountClassName!: string;

  @ApiProperty({
    enum: ACCOUNTING_NATURAL_BALANCES,
  })
  accountClassNaturalBalance!: string;

  @ApiProperty()
  accountClassSortOrder!: number;

  @ApiProperty({
    type: () => [TrialBalanceAccountGroupDto],
  })
  accountGroups!: TrialBalanceAccountGroupDto[];
}

export class TrialBalanceResponseDto {
  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  dateFrom!: string;

  @ApiProperty()
  dateTo!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  voucherType!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  ledgerAccountId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  particularAccountId!: string | null;

  @ApiProperty({
    type: () => TrialBalanceAmountsDto,
  })
  totals!: TrialBalanceAmountsDto;

  @ApiProperty({
    type: () => [TrialBalanceSectionDto],
  })
  sections!: TrialBalanceSectionDto[];
}

export class GeneralLedgerAccountDto {
  @ApiProperty()
  accountClassId!: string;

  @ApiProperty()
  accountClassCode!: string;

  @ApiProperty()
  accountClassName!: string;

  @ApiProperty({
    enum: ACCOUNTING_NATURAL_BALANCES,
  })
  accountClassNaturalBalance!: string;

  @ApiProperty()
  accountGroupId!: string;

  @ApiProperty()
  accountGroupCode!: string;

  @ApiProperty()
  accountGroupName!: string;

  @ApiProperty()
  ledgerAccountId!: string;

  @ApiProperty()
  ledgerAccountCode!: string;

  @ApiProperty()
  ledgerAccountName!: string;

  @ApiProperty()
  particularAccountId!: string;

  @ApiProperty()
  particularAccountCode!: string;

  @ApiProperty()
  particularAccountName!: string;

  @ApiProperty()
  isActive!: boolean;
}

export class GeneralLedgerBalanceDto {
  @ApiProperty()
  debit!: string;

  @ApiProperty()
  credit!: string;
}

export class GeneralLedgerLineDto extends GeneralLedgerBalanceDto {
  @ApiProperty()
  voucherId!: string;

  @ApiProperty()
  voucherLineId!: string;

  @ApiProperty()
  voucherDate!: string;

  @ApiProperty({
    enum: ACCOUNTING_VOUCHER_TYPES,
  })
  voucherType!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  voucherReference!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  voucherDescription!: string | null;

  @ApiProperty()
  lineNumber!: number;

  @ApiPropertyOptional({
    nullable: true,
  })
  lineDescription!: string | null;

  @ApiProperty()
  runningDebit!: string;

  @ApiProperty()
  runningCredit!: string;
}

export class GeneralLedgerTotalsDto extends GeneralLedgerBalanceDto {
  @ApiProperty()
  closingDebit!: string;

  @ApiProperty()
  closingCredit!: string;
}

export class GeneralLedgerResponseDto {
  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  dateFrom!: string;

  @ApiProperty()
  dateTo!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  voucherType!: string | null;

  @ApiProperty({
    type: () => GeneralLedgerAccountDto,
  })
  account!: GeneralLedgerAccountDto;

  @ApiProperty({
    type: () => GeneralLedgerBalanceDto,
  })
  openingBalance!: GeneralLedgerBalanceDto;

  @ApiProperty({
    type: () => GeneralLedgerTotalsDto,
  })
  totals!: GeneralLedgerTotalsDto;

  @ApiProperty({
    type: () => [GeneralLedgerLineDto],
  })
  lines!: GeneralLedgerLineDto[];
}

export class FinancialStatementPostingAccountDto {
  @ApiProperty()
  particularAccountId!: string;

  @ApiProperty()
  particularAccountCode!: string;

  @ApiProperty()
  particularAccountName!: string;

  @ApiProperty()
  amount!: string;
}

export class FinancialStatementLedgerAccountDto {
  @ApiProperty()
  ledgerAccountId!: string;

  @ApiProperty()
  ledgerAccountCode!: string;

  @ApiProperty()
  ledgerAccountName!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty({
    type: () => [FinancialStatementPostingAccountDto],
  })
  postingAccounts!: FinancialStatementPostingAccountDto[];
}

export class FinancialStatementAccountGroupDto {
  @ApiProperty()
  accountGroupId!: string;

  @ApiProperty()
  accountGroupCode!: string;

  @ApiProperty()
  accountGroupName!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty({
    type: () => [FinancialStatementLedgerAccountDto],
  })
  ledgerAccounts!: FinancialStatementLedgerAccountDto[];
}

export class FinancialStatementSectionDto {
  @ApiProperty()
  accountClassId!: string;

  @ApiProperty()
  accountClassCode!: string;

  @ApiProperty()
  accountClassName!: string;

  @ApiProperty({
    enum: ACCOUNTING_NATURAL_BALANCES,
  })
  accountClassNaturalBalance!: string;

  @ApiProperty()
  accountClassSortOrder!: number;

  @ApiProperty()
  amount!: string;

  @ApiProperty({
    type: () => [FinancialStatementAccountGroupDto],
  })
  accountGroups!: FinancialStatementAccountGroupDto[];
}

export class ProfitAndLossTotalsDto {
  @ApiProperty()
  totalRevenue!: string;

  @ApiProperty()
  totalExpense!: string;

  @ApiProperty()
  netProfitLoss!: string;
}

export class ProfitAndLossResponseDto {
  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  dateFrom!: string;

  @ApiProperty()
  dateTo!: string;

  @ApiProperty({
    type: () => ProfitAndLossTotalsDto,
  })
  totals!: ProfitAndLossTotalsDto;

  @ApiProperty({
    type: () => [FinancialStatementSectionDto],
  })
  sections!: FinancialStatementSectionDto[];
}

export class BalanceSheetDerivedLineDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  amount!: string;
}

export class BalanceSheetTotalsDto {
  @ApiProperty()
  totalAssets!: string;

  @ApiProperty()
  totalLiabilities!: string;

  @ApiProperty()
  totalEquity!: string;

  @ApiProperty()
  unclosedEarnings!: string;

  @ApiProperty()
  totalLiabilitiesAndEquity!: string;
}

export class BalanceSheetResponseDto {
  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  asOfDate!: string;

  @ApiProperty()
  isBalanced!: boolean;

  @ApiProperty({
    type: () => BalanceSheetTotalsDto,
  })
  totals!: BalanceSheetTotalsDto;

  @ApiProperty({
    type: () => [FinancialStatementSectionDto],
  })
  sections!: FinancialStatementSectionDto[];

  @ApiProperty({
    type: () => [BalanceSheetDerivedLineDto],
  })
  equityAdjustments!: BalanceSheetDerivedLineDto[];
}
