const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { FinancialReportingService } = require('./financial-reporting.service');

const createService = ({
  prismaOverrides = {},
  repositoryOverrides = {},
} = {}) => {
  const prisma = {
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
    ledgerAccount: {
      findFirst: async () => ({ id: 'ledger-1' }),
    },
    particularAccount: {
      findFirst: async () => ({
        id: 'particular-1',
        companyId: 'company-1',
        ledgerAccountId: 'ledger-1',
        code: '110001',
        name: 'Cash In Hand',
        isActive: true,
        ledgerAccount: {
          id: 'ledger-1',
          code: '1100',
          name: 'Cash',
          accountGroupId: 'group-1',
          accountGroup: {
            id: 'group-1',
            code: '11',
            name: 'Current Assets',
            accountClassId: 'class-asset',
            accountClass: {
              id: 'class-asset',
              code: 'ASSET',
              name: 'Assets',
              naturalBalance: 'DEBIT',
            },
          },
        },
      }),
    },
    ...prismaOverrides,
  };
  const repository = {
    fetchTrialBalanceRows: async () => [],
    fetchGeneralLedgerOpeningBalance: async () => ({
      debitTotal: new Prisma.Decimal('0.00'),
      creditTotal: new Prisma.Decimal('0.00'),
    }),
    fetchGeneralLedgerEntries: async () => [],
    fetchStatementRows: async () => [],
    fetchUnclosedEarnings: async () => ({
      debitTotal: new Prisma.Decimal('0.00'),
      creditTotal: new Prisma.Decimal('0.00'),
    }),
    fetchBusinessReportRows: async () => [],
    ...repositoryOverrides,
  };

  return new FinancialReportingService(prisma, repository);
};

const makeTrialBalanceRow = (overrides = {}) => ({
  accountClassId: 'class-asset',
  accountClassCode: 'ASSET',
  accountClassName: 'Assets',
  accountClassNaturalBalance: 'DEBIT',
  accountClassSortOrder: 1,
  accountGroupId: 'group-1',
  accountGroupCode: '11',
  accountGroupName: 'Current Assets',
  ledgerAccountId: 'ledger-1',
  ledgerAccountCode: '1100',
  ledgerAccountName: 'Cash',
  particularAccountId: 'particular-1',
  particularAccountCode: '110001',
  particularAccountName: 'Cash In Hand',
  openingDebit: new Prisma.Decimal('100.00'),
  openingCredit: new Prisma.Decimal('0.00'),
  movementDebit: new Prisma.Decimal('50.00'),
  movementCredit: new Prisma.Decimal('25.00'),
  debitTotal: new Prisma.Decimal('150.00'),
  creditTotal: new Prisma.Decimal('25.00'),
  ...overrides,
});

const makeStatementRow = (overrides = {}) => ({
  accountClassId: 'class-revenue',
  accountClassCode: 'REVENUE',
  accountClassName: 'Revenue',
  accountClassNaturalBalance: 'CREDIT',
  accountClassSortOrder: 4,
  accountGroupId: 'group-r',
  accountGroupCode: '41',
  accountGroupName: 'Sales Revenue',
  ledgerAccountId: 'ledger-r',
  ledgerAccountCode: '4100',
  ledgerAccountName: 'Property Sales',
  particularAccountId: 'particular-r',
  particularAccountCode: '410001',
  particularAccountName: 'Apartment Sales',
  debitTotal: new Prisma.Decimal('0.00'),
  creditTotal: new Prisma.Decimal('500.00'),
  ...overrides,
});

const makeBusinessReportRow = (overrides = {}) => ({
  bucketStart: new Date('2026-04-01T00:00:00.000Z'),
  bucketEnd: new Date('2026-04-30T00:00:00.000Z'),
  contractedSalesAmount: new Prisma.Decimal('1000.00'),
  collectedSalesAmount: new Prisma.Decimal('750.00'),
  revenueAmount: new Prisma.Decimal('900.00'),
  expenseAmount: new Prisma.Decimal('250.00'),
  voucherCount: 4,
  draftVoucherCount: 1,
  postedVoucherCount: 3,
  bookingCount: 2,
  saleContractCount: 1,
  collectionCount: 3,
  ...overrides,
});

test('financial reporting service builds a grouped trial balance with totals', async () => {
  const service = createService({
    repositoryOverrides: {
      fetchTrialBalanceRows: async () => [
        makeTrialBalanceRow(),
        makeTrialBalanceRow({
          particularAccountId: 'particular-2',
          particularAccountCode: '110002',
          particularAccountName: 'Bank',
          movementDebit: new Prisma.Decimal('0.00'),
          movementCredit: new Prisma.Decimal('10.00'),
          debitTotal: new Prisma.Decimal('100.00'),
          creditTotal: new Prisma.Decimal('10.00'),
        }),
      ],
    },
  });

  const response = await service.getTrialBalance('company-1', {
    dateFrom: '2026-04-01',
    dateTo: '2026-04-30',
  });

  assert.equal(response.sections.length, 1);
  assert.equal(
    response.sections[0].accountGroups[0].ledgerAccounts[0].postingAccounts
      .length,
    2,
  );
  assert.equal(response.totals.openingDebit, '200.00');
  assert.equal(response.totals.movementCredit, '35.00');
  assert.equal(response.totals.closingDebit, '215.00');
});

test('financial reporting service rejects invalid trial balance date ranges', async () => {
  const service = createService();

  await assert.rejects(
    () =>
      service.getTrialBalance('company-1', {
        dateFrom: '2026-05-01',
        dateTo: '2026-04-30',
      }),
    BadRequestException,
  );
});

test('financial reporting service rejects a missing general ledger account in the company scope', async () => {
  const service = createService({
    prismaOverrides: {
      particularAccount: {
        findFirst: async () => null,
      },
    },
  });

  await assert.rejects(
    () =>
      service.getGeneralLedger('company-1', {
        particularAccountId: 'missing-account',
        dateFrom: '2026-04-01',
        dateTo: '2026-04-30',
      }),
    NotFoundException,
  );
});

test('financial reporting service returns general ledger running balances', async () => {
  const service = createService({
    repositoryOverrides: {
      fetchGeneralLedgerOpeningBalance: async () => ({
        debitTotal: new Prisma.Decimal('100.00'),
        creditTotal: new Prisma.Decimal('25.00'),
      }),
      fetchGeneralLedgerEntries: async () => [
        {
          voucherId: 'voucher-1',
          voucherLineId: 'line-1',
          voucherDate: new Date('2026-04-10T00:00:00.000Z'),
          voucherType: 'JOURNAL',
          voucherReference: 'JV-001',
          voucherDescription: 'Adjustment',
          voucherPostedAt: new Date('2026-04-10T01:00:00.000Z'),
          lineNumber: 1,
          lineDescription: 'Debit entry',
          debitAmount: new Prisma.Decimal('20.00'),
          creditAmount: new Prisma.Decimal('0.00'),
        },
        {
          voucherId: 'voucher-2',
          voucherLineId: 'line-2',
          voucherDate: new Date('2026-04-11T00:00:00.000Z'),
          voucherType: 'PAYMENT',
          voucherReference: 'PV-001',
          voucherDescription: 'Disbursement',
          voucherPostedAt: new Date('2026-04-11T01:00:00.000Z'),
          lineNumber: 1,
          lineDescription: 'Credit entry',
          debitAmount: new Prisma.Decimal('0.00'),
          creditAmount: new Prisma.Decimal('5.00'),
        },
      ],
    },
  });

  const response = await service.getGeneralLedger('company-1', {
    particularAccountId: 'particular-1',
    dateFrom: '2026-04-01',
    dateTo: '2026-04-30',
  });

  assert.equal(response.openingBalance.debit, '75.00');
  assert.equal(response.lines.length, 2);
  assert.equal(response.lines[0].runningDebit, '95.00');
  assert.equal(response.lines[1].runningDebit, '90.00');
  assert.equal(response.totals.closingDebit, '90.00');
});

test('financial reporting service computes profit and loss totals by account hierarchy', async () => {
  const service = createService({
    repositoryOverrides: {
      fetchStatementRows: async () => [
        makeStatementRow(),
        makeStatementRow({
          accountClassId: 'class-expense',
          accountClassCode: 'EXPENSE',
          accountClassName: 'Expenses',
          accountClassNaturalBalance: 'DEBIT',
          accountClassSortOrder: 5,
          accountGroupId: 'group-e',
          accountGroupCode: '51',
          accountGroupName: 'Operating Expenses',
          ledgerAccountId: 'ledger-e',
          ledgerAccountCode: '5100',
          ledgerAccountName: 'Admin Expenses',
          particularAccountId: 'particular-e',
          particularAccountCode: '510001',
          particularAccountName: 'Utilities',
          debitTotal: new Prisma.Decimal('125.00'),
          creditTotal: new Prisma.Decimal('0.00'),
        }),
      ],
    },
  });

  const response = await service.getProfitAndLoss('company-1', {
    dateFrom: '2026-04-01',
    dateTo: '2026-04-30',
  });

  assert.equal(response.totals.totalRevenue, '500.00');
  assert.equal(response.totals.totalExpense, '125.00');
  assert.equal(response.totals.netProfitLoss, '375.00');
  assert.equal(response.sections.length, 2);
});

test('financial reporting service returns bucketed business overview totals', async () => {
  const service = createService({
    repositoryOverrides: {
      fetchBusinessReportRows: async () => [
        makeBusinessReportRow(),
        makeBusinessReportRow({
          bucketStart: new Date('2026-05-01T00:00:00.000Z'),
          bucketEnd: new Date('2026-05-31T00:00:00.000Z'),
          contractedSalesAmount: new Prisma.Decimal('500.00'),
          collectedSalesAmount: new Prisma.Decimal('600.00'),
          revenueAmount: new Prisma.Decimal('200.00'),
          expenseAmount: new Prisma.Decimal('450.00'),
          voucherCount: 2,
          draftVoucherCount: 0,
          postedVoucherCount: 2,
          bookingCount: 1,
          saleContractCount: 1,
          collectionCount: 2,
        }),
      ],
    },
  });

  const response = await service.getBusinessOverviewReport('company-1', {
    dateFrom: '2026-04-01',
    dateTo: '2026-05-31',
    bucket: 'month',
  });

  assert.equal(response.bucket, 'month');
  assert.equal(response.buckets.length, 2);
  assert.equal(response.buckets[0].bucketLabel, '2026-04');
  assert.equal(response.buckets[0].profitAmount, '650.00');
  assert.equal(response.buckets[1].netProfitLossAmount, '-250.00');
  assert.equal(response.buckets[1].lossAmount, '250.00');
  assert.equal(response.totals.contractedSalesAmount, '1500.00');
  assert.equal(response.totals.collectedSalesAmount, '1350.00');
  assert.equal(response.totals.netProfitLossAmount, '400.00');
  assert.equal(response.totals.voucherCount, 6);
  assert.ok(
    response.assumptions.some((assumption) =>
      assumption.includes('posted voucher lines'),
    ),
  );
});

test('financial reporting service supports yearly business overview buckets', async () => {
  const service = createService({
    repositoryOverrides: {
      fetchBusinessReportRows: async () => [
        makeBusinessReportRow({
          bucketStart: new Date('2026-01-01T00:00:00.000Z'),
          bucketEnd: new Date('2026-12-31T00:00:00.000Z'),
        }),
      ],
    },
  });

  const response = await service.getBusinessOverviewReport('company-1', {
    dateFrom: '2026-01-01',
    dateTo: '2026-12-31',
    bucket: 'year',
  });

  assert.equal(response.bucket, 'year');
  assert.equal(response.buckets.length, 1);
  assert.equal(response.buckets[0].bucketKey, '2026');
  assert.equal(response.buckets[0].bucketLabel, '2026');
});

test('financial reporting service derives unclosed earnings to balance the balance sheet', async () => {
  const service = createService({
    repositoryOverrides: {
      fetchStatementRows: async () => [
        makeStatementRow({
          accountClassId: 'class-asset',
          accountClassCode: 'ASSET',
          accountClassName: 'Assets',
          accountClassNaturalBalance: 'DEBIT',
          accountClassSortOrder: 1,
          debitTotal: new Prisma.Decimal('900.00'),
          creditTotal: new Prisma.Decimal('0.00'),
        }),
        makeStatementRow({
          accountClassId: 'class-liability',
          accountClassCode: 'LIABILITY',
          accountClassName: 'Liabilities',
          accountClassNaturalBalance: 'CREDIT',
          accountClassSortOrder: 2,
          debitTotal: new Prisma.Decimal('0.00'),
          creditTotal: new Prisma.Decimal('400.00'),
        }),
        makeStatementRow({
          accountClassId: 'class-equity',
          accountClassCode: 'EQUITY',
          accountClassName: 'Equity',
          accountClassNaturalBalance: 'CREDIT',
          accountClassSortOrder: 3,
          debitTotal: new Prisma.Decimal('0.00'),
          creditTotal: new Prisma.Decimal('300.00'),
        }),
      ],
      fetchUnclosedEarnings: async () => ({
        debitTotal: new Prisma.Decimal('50.00'),
        creditTotal: new Prisma.Decimal('250.00'),
      }),
    },
  });

  const response = await service.getBalanceSheet('company-1', '2026-04-30');

  assert.equal(response.totals.totalAssets, '900.00');
  assert.equal(response.totals.unclosedEarnings, '200.00');
  assert.equal(response.totals.totalLiabilitiesAndEquity, '900.00');
  assert.equal(response.isBalanced, true);
});

test('financial reporting service fails loudly when the balance sheet stays out of balance', async () => {
  const service = createService({
    repositoryOverrides: {
      fetchStatementRows: async () => [
        makeStatementRow({
          accountClassId: 'class-asset',
          accountClassCode: 'ASSET',
          accountClassName: 'Assets',
          accountClassNaturalBalance: 'DEBIT',
          accountClassSortOrder: 1,
          debitTotal: new Prisma.Decimal('900.00'),
          creditTotal: new Prisma.Decimal('0.00'),
        }),
        makeStatementRow({
          accountClassId: 'class-liability',
          accountClassCode: 'LIABILITY',
          accountClassName: 'Liabilities',
          accountClassNaturalBalance: 'CREDIT',
          accountClassSortOrder: 2,
          debitTotal: new Prisma.Decimal('0.00'),
          creditTotal: new Prisma.Decimal('400.00'),
        }),
      ],
      fetchUnclosedEarnings: async () => ({
        debitTotal: new Prisma.Decimal('0.00'),
        creditTotal: new Prisma.Decimal('0.00'),
      }),
    },
  });

  await assert.rejects(
    () => service.getBalanceSheet('company-1', '2026-04-30'),
    InternalServerErrorException,
  );
});
