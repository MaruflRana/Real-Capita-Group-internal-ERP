const assert = require('node:assert/strict');
const test = require('node:test');

const { ConflictException } = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { SalaryStructuresService } = require('./salary-structures.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeSalaryStructure = (overrides = {}) => ({
  id: 'salary-structure-1',
  companyId: 'company-1',
  code: 'SAL-001',
  name: 'Executive Salary',
  description: 'Core salary structure',
  basicAmount: new Prisma.Decimal('50000.00'),
  allowanceAmount: new Prisma.Decimal('5000.00'),
  deductionAmount: new Prisma.Decimal('2500.00'),
  netAmount: new Prisma.Decimal('52500.00'),
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  ...overrides,
});

test('salary structures service creates a normalized company-scoped salary structure', async () => {
  let createdData;
  const service = new SalaryStructuresService(
    {
      salaryStructure: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdData = data;

          return makeSalaryStructure({
            companyId: data.companyId,
            code: data.code,
            name: data.name,
            description: data.description,
            basicAmount: data.basicAmount,
            allowanceAmount: data.allowanceAmount,
            deductionAmount: data.deductionAmount,
            netAmount: data.netAmount,
          });
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
    },
  );

  const salaryStructure = await service.createSalaryStructure('company-1', {
    code: ' sal-001 ',
    name: '  Executive Salary  ',
    description: '  Core salary structure  ',
    basicAmount: '50000.00',
    allowanceAmount: '5000.00',
    deductionAmount: '2500.00',
    netAmount: '52500.00',
  });

  assert.equal(createdData.code, 'SAL-001');
  assert.equal(createdData.name, 'Executive Salary');
  assert.equal(salaryStructure.netAmount, '52500.00');
});

test('salary structures service rejects duplicate codes within a company', async () => {
  let lookupCalls = 0;
  const service = new SalaryStructuresService(
    {
      salaryStructure: {
        findFirst: async () => {
          lookupCalls += 1;

          return lookupCalls === 1 ? { id: 'salary-structure-existing' } : null;
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createSalaryStructure('company-1', {
        code: 'SAL-001',
        name: 'Executive Salary',
        basicAmount: '50000.00',
        allowanceAmount: '5000.00',
        deductionAmount: '2500.00',
        netAmount: '52500.00',
      }),
    ConflictException,
  );
});

test('salary structures service lists salary structures with pagination metadata', async () => {
  const service = new SalaryStructuresService(
    {
      salaryStructure: {
        findMany: async () => [makeSalaryStructure()],
        count: async () => 1,
      },
    },
    {
      assertCompanyExists: async () => undefined,
    },
  );

  const result = await service.listSalaryStructures('company-1', {
    page: 1,
    pageSize: 20,
    sortOrder: 'asc',
  });

  assert.equal(result.items[0].code, 'SAL-001');
  assert.equal(result.meta.total, 1);
});
