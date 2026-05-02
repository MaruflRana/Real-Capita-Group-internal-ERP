import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBalanceSheetCsv,
  buildBusinessOverviewReportCsv,
  buildGeneralLedgerCsv,
  buildProfitAndLossCsv,
  buildTrialBalanceCsv,
} from './financial-reporting-exports';

test('trial balance export keeps stable hierarchy and totals headers', () => {
  const csv = buildTrialBalanceCsv({
    companyId: 'company-1',
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    voucherType: null,
    ledgerAccountId: null,
    particularAccountId: null,
    totals: {
      openingDebit: '10.00',
      openingCredit: '0.00',
      movementDebit: '5.00',
      movementCredit: '0.00',
      closingDebit: '15.00',
      closingCredit: '0.00',
    },
    sections: [
      {
        accountClassId: 'class-1',
        accountClassCode: 'ASSET',
        accountClassName: 'Assets',
        accountClassNaturalBalance: 'DEBIT',
        accountClassSortOrder: 1,
        openingDebit: '10.00',
        openingCredit: '0.00',
        movementDebit: '5.00',
        movementCredit: '0.00',
        closingDebit: '15.00',
        closingCredit: '0.00',
        accountGroups: [],
      },
    ],
  });

  assert.match(csv, /^Row Type,Hierarchy Level,Account Class Code,/u);
  assert.match(csv, /ACCOUNT_CLASS,0,ASSET,Assets/u);
  assert.match(csv, /REPORT_TOTAL,0,,Report totals/u);
});

test('general ledger export keeps opening lines and period totals', () => {
  const csv = buildGeneralLedgerCsv({
    companyId: 'company-1',
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    voucherType: null,
    account: {
      accountClassId: 'class-1',
      accountClassCode: 'ASSET',
      accountClassName: 'Assets',
      accountClassNaturalBalance: 'DEBIT',
      accountGroupId: 'group-1',
      accountGroupCode: 'CURRENT_ASSETS',
      accountGroupName: 'Current Assets',
      ledgerAccountId: 'ledger-1',
      ledgerAccountCode: 'CASH',
      ledgerAccountName: 'Cash',
      particularAccountId: 'posting-1',
      particularAccountCode: 'BANK_MAIN',
      particularAccountName: 'Main Bank',
      isActive: true,
    },
    openingBalance: {
      debit: '10.00',
      credit: '0.00',
    },
    totals: {
      debit: '5.00',
      credit: '1.00',
      closingDebit: '14.00',
      closingCredit: '0.00',
    },
    lines: [
      {
        voucherId: 'voucher-1',
        voucherLineId: 'voucher-line-1',
        voucherDate: '2026-01-15',
        voucherType: 'JOURNAL',
        voucherReference: 'JV-1001',
        voucherDescription: 'Cash adjustment',
        lineNumber: 1,
        lineDescription: 'Line description',
        debit: '5.00',
        credit: '1.00',
        runningDebit: '14.00',
        runningCredit: '0.00',
      },
    ],
  });

  assert.match(csv, /OPENING_BALANCE,ASSET,Assets/u);
  assert.match(csv, /LEDGER_LINE,ASSET,Assets,CURRENT_ASSETS/u);
  assert.match(csv, /PERIOD_TOTAL,ASSET,Assets/u);
});

test('business overview export keeps bucket rows and totals', () => {
  const csv = buildBusinessOverviewReportCsv({
    companyId: 'company-1',
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    bucket: 'month',
    totals: {
      contractedSalesAmount: '100.00',
      collectedSalesAmount: '80.00',
      revenueAmount: '90.00',
      expenseAmount: '40.00',
      netProfitLossAmount: '50.00',
      profitAmount: '50.00',
      lossAmount: '0.00',
      voucherCount: 3,
      draftVoucherCount: 1,
      postedVoucherCount: 2,
      bookingCount: 1,
      saleContractCount: 1,
      collectionCount: 2,
    },
    buckets: [
      {
        bucketKey: '2026-01',
        bucketLabel: '2026-01',
        bucketStart: '2026-01-01',
        bucketEnd: '2026-01-31',
        contractedSalesAmount: '100.00',
        collectedSalesAmount: '80.00',
        revenueAmount: '90.00',
        expenseAmount: '40.00',
        netProfitLossAmount: '50.00',
        profitAmount: '50.00',
        lossAmount: '0.00',
        voucherCount: 3,
        draftVoucherCount: 1,
        postedVoucherCount: 2,
        bookingCount: 1,
        saleContractCount: 1,
        collectionCount: 2,
      },
    ],
    assumptions: [],
  });

  assert.match(csv, /^Bucket Key,Bucket Label,Bucket Start,/u);
  assert.match(csv, /2026-01,2026-01,2026-01-01,2026-01-31/u);
  assert.match(csv, /TOTAL,Report totals,2026-01-01,2026-01-31/u);
});

test('statement exports keep total and adjustment disclosure rows', () => {
  const profitLossCsv = buildProfitAndLossCsv({
    companyId: 'company-1',
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    totals: {
      totalRevenue: '15.00',
      totalExpense: '4.00',
      netProfitLoss: '11.00',
    },
    sections: [],
  });
  const balanceSheetCsv = buildBalanceSheetCsv({
    companyId: 'company-1',
    asOfDate: '2026-01-31',
    isBalanced: true,
    totals: {
      totalAssets: '15.00',
      totalLiabilities: '4.00',
      totalEquity: '11.00',
      unclosedEarnings: '2.00',
      totalLiabilitiesAndEquity: '15.00',
    },
    sections: [],
    equityAdjustments: [
      {
        code: 'UNCLOSED_EARNINGS',
        name: 'Unclosed earnings',
        amount: '2.00',
      },
    ],
  });

  assert.match(profitLossCsv, /TOTAL_REVENUE,0,REVENUE,Revenue/u);
  assert.match(profitLossCsv, /NET_PROFIT_LOSS,0,,Net profit\/loss/u);
  assert.match(
    balanceSheetCsv,
    /EQUITY_ADJUSTMENT,0,EQUITY,Equity adjustment/u,
  );
  assert.match(balanceSheetCsv, /UNCLOSED_EARNINGS,Unclosed earnings/u);
});
