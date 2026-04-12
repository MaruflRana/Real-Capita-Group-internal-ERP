const assert = require('node:assert/strict');
const test = require('node:test');

const { BadRequestException, ConflictException } = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { PayrollRunsService } = require('./payroll-runs.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makePayrollRun = (overrides = {}) => ({
  id: 'payroll-run-1',
  companyId: 'company-1',
  projectId: null,
  costCenterId: null,
  postedVoucherId: null,
  payrollYear: 2026,
  payrollMonth: 3,
  description: 'March payroll',
  status: 'DRAFT',
  finalizedAt: null,
  cancelledAt: null,
  postedAt: null,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  project: null,
  costCenter: null,
  postedVoucher: null,
  payrollRunLines: [
    {
      basicAmount: new Prisma.Decimal('50000.00'),
      allowanceAmount: new Prisma.Decimal('5000.00'),
      deductionAmount: new Prisma.Decimal('2500.00'),
      netAmount: new Prisma.Decimal('52500.00'),
    },
  ],
  ...overrides,
});

test('payroll runs service creates a payroll run within the requested scope', async () => {
  const service = new PayrollRunsService(
    {
      payrollRun: {
        findFirst: async () => null,
        create: async () => ({
          id: 'payroll-run-1',
        }),
      },
    },
    {
      queryRaw: async () => [],
    },
    {
      assertCompanyExists: async () => undefined,
      getPayrollRunRecord: async () => makePayrollRun(),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const payrollRun = await service.createPayrollRun('company-1', {
    payrollYear: 2026,
    payrollMonth: 3,
    description: 'March payroll',
  });

  assert.equal(payrollRun.payrollYear, 2026);
  assert.equal(payrollRun.totalNetAmount, '52500.00');
});

test('payroll runs service rejects mismatched project and cost center scope', async () => {
  const service = new PayrollRunsService(
    {
      payrollRun: {},
    },
    {
      queryRaw: async () => [],
    },
    {
      assertCompanyExists: async () => undefined,
      getProjectRecord: async () => ({ id: 'project-1' }),
      getCostCenterRecord: async () => ({
        id: 'cost-center-1',
        projectId: 'project-other',
      }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createPayrollRun('company-1', {
        payrollYear: 2026,
        payrollMonth: 3,
        projectId: 'project-1',
        costCenterId: 'cost-center-1',
      }),
    BadRequestException,
  );
});

test('payroll runs service rejects duplicate active period scope', async () => {
  const service = new PayrollRunsService(
    {
      payrollRun: {
        findFirst: async () => ({ id: 'payroll-run-existing' }),
      },
    },
    {
      queryRaw: async () => [],
    },
    {
      assertCompanyExists: async () => undefined,
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createPayrollRun('company-1', {
        payrollYear: 2026,
        payrollMonth: 3,
      }),
    ConflictException,
  );
});

test('payroll runs service finalizes a draft payroll run with lines', async () => {
  let updateData;
  const service = new PayrollRunsService(
    {
      payrollRun: {
        update: async ({ data }) => {
          updateData = data;
        },
      },
    },
    {
      queryRaw: async () => [],
    },
    {
      getPayrollRunRecord: async () =>
        makePayrollRun({
          payrollRunLines: [
            {
              basicAmount: new Prisma.Decimal('50000.00'),
              allowanceAmount: new Prisma.Decimal('5000.00'),
              deductionAmount: new Prisma.Decimal('2500.00'),
              netAmount: new Prisma.Decimal('52500.00'),
            },
          ],
        }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const payrollRun = await service.finalizePayrollRun('company-1', 'payroll-run-1');

  assert.equal(updateData.status, 'FINALIZED');
  assert.equal(payrollRun.status, 'DRAFT');
});

test('payroll runs service posts a finalized payroll run into accounting', async () => {
  let getPayrollRunCalls = 0;
  let queryRawCalls = 0;
  const service = new PayrollRunsService(
    {
      payrollRun: {
        findMany: async () => [],
        count: async () => 0,
      },
    },
    {
      queryRaw: async () => {
        queryRawCalls += 1;

        return [{ payrollRunId: 'payroll-run-1', voucherId: 'voucher-1' }];
      },
    },
    {
      getPayrollRunRecord: async () => {
        getPayrollRunCalls += 1;

        return getPayrollRunCalls === 1
          ? makePayrollRun({
              status: 'FINALIZED',
            })
          : makePayrollRun({
              status: 'POSTED',
              postedVoucherId: 'voucher-1',
              postedAt: new Date('2026-03-31T12:00:00.000Z'),
              postedVoucher: {
                id: 'voucher-1',
                companyId: 'company-1',
                createdById: 'user-1',
                postedById: 'user-1',
                voucherType: 'JOURNAL',
                status: 'POSTED',
                voucherDate: new Date('2026-03-31T00:00:00.000Z'),
                description: 'March payroll',
                reference: 'PAYROLL-2026-03',
                postedAt: new Date('2026-03-31T12:00:00.000Z'),
                createdAt: ISO_DATE,
                updatedAt: ISO_DATE,
              },
            });
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const payrollRun = await service.postPayrollRun(
    'company-1',
    'payroll-run-1',
    {
      id: 'user-1',
      email: 'payroll@example.com',
      companyId: 'company-1',
      companyName: 'Real Capita',
      companySlug: 'real-capita',
      roles: ['company_payroll'],
    },
    undefined,
    {
      voucherDate: '2026-03-31',
      expenseParticularAccountId: 'expense-account-1',
      payableParticularAccountId: 'payable-account-1',
      deductionParticularAccountId: 'deduction-account-1',
    },
  );

  assert.equal(queryRawCalls, 1);
  assert.equal(payrollRun.status, 'POSTED');
  assert.equal(payrollRun.postedVoucherId, 'voucher-1');
});

test('payroll runs service rejects reposting a non-finalized payroll run', async () => {
  const service = new PayrollRunsService(
    {
      payrollRun: {},
    },
    {
      queryRaw: async () => [],
    },
    {
      getPayrollRunRecord: async () =>
        makePayrollRun({
          status: 'POSTED',
          postedVoucherId: 'voucher-1',
        }),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.postPayrollRun(
        'company-1',
        'payroll-run-1',
        {
          id: 'user-1',
          email: 'payroll@example.com',
          companyId: 'company-1',
          companyName: 'Real Capita',
          companySlug: 'real-capita',
          roles: ['company_payroll'],
        },
        undefined,
        {
          voucherDate: '2026-03-31',
          expenseParticularAccountId: 'expense-account-1',
          payableParticularAccountId: 'payable-account-1',
        },
      ),
    BadRequestException,
  );
});
