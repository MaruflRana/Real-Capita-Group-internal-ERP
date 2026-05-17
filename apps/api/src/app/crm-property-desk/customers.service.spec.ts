const assert = require('node:assert/strict');
const test = require('node:test');

const { ConflictException, NotFoundException } = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { CustomersService } = require('./customers.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');
const dateOnly = (value) => new Date(`${value}T00:00:00.000Z`);
const money = (value) => new Prisma.Decimal(value);

const makeCustomer = (overrides = {}) => ({
  id: 'customer-1',
  companyId: 'company-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+8801712345678',
  address: 'Dhaka',
  notes: null,
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  ...overrides,
});

const makeProject = (overrides = {}) => ({
  id: 'project-1',
  companyId: 'company-1',
  code: 'RC-MAYA',
  name: 'RC Maya Kanon',
  description: null,
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  ...overrides,
});

const makeUnit = (overrides = {}) => ({
  id: 'unit-1',
  projectId: 'project-1',
  phaseId: null,
  blockId: null,
  zoneId: null,
  unitTypeId: 'unit-type-1',
  unitStatusId: 'unit-status-booked',
  code: 'A-101',
  name: 'Apartment 101',
  description: null,
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  ...overrides,
});

const makeProfileBooking = (overrides = {}) => ({
  id: 'booking-1',
  companyId: 'company-1',
  projectId: 'project-1',
  customerId: 'customer-1',
  unitId: 'unit-1',
  bookingDate: dateOnly('2026-03-01'),
  bookingAmount: money('200000.00'),
  status: 'CONTRACTED',
  notes: null,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  project: makeProject(),
  unit: makeUnit(),
  saleContract: {
    id: 'sale-contract-1',
    reference: 'DEMO-SC-001',
  },
  ...overrides,
});

const makeProfileSaleContract = (overrides = {}) => ({
  id: 'sale-contract-1',
  companyId: 'company-1',
  bookingId: 'booking-1',
  contractDate: dateOnly('2026-03-05'),
  contractAmount: money('1500000.00'),
  reference: 'DEMO-SC-001',
  notes: null,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  booking: makeProfileBooking({
    saleContract: null,
  }),
  ...overrides,
});

const makeProfileInstallmentSchedule = (overrides = {}) => ({
  id: 'schedule-1',
  companyId: 'company-1',
  saleContractId: 'sale-contract-1',
  sequenceNumber: 1,
  dueDate: dateOnly('2026-03-15'),
  amount: money('250000.00'),
  description: null,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  saleContract: makeProfileSaleContract(),
  collections: [
    {
      amount: money('100000.00'),
    },
  ],
  ...overrides,
});

const makeVoucher = (overrides = {}) => ({
  id: 'voucher-1',
  companyId: 'company-1',
  createdById: 'user-1',
  postedById: 'user-1',
  voucherType: 'RECEIPT',
  status: 'POSTED',
  voucherDate: dateOnly('2026-03-20'),
  description: null,
  reference: 'DEMO-COL-001',
  postedAt: ISO_DATE,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  ...overrides,
});

const makeProfileCollection = (overrides = {}) => {
  const booking =
    overrides.booking ?? makeProfileBooking({ saleContract: null });
  const saleContract =
    overrides.saleContract ?? makeProfileSaleContract({ booking });
  const installmentSchedule =
    overrides.installmentSchedule ??
    makeProfileInstallmentSchedule({
      saleContract,
      collections: [],
    });

  return {
    id: 'collection-1',
    companyId: 'company-1',
    customerId: 'customer-1',
    voucherId: 'voucher-1',
    bookingId: booking?.id ?? null,
    saleContractId: saleContract?.id ?? null,
    installmentScheduleId: installmentSchedule?.id ?? null,
    collectionDate: dateOnly('2026-03-20'),
    amount: money('100000.00'),
    reference: 'DEMO-COL-001',
    notes: 'Linked installment payment',
    createdAt: ISO_DATE,
    updatedAt: ISO_DATE,
    voucher: makeVoucher(),
    booking,
    saleContract,
    installmentSchedule,
    ...overrides,
  };
};

test('customers service creates a customer and normalizes contact values', async () => {
  let createdData;
  const service = new CustomersService(
    {
      customer: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdData = data;

          return makeCustomer({
            ...data,
          });
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => makeCustomer(),
    },
  );

  const customer = await service.createCustomer('company-1', {
    fullName: '  Jane Doe  ',
    email: '  JANE@EXAMPLE.COM ',
    phone: ' +880 1712-345678 ',
    address: '  Dhaka ',
  });

  assert.equal(createdData.fullName, 'Jane Doe');
  assert.equal(createdData.email, 'jane@example.com');
  assert.equal(createdData.phone, '+8801712345678');
  assert.equal(customer.email, 'jane@example.com');
});

test('customers service rejects duplicate customer email conflicts', async () => {
  const service = new CustomersService(
    {
      customer: {
        findFirst: async () =>
          makeCustomer({
            id: 'customer-existing',
          }),
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => makeCustomer(),
    },
  );

  await assert.rejects(
    () =>
      service.createCustomer('company-1', {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
      }),
    ConflictException,
  );
});

test('customers service keeps company-scoped detail lookup strict', async () => {
  const service = new CustomersService(
    {
      customer: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => {
        throw new NotFoundException('Customer not found.');
      },
    },
  );

  await assert.rejects(
    () => service.getCustomerDetail('company-1', 'customer-other-company'),
    NotFoundException,
  );
});

test('customers service returns a consolidated customer profile with safe summary metrics', async () => {
  let collectionFindManyArgs;
  const booking = makeProfileBooking();
  const saleContract = makeProfileSaleContract({
    booking: makeProfileBooking({
      saleContract: null,
    }),
  });
  const firstSchedule = makeProfileInstallmentSchedule({
    id: 'schedule-1',
    sequenceNumber: 1,
    amount: money('250000.00'),
    collections: [
      {
        amount: money('100000.00'),
      },
    ],
  });
  const secondSchedule = makeProfileInstallmentSchedule({
    id: 'schedule-2',
    sequenceNumber: 2,
    dueDate: dateOnly('2026-04-15'),
    amount: money('100000.00'),
    collections: [],
  });
  const newerCollection = makeProfileCollection({
    id: 'collection-new',
    reference: 'DEMO-COL-NEW',
    collectionDate: dateOnly('2026-03-20'),
    amount: money('100000.00'),
    voucher: makeVoucher({
      id: 'voucher-new',
      reference: 'DEMO-COL-NEW',
      status: 'POSTED',
      voucherDate: dateOnly('2026-03-20'),
    }),
  });
  const olderCollection = makeProfileCollection({
    id: 'collection-old',
    reference: 'DEMO-COL-OLD',
    collectionDate: dateOnly('2026-03-10'),
    amount: money('50000.00'),
    voucher: makeVoucher({
      id: 'voucher-old',
      reference: 'DEMO-COL-OLD',
      status: 'DRAFT',
      voucherDate: dateOnly('2026-03-10'),
    }),
  });

  const service = new CustomersService(
    {
      booking: {
        findMany: async () => [booking],
      },
      saleContract: {
        findMany: async () => [saleContract],
      },
      installmentSchedule: {
        findMany: async () => [firstSchedule, secondSchedule],
      },
      collection: {
        findMany: async (args) => {
          collectionFindManyArgs = args;

          return [newerCollection, olderCollection];
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => makeCustomer(),
    },
  );

  const profile = await service.getCustomerProfile('company-1', 'customer-1');

  assert.equal(profile.customer.fullName, 'Jane Doe');
  assert.equal(profile.summary.totalBookings, 1);
  assert.equal(profile.summary.activeBookingCount, 0);
  assert.equal(profile.summary.saleContractCount, 1);
  assert.equal(profile.summary.totalContractAmount, '1500000.00');
  assert.equal(profile.summary.installmentScheduleCount, 2);
  assert.equal(profile.summary.totalScheduledInstallmentAmount, '350000.00');
  assert.equal(profile.summary.totalCollectionsCount, 2);
  assert.equal(profile.summary.totalCollectedAmount, '150000.00');
  assert.equal(profile.summary.latestCollectionDate, '2026-03-20');
  assert.equal(
    profile.summary.postedVoucherBackedCollectionAmount,
    '100000.00',
  );
  assert.deepEqual(collectionFindManyArgs.orderBy, [
    { collectionDate: 'desc' },
    { createdAt: 'desc' },
  ]);
  assert.deepEqual(
    profile.transactionHistory.map((transaction) => transaction.reference),
    ['DEMO-COL-NEW', 'DEMO-COL-OLD'],
  );
  assert.equal(profile.transactionHistory[0].voucherReference, 'DEMO-COL-NEW');
  assert.equal(
    profile.transactionHistory[0].bookingProjectName,
    'RC Maya Kanon',
  );
  assert.equal(profile.transactionHistory[0].installmentSequenceNumber, 1);
  assert.equal(profile.installmentSchedules[0].collectedAmount, '100000.00');
  assert.equal(profile.installmentSchedules[0].balanceAmount, '150000.00');
  assert.equal(profile.installmentSchedules[1].collectedAmount, null);
  assert.equal(profile.installmentSchedules[1].balanceAmount, null);
  assert.ok(
    profile.timeline.some((event) => event.type === 'COLLECTION_RECORDED'),
  );
  assert.ok(
    profile.assumptions.some((assumption) =>
      assumption.includes('directly linked'),
    ),
  );
});

test('customers service keeps profile response safe when customer has no linked records', async () => {
  const service = new CustomersService(
    {
      booking: {
        findMany: async () => [],
      },
      saleContract: {
        findMany: async () => [],
      },
      installmentSchedule: {
        findMany: async () => [],
      },
      collection: {
        findMany: async () => [],
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () =>
        makeCustomer({
          email: null,
          phone: null,
          address: null,
          notes: null,
        }),
    },
  );

  const profile = await service.getCustomerProfile('company-1', 'customer-1');

  assert.equal(profile.summary.totalBookings, 0);
  assert.equal(profile.summary.totalContractAmount, '0.00');
  assert.equal(profile.summary.totalScheduledInstallmentAmount, '0.00');
  assert.equal(profile.summary.totalCollectedAmount, '0.00');
  assert.equal(profile.summary.latestCollectionDate, null);
  assert.deepEqual(profile.bookings, []);
  assert.deepEqual(profile.saleContracts, []);
  assert.deepEqual(profile.installmentSchedules, []);
  assert.deepEqual(profile.transactionHistory, []);
  assert.equal(profile.timeline.length, 1);
  assert.equal(profile.timeline[0].type, 'CUSTOMER_CREATED');
});
