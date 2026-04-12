const assert = require('node:assert/strict');
const test = require('node:test');

const { BadRequestException } = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { InstallmentSchedulesService } = require('./installment-schedules.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeScheduleRecord = (overrides = {}) => ({
  id: 'schedule-1',
  companyId: 'company-1',
  saleContractId: 'contract-1',
  sequenceNumber: 1,
  dueDate: new Date('2026-04-16T00:00:00.000Z'),
  amount: new Prisma.Decimal('250000.00'),
  description: null,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  saleContract: {
    id: 'contract-1',
    companyId: 'company-1',
    bookingId: 'booking-1',
    contractDate: ISO_DATE,
    contractAmount: new Prisma.Decimal('8500000.00'),
    reference: null,
    notes: null,
    createdAt: ISO_DATE,
    updatedAt: ISO_DATE,
    booking: {
      id: 'booking-1',
      companyId: 'company-1',
      projectId: 'project-1',
      customerId: 'customer-1',
      unitId: 'unit-1',
      bookingDate: ISO_DATE,
      bookingAmount: new Prisma.Decimal('50000.00'),
      status: 'CONTRACTED',
      notes: null,
      createdAt: ISO_DATE,
      updatedAt: ISO_DATE,
      customer: {
        id: 'customer-1',
        companyId: 'company-1',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+8801712345678',
        address: null,
        notes: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      },
      project: {
        id: 'project-1',
        companyId: 'company-1',
        code: 'PRJ-1',
        name: 'Tower One',
        description: null,
        locationId: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      },
      unit: {
        id: 'unit-1',
        code: 'U-101',
        name: 'Unit 101',
      },
    },
  },
  collections: [],
  ...overrides,
});

test('installment schedules service creates schedule rows for a contract', async () => {
  const service = new InstallmentSchedulesService(
    {
      $transaction: async (operation) =>
        operation({
          installmentSchedule: {
            create: async ({ data }) =>
              makeScheduleRecord({
                id: `schedule-${data.sequenceNumber}`,
                sequenceNumber: data.sequenceNumber,
                dueDate: data.dueDate,
                amount: data.amount,
                description: data.description,
              }),
          },
        }),
    },
    {
      assertCompanyExists: async () => undefined,
      getSaleContractRecord: async () => ({
        id: 'contract-1',
      }),
    },
  );

  const result = await service.createInstallmentSchedules('company-1', {
    saleContractId: 'contract-1',
    rows: [
      {
        sequenceNumber: 1,
        dueDate: '2026-04-16',
        amount: '250000.00',
      },
      {
        sequenceNumber: 2,
        dueDate: '2026-05-16',
        amount: '300000.00',
      },
    ],
  });

  assert.equal(result.items.length, 2);
  assert.equal(result.items[1].sequenceNumber, 2);
});

test('installment schedules service rejects updates after collections exist', async () => {
  const service = new InstallmentSchedulesService(
    {
      installmentSchedule: {
        findFirst: async () =>
          makeScheduleRecord({
            collections: [
              {
                amount: new Prisma.Decimal('1000.00'),
              },
            ],
          }),
      },
    },
    {
      assertCompanyExists: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.updateInstallmentSchedule('company-1', 'schedule-1', {
        amount: '300000.00',
      }),
    BadRequestException,
  );
});

test('installment schedules service removes a safe schedule row', async () => {
  let deletedScheduleId;
  const service = new InstallmentSchedulesService(
    {
      installmentSchedule: {
        findFirst: async () => makeScheduleRecord(),
        delete: async ({ where }) => {
          deletedScheduleId = where.id;
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
    },
  );

  const result = await service.removeInstallmentSchedule(
    'company-1',
    'schedule-1',
  );

  assert.equal(deletedScheduleId, 'schedule-1');
  assert.equal(result.id, 'schedule-1');
});
