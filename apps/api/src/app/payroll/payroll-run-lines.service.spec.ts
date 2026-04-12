const assert = require('node:assert/strict');
const test = require('node:test');

const { BadRequestException } = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { PayrollRunLinesService } = require('./payroll-run-lines.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makePayrollRun = (overrides = {}) => ({
  id: 'payroll-run-1',
  companyId: 'company-1',
  payrollYear: 2026,
  payrollMonth: 3,
  description: 'March payroll',
  status: 'DRAFT',
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  project: null,
  costCenter: null,
  postedVoucher: null,
  payrollRunLines: [],
  ...overrides,
});

const makePayrollRunLine = (overrides = {}) => ({
  id: 'payroll-run-line-1',
  companyId: 'company-1',
  payrollRunId: 'payroll-run-1',
  employeeId: 'employee-1',
  basicAmount: new Prisma.Decimal('50000.00'),
  allowanceAmount: new Prisma.Decimal('5000.00'),
  deductionAmount: new Prisma.Decimal('2500.00'),
  netAmount: new Prisma.Decimal('52500.00'),
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  employee: {
    id: 'employee-1',
    companyId: 'company-1',
    departmentId: null,
    locationId: null,
    employeeCode: 'EMP-001',
    fullName: 'Jane Doe',
    department: null,
    location: null,
  },
  ...overrides,
});

test('payroll run lines service creates a draft payroll line', async () => {
  const service = new PayrollRunLinesService(
    {
      payrollRunLine: {
        create: async ({ data }) =>
          makePayrollRunLine({
            employeeId: data.employeeId,
            basicAmount: data.basicAmount,
            allowanceAmount: data.allowanceAmount,
            deductionAmount: data.deductionAmount,
            netAmount: data.netAmount,
          }),
      },
    },
    {
      getPayrollRunRecord: async () => makePayrollRun(),
      getEmployeeRecord: async () => ({
        id: 'employee-1',
      }),
    },
  );

  const payrollRunLine = await service.createPayrollRunLine(
    'company-1',
    'payroll-run-1',
    {
      employeeId: 'employee-1',
      basicAmount: '50000.00',
      allowanceAmount: '5000.00',
      deductionAmount: '2500.00',
      netAmount: '52500.00',
    },
  );

  assert.equal(payrollRunLine.employeeCode, 'EMP-001');
  assert.equal(payrollRunLine.netAmount, '52500.00');
});

test('payroll run lines service rejects invalid net amount combinations', async () => {
  const service = new PayrollRunLinesService(
    {
      payrollRunLine: {},
    },
    {
      getPayrollRunRecord: async () => makePayrollRun(),
      getEmployeeRecord: async () => ({
        id: 'employee-1',
      }),
    },
  );

  await assert.rejects(
    () =>
      service.createPayrollRunLine('company-1', 'payroll-run-1', {
        employeeId: 'employee-1',
        basicAmount: '50000.00',
        allowanceAmount: '5000.00',
        deductionAmount: '2500.00',
        netAmount: '50000.00',
      }),
    BadRequestException,
  );
});

test('payroll run lines service rejects duplicate employees in bulk upsert requests', async () => {
  const service = new PayrollRunLinesService(
    {
      employee: {
        findMany: async () => [],
      },
      payrollRunLine: {},
    },
    {
      getPayrollRunRecord: async () => makePayrollRun(),
    },
  );

  await assert.rejects(
    () =>
      service.bulkUpsertPayrollRunLines('company-1', 'payroll-run-1', {
        lines: [
          {
            employeeId: 'employee-1',
            basicAmount: '50000.00',
            allowanceAmount: '5000.00',
            deductionAmount: '2500.00',
            netAmount: '52500.00',
          },
          {
            employeeId: 'employee-1',
            basicAmount: '40000.00',
            allowanceAmount: '4000.00',
            deductionAmount: '2000.00',
            netAmount: '42000.00',
          },
        ],
      }),
    BadRequestException,
  );
});

test('payroll run lines service rejects unsafe mutation after posting', async () => {
  const service = new PayrollRunLinesService(
    {
      payrollRunLine: {},
    },
    {
      getPayrollRunRecord: async () =>
        makePayrollRun({
          status: 'POSTED',
        }),
    },
  );

  await assert.rejects(
    () =>
      service.createPayrollRunLine('company-1', 'payroll-run-1', {
        employeeId: 'employee-1',
        basicAmount: '50000.00',
        allowanceAmount: '5000.00',
        deductionAmount: '2500.00',
        netAmount: '52500.00',
      }),
    BadRequestException,
  );
});
