import { createCsvString } from '../common/utils/csv.util';
import type {
  BalanceSheetResponseDto,
  BusinessOverviewReportResponseDto,
  FinancialStatementAccountGroupDto,
  FinancialStatementLedgerAccountDto,
  FinancialStatementPostingAccountDto,
  FinancialStatementSectionDto,
  GeneralLedgerResponseDto,
  ProfitAndLossResponseDto,
  TrialBalanceAccountGroupDto,
  TrialBalanceLedgerAccountDto,
  TrialBalancePostingAccountDto,
  TrialBalanceResponseDto,
  TrialBalanceSectionDto,
} from './dto/financial-reporting.dto';

type CsvRowValue = string | number | boolean | null | undefined;

const TRIAL_BALANCE_HEADERS = [
  'Row Type',
  'Hierarchy Level',
  'Account Class Code',
  'Account Class Name',
  'Account Group Code',
  'Account Group Name',
  'Ledger Account Code',
  'Ledger Account Name',
  'Posting Account Code',
  'Posting Account Name',
  'Natural Balance',
  'Opening Debit',
  'Opening Credit',
  'Movement Debit',
  'Movement Credit',
  'Closing Debit',
  'Closing Credit',
] as const;

const STATEMENT_HEADERS = [
  'Row Type',
  'Hierarchy Level',
  'Account Class Code',
  'Account Class Name',
  'Account Group Code',
  'Account Group Name',
  'Ledger Account Code',
  'Ledger Account Name',
  'Posting Account Code',
  'Posting Account Name',
  'Natural Balance',
  'Amount',
] as const;

const GENERAL_LEDGER_HEADERS = [
  'Row Type',
  'Account Class Code',
  'Account Class Name',
  'Account Group Code',
  'Account Group Name',
  'Ledger Account Code',
  'Ledger Account Name',
  'Posting Account Code',
  'Posting Account Name',
  'Voucher Date',
  'Voucher Type',
  'Voucher Reference',
  'Voucher ID',
  'Voucher Line ID',
  'Line Number',
  'Description',
  'Debit',
  'Credit',
  'Running Debit',
  'Running Credit',
] as const;

const BUSINESS_OVERVIEW_HEADERS = [
  'Bucket Key',
  'Bucket Label',
  'Bucket Start',
  'Bucket End',
  'Contracted Sales',
  'Collected Sales',
  'Revenue',
  'Expenses',
  'Net Profit/Loss',
  'Profit',
  'Loss',
  'Voucher Count',
  'Draft Voucher Count',
  'Posted Voucher Count',
  'Booking Count',
  'Sale Contract Count',
  'Collection Count',
] as const;

const toTrialBalanceRow = ({
  rowType,
  level,
  accountClassCode,
  accountClassName,
  accountGroupCode = '',
  accountGroupName = '',
  ledgerAccountCode = '',
  ledgerAccountName = '',
  particularAccountCode = '',
  particularAccountName = '',
  naturalBalance = '',
  openingDebit,
  openingCredit,
  movementDebit,
  movementCredit,
  closingDebit,
  closingCredit,
}: {
  rowType: string;
  level: number;
  accountClassCode: string;
  accountClassName: string;
  accountGroupCode?: string;
  accountGroupName?: string;
  ledgerAccountCode?: string;
  ledgerAccountName?: string;
  particularAccountCode?: string;
  particularAccountName?: string;
  naturalBalance?: string;
  openingDebit: string;
  openingCredit: string;
  movementDebit: string;
  movementCredit: string;
  closingDebit: string;
  closingCredit: string;
}): CsvRowValue[] => [
  rowType,
  level,
  accountClassCode,
  accountClassName,
  accountGroupCode,
  accountGroupName,
  ledgerAccountCode,
  ledgerAccountName,
  particularAccountCode,
  particularAccountName,
  naturalBalance,
  openingDebit,
  openingCredit,
  movementDebit,
  movementCredit,
  closingDebit,
  closingCredit,
];

const toStatementRow = ({
  rowType,
  level,
  accountClassCode,
  accountClassName,
  accountGroupCode = '',
  accountGroupName = '',
  ledgerAccountCode = '',
  ledgerAccountName = '',
  particularAccountCode = '',
  particularAccountName = '',
  naturalBalance = '',
  amount,
}: {
  rowType: string;
  level: number;
  accountClassCode: string;
  accountClassName: string;
  accountGroupCode?: string;
  accountGroupName?: string;
  ledgerAccountCode?: string;
  ledgerAccountName?: string;
  particularAccountCode?: string;
  particularAccountName?: string;
  naturalBalance?: string;
  amount: string;
}): CsvRowValue[] => [
  rowType,
  level,
  accountClassCode,
  accountClassName,
  accountGroupCode,
  accountGroupName,
  ledgerAccountCode,
  ledgerAccountName,
  particularAccountCode,
  particularAccountName,
  naturalBalance,
  amount,
];

const pushTrialBalanceRows = (
  rows: CsvRowValue[][],
  section: TrialBalanceSectionDto,
) => {
  rows.push(
    toTrialBalanceRow({
      rowType: 'ACCOUNT_CLASS',
      level: 0,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      naturalBalance: section.accountClassNaturalBalance,
      openingDebit: section.openingDebit,
      openingCredit: section.openingCredit,
      movementDebit: section.movementDebit,
      movementCredit: section.movementCredit,
      closingDebit: section.closingDebit,
      closingCredit: section.closingCredit,
    }),
  );

  section.accountGroups.forEach((accountGroup) =>
    pushTrialBalanceAccountGroupRows(rows, section, accountGroup),
  );
};

const pushTrialBalanceAccountGroupRows = (
  rows: CsvRowValue[][],
  section: TrialBalanceSectionDto,
  accountGroup: TrialBalanceAccountGroupDto,
) => {
  rows.push(
    toTrialBalanceRow({
      rowType: 'ACCOUNT_GROUP',
      level: 1,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      accountGroupCode: accountGroup.accountGroupCode,
      accountGroupName: accountGroup.accountGroupName,
      naturalBalance: section.accountClassNaturalBalance,
      openingDebit: accountGroup.openingDebit,
      openingCredit: accountGroup.openingCredit,
      movementDebit: accountGroup.movementDebit,
      movementCredit: accountGroup.movementCredit,
      closingDebit: accountGroup.closingDebit,
      closingCredit: accountGroup.closingCredit,
    }),
  );

  accountGroup.ledgerAccounts.forEach((ledgerAccount) =>
    pushTrialBalanceLedgerRows(rows, section, accountGroup, ledgerAccount),
  );
};

const pushTrialBalanceLedgerRows = (
  rows: CsvRowValue[][],
  section: TrialBalanceSectionDto,
  accountGroup: TrialBalanceAccountGroupDto,
  ledgerAccount: TrialBalanceLedgerAccountDto,
) => {
  rows.push(
    toTrialBalanceRow({
      rowType: 'LEDGER_ACCOUNT',
      level: 2,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      accountGroupCode: accountGroup.accountGroupCode,
      accountGroupName: accountGroup.accountGroupName,
      ledgerAccountCode: ledgerAccount.ledgerAccountCode,
      ledgerAccountName: ledgerAccount.ledgerAccountName,
      naturalBalance: section.accountClassNaturalBalance,
      openingDebit: ledgerAccount.openingDebit,
      openingCredit: ledgerAccount.openingCredit,
      movementDebit: ledgerAccount.movementDebit,
      movementCredit: ledgerAccount.movementCredit,
      closingDebit: ledgerAccount.closingDebit,
      closingCredit: ledgerAccount.closingCredit,
    }),
  );

  ledgerAccount.postingAccounts.forEach((postingAccount) =>
    pushTrialBalancePostingRows(
      rows,
      section,
      accountGroup,
      ledgerAccount,
      postingAccount,
    ),
  );
};

const pushTrialBalancePostingRows = (
  rows: CsvRowValue[][],
  section: TrialBalanceSectionDto,
  accountGroup: TrialBalanceAccountGroupDto,
  ledgerAccount: TrialBalanceLedgerAccountDto,
  postingAccount: TrialBalancePostingAccountDto,
) => {
  rows.push(
    toTrialBalanceRow({
      rowType: 'POSTING_ACCOUNT',
      level: 3,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      accountGroupCode: accountGroup.accountGroupCode,
      accountGroupName: accountGroup.accountGroupName,
      ledgerAccountCode: ledgerAccount.ledgerAccountCode,
      ledgerAccountName: ledgerAccount.ledgerAccountName,
      particularAccountCode: postingAccount.particularAccountCode,
      particularAccountName: postingAccount.particularAccountName,
      naturalBalance: section.accountClassNaturalBalance,
      openingDebit: postingAccount.openingDebit,
      openingCredit: postingAccount.openingCredit,
      movementDebit: postingAccount.movementDebit,
      movementCredit: postingAccount.movementCredit,
      closingDebit: postingAccount.closingDebit,
      closingCredit: postingAccount.closingCredit,
    }),
  );
};

const pushStatementRows = (
  rows: CsvRowValue[][],
  section: FinancialStatementSectionDto,
) => {
  rows.push(
    toStatementRow({
      rowType: 'ACCOUNT_CLASS',
      level: 0,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      naturalBalance: section.accountClassNaturalBalance,
      amount: section.amount,
    }),
  );

  section.accountGroups.forEach((accountGroup) =>
    pushStatementAccountGroupRows(rows, section, accountGroup),
  );
};

const pushStatementAccountGroupRows = (
  rows: CsvRowValue[][],
  section: FinancialStatementSectionDto,
  accountGroup: FinancialStatementAccountGroupDto,
) => {
  rows.push(
    toStatementRow({
      rowType: 'ACCOUNT_GROUP',
      level: 1,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      accountGroupCode: accountGroup.accountGroupCode,
      accountGroupName: accountGroup.accountGroupName,
      naturalBalance: section.accountClassNaturalBalance,
      amount: accountGroup.amount,
    }),
  );

  accountGroup.ledgerAccounts.forEach((ledgerAccount) =>
    pushStatementLedgerRows(rows, section, accountGroup, ledgerAccount),
  );
};

const pushStatementLedgerRows = (
  rows: CsvRowValue[][],
  section: FinancialStatementSectionDto,
  accountGroup: FinancialStatementAccountGroupDto,
  ledgerAccount: FinancialStatementLedgerAccountDto,
) => {
  rows.push(
    toStatementRow({
      rowType: 'LEDGER_ACCOUNT',
      level: 2,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      accountGroupCode: accountGroup.accountGroupCode,
      accountGroupName: accountGroup.accountGroupName,
      ledgerAccountCode: ledgerAccount.ledgerAccountCode,
      ledgerAccountName: ledgerAccount.ledgerAccountName,
      naturalBalance: section.accountClassNaturalBalance,
      amount: ledgerAccount.amount,
    }),
  );

  ledgerAccount.postingAccounts.forEach((postingAccount) =>
    pushStatementPostingRows(
      rows,
      section,
      accountGroup,
      ledgerAccount,
      postingAccount,
    ),
  );
};

const pushStatementPostingRows = (
  rows: CsvRowValue[][],
  section: FinancialStatementSectionDto,
  accountGroup: FinancialStatementAccountGroupDto,
  ledgerAccount: FinancialStatementLedgerAccountDto,
  postingAccount: FinancialStatementPostingAccountDto,
) => {
  rows.push(
    toStatementRow({
      rowType: 'POSTING_ACCOUNT',
      level: 3,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      accountGroupCode: accountGroup.accountGroupCode,
      accountGroupName: accountGroup.accountGroupName,
      ledgerAccountCode: ledgerAccount.ledgerAccountCode,
      ledgerAccountName: ledgerAccount.ledgerAccountName,
      particularAccountCode: postingAccount.particularAccountCode,
      particularAccountName: postingAccount.particularAccountName,
      naturalBalance: section.accountClassNaturalBalance,
      amount: postingAccount.amount,
    }),
  );
};

export const buildTrialBalanceCsv = (
  report: TrialBalanceResponseDto,
): string => {
  const rows: CsvRowValue[][] = [];

  report.sections.forEach((section) => pushTrialBalanceRows(rows, section));
  rows.push(
    toTrialBalanceRow({
      rowType: 'REPORT_TOTAL',
      level: 0,
      accountClassCode: '',
      accountClassName: 'Report totals',
      openingDebit: report.totals.openingDebit,
      openingCredit: report.totals.openingCredit,
      movementDebit: report.totals.movementDebit,
      movementCredit: report.totals.movementCredit,
      closingDebit: report.totals.closingDebit,
      closingCredit: report.totals.closingCredit,
    }),
  );

  return createCsvString([...TRIAL_BALANCE_HEADERS], rows);
};

export const buildGeneralLedgerCsv = (
  report: GeneralLedgerResponseDto,
): string => {
  const rows: CsvRowValue[][] = [
    [
      'OPENING_BALANCE',
      report.account.accountClassCode,
      report.account.accountClassName,
      report.account.accountGroupCode,
      report.account.accountGroupName,
      report.account.ledgerAccountCode,
      report.account.ledgerAccountName,
      report.account.particularAccountCode,
      report.account.particularAccountName,
      report.dateFrom,
      '',
      '',
      '',
      '',
      '',
      'Balance before the selected period.',
      report.openingBalance.debit,
      report.openingBalance.credit,
      report.openingBalance.debit,
      report.openingBalance.credit,
    ],
  ];

  report.lines.forEach((line) => {
    rows.push([
      'LEDGER_LINE',
      report.account.accountClassCode,
      report.account.accountClassName,
      report.account.accountGroupCode,
      report.account.accountGroupName,
      report.account.ledgerAccountCode,
      report.account.ledgerAccountName,
      report.account.particularAccountCode,
      report.account.particularAccountName,
      line.voucherDate,
      line.voucherType,
      line.voucherReference,
      line.voucherId,
      line.voucherLineId,
      line.lineNumber,
      line.lineDescription ?? line.voucherDescription ?? '',
      line.debit,
      line.credit,
      line.runningDebit,
      line.runningCredit,
    ]);
  });

  rows.push([
    'PERIOD_TOTAL',
    report.account.accountClassCode,
    report.account.accountClassName,
    report.account.accountGroupCode,
    report.account.accountGroupName,
    report.account.ledgerAccountCode,
    report.account.ledgerAccountName,
    report.account.particularAccountCode,
    report.account.particularAccountName,
    '',
    report.voucherType ?? '',
    '',
    '',
    '',
    '',
    'Period totals',
    report.totals.debit,
    report.totals.credit,
    report.totals.closingDebit,
    report.totals.closingCredit,
  ]);

  return createCsvString([...GENERAL_LEDGER_HEADERS], rows);
};

export const buildBusinessOverviewReportCsv = (
  report: BusinessOverviewReportResponseDto,
): string => {
  const rows: CsvRowValue[][] = report.buckets.map((bucket) => [
    bucket.bucketKey,
    bucket.bucketLabel,
    bucket.bucketStart,
    bucket.bucketEnd,
    bucket.contractedSalesAmount,
    bucket.collectedSalesAmount,
    bucket.revenueAmount,
    bucket.expenseAmount,
    bucket.netProfitLossAmount,
    bucket.profitAmount,
    bucket.lossAmount,
    bucket.voucherCount,
    bucket.draftVoucherCount,
    bucket.postedVoucherCount,
    bucket.bookingCount,
    bucket.saleContractCount,
    bucket.collectionCount,
  ]);

  rows.push([
    'TOTAL',
    'Report totals',
    report.dateFrom,
    report.dateTo,
    report.totals.contractedSalesAmount,
    report.totals.collectedSalesAmount,
    report.totals.revenueAmount,
    report.totals.expenseAmount,
    report.totals.netProfitLossAmount,
    report.totals.profitAmount,
    report.totals.lossAmount,
    report.totals.voucherCount,
    report.totals.draftVoucherCount,
    report.totals.postedVoucherCount,
    report.totals.bookingCount,
    report.totals.saleContractCount,
    report.totals.collectionCount,
  ]);

  return createCsvString([...BUSINESS_OVERVIEW_HEADERS], rows);
};

export const buildProfitAndLossCsv = (
  report: ProfitAndLossResponseDto,
): string => {
  const rows: CsvRowValue[][] = [];

  report.sections.forEach((section) => pushStatementRows(rows, section));
  rows.push(
    ['TOTAL_REVENUE', 0, 'REVENUE', 'Revenue', '', '', '', '', '', '', '', report.totals.totalRevenue],
    ['TOTAL_EXPENSE', 0, 'EXPENSE', 'Expense', '', '', '', '', '', '', '', report.totals.totalExpense],
    ['NET_PROFIT_LOSS', 0, '', 'Net profit/loss', '', '', '', '', '', '', '', report.totals.netProfitLoss],
  );

  return createCsvString([...STATEMENT_HEADERS], rows);
};

export const buildBalanceSheetCsv = (
  report: BalanceSheetResponseDto,
): string => {
  const rows: CsvRowValue[][] = [];

  report.sections.forEach((section) => pushStatementRows(rows, section));
  rows.push(
    ['TOTAL_ASSETS', 0, 'ASSET', 'Assets', '', '', '', '', '', '', '', report.totals.totalAssets],
    ['TOTAL_LIABILITIES', 0, 'LIABILITY', 'Liabilities', '', '', '', '', '', '', '', report.totals.totalLiabilities],
    ['TOTAL_EQUITY', 0, 'EQUITY', 'Equity', '', '', '', '', '', '', '', report.totals.totalEquity],
    ['TOTAL_LIABILITIES_AND_EQUITY', 0, '', 'Liabilities + equity', '', '', '', '', '', '', '', report.totals.totalLiabilitiesAndEquity],
  );

  report.equityAdjustments.forEach((adjustment) => {
    rows.push([
      'EQUITY_ADJUSTMENT',
      0,
      'EQUITY',
      'Equity adjustment',
      '',
      '',
      '',
      '',
      adjustment.code,
      adjustment.name,
      '',
      adjustment.amount,
    ]);
  });

  return createCsvString([...STATEMENT_HEADERS], rows);
};
