const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { CollectionsService } = require('./collections.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeCollectionRecord = (overrides = {}) => ({
  id: 'collection-1',
  companyId: 'company-1',
  customerId: 'customer-1',
  voucherId: 'voucher-1',
  bookingId: 'booking-1',
  saleContractId: 'contract-1',
  installmentScheduleId: 'schedule-1',
  collectionDate: ISO_DATE,
  amount: new Prisma.Decimal('250000.00'),
  reference: null,
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
  voucher: {
    id: 'voucher-1',
    companyId: 'company-1',
    createdById: 'user-1',
    postedById: 'user-1',
    voucherType: 'RECEIPT',
    status: 'POSTED',
    voucherDate: ISO_DATE,
    description: null,
    reference: 'RCPT-1',
    postedAt: ISO_DATE,
    createdAt: ISO_DATE,
    updatedAt: ISO_DATE,
  },
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
    project: {
      id: 'project-1',
      companyId: 'company-1',
      locationId: null,
      code: 'RCH-TOWER',
      name: 'Real Capita Tower',
      description: null,
      isActive: true,
      createdAt: ISO_DATE,
      updatedAt: ISO_DATE,
    },
    unit: {
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
    },
  },
  saleContract: {
    id: 'contract-1',
    companyId: 'company-1',
    bookingId: 'booking-1',
    contractDate: ISO_DATE,
    contractAmount: new Prisma.Decimal('1500000.00'),
    reference: 'SC-001',
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
      project: {
        id: 'project-1',
        companyId: 'company-1',
        locationId: null,
        code: 'RCH-TOWER',
        name: 'Real Capita Tower',
        description: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      },
      unit: {
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
      },
    },
  },
  installmentSchedule: {
    id: 'schedule-1',
    companyId: 'company-1',
    saleContractId: 'contract-1',
    sequenceNumber: 1,
    dueDate: ISO_DATE,
    amount: new Prisma.Decimal('250000.00'),
    description: 'Down payment',
    createdAt: ISO_DATE,
    updatedAt: ISO_DATE,
    saleContract: {
      id: 'contract-1',
      companyId: 'company-1',
      bookingId: 'booking-1',
      contractDate: ISO_DATE,
      contractAmount: new Prisma.Decimal('1500000.00'),
      reference: 'SC-001',
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
        project: {
          id: 'project-1',
          companyId: 'company-1',
          locationId: null,
          code: 'RCH-TOWER',
          name: 'Real Capita Tower',
          description: null,
          isActive: true,
          createdAt: ISO_DATE,
          updatedAt: ISO_DATE,
        },
        unit: {
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
        },
      },
    },
  },
  ...overrides,
});

test('collections service creates a collection with valid voucher linkage', async () => {
  const service = new CollectionsService(
    {
      collection: {
        create: async () => ({
          id: 'collection-1',
        }),
        findFirst: async () => makeCollectionRecord(),
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => ({
        id: 'customer-1',
        isActive: true,
      }),
      getVoucherRecord: async () => ({
        id: 'voucher-1',
        status: 'POSTED',
      }),
      getBookingRecord: async () => ({
        id: 'booking-1',
        customerId: 'customer-1',
      }),
      getSaleContractRecord: async () => ({
        id: 'contract-1',
        bookingId: 'booking-1',
        booking: {
          customerId: 'customer-1',
        },
      }),
      getInstallmentScheduleRecord: async () => ({
        id: 'schedule-1',
        saleContractId: 'contract-1',
        saleContract: {
          bookingId: 'booking-1',
          booking: {
            customerId: 'customer-1',
          },
        },
      }),
    },
  );

  const collection = await service.createCollection('company-1', {
    customerId: 'customer-1',
    voucherId: 'voucher-1',
    bookingId: 'booking-1',
    saleContractId: 'contract-1',
    installmentScheduleId: 'schedule-1',
    collectionDate: '2026-03-16',
    amount: '250000.00',
  });

  assert.equal(collection.voucherStatus, 'POSTED');
  assert.equal(collection.voucherType, 'RECEIPT');
  assert.equal(collection.bookingId, 'booking-1');
  assert.equal(collection.customerPhone, '+8801712345678');
  assert.equal(collection.customerEmail, 'jane@example.com');
  assert.equal(collection.bookingProjectName, 'Real Capita Tower');
  assert.equal(collection.bookingUnitCode, 'A-101');
  assert.equal(collection.saleContractReference, 'SC-001');
  assert.equal(collection.installmentSequenceNumber, 1);
  assert.equal(collection.installmentAmount, '250000.00');
});

test('collections service returns nullable receipt context when optional links are absent', async () => {
  const service = new CollectionsService(
    {
      collection: {
        findFirst: async () =>
          makeCollectionRecord({
            bookingId: null,
            saleContractId: null,
            installmentScheduleId: null,
            booking: null,
            saleContract: null,
            installmentSchedule: null,
          }),
      },
    },
    {
      assertCompanyExists: async () => undefined,
    },
  );

  const collection = await service.getCollectionDetail(
    'company-1',
    'collection-1',
  );

  assert.equal(collection.customerName, 'Jane Doe');
  assert.equal(collection.voucherType, 'RECEIPT');
  assert.equal(collection.bookingProjectName, null);
  assert.equal(collection.bookingUnitCode, null);
  assert.equal(collection.saleContractReference, null);
  assert.equal(collection.installmentSequenceNumber, null);
  assert.equal(collection.installmentAmount, null);
});

test('collections service rejects invalid cross-entity collection linkage', async () => {
  const service = new CollectionsService(
    {
      collection: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => ({
        id: 'customer-1',
        isActive: true,
      }),
      getVoucherRecord: async () => ({
        id: 'voucher-1',
        status: 'POSTED',
      }),
      getBookingRecord: async () => ({
        id: 'booking-1',
        customerId: 'customer-1',
      }),
      getSaleContractRecord: async () => ({
        id: 'contract-1',
        bookingId: 'booking-2',
        booking: {
          customerId: 'customer-1',
        },
      }),
      getInstallmentScheduleRecord: async () => ({
        id: 'schedule-1',
      }),
    },
  );

  await assert.rejects(
    () =>
      service.createCollection('company-1', {
        customerId: 'customer-1',
        voucherId: 'voucher-1',
        bookingId: 'booking-1',
        saleContractId: 'contract-1',
        collectionDate: '2026-03-16',
        amount: '250000.00',
      }),
    BadRequestException,
  );
});

test('collections service rejects duplicate voucher linkage and keeps detail scoped', async () => {
  const service = new CollectionsService(
    {
      collection: {
        create: async () => {
          throw new Prisma.PrismaClientKnownRequestError('conflict', {
            code: 'P2002',
            clientVersion: 'test',
          });
        },
        findFirst: async () => null,
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => ({
        id: 'customer-1',
        isActive: true,
      }),
      getVoucherRecord: async () => ({
        id: 'voucher-1',
        status: 'POSTED',
      }),
    },
  );

  await assert.rejects(
    () =>
      service.createCollection('company-1', {
        customerId: 'customer-1',
        voucherId: 'voucher-1',
        collectionDate: '2026-03-16',
        amount: '250000.00',
      }),
    ConflictException,
  );

  await assert.rejects(
    () => service.getCollectionDetail('company-1', 'collection-other-company'),
    NotFoundException,
  );
});
