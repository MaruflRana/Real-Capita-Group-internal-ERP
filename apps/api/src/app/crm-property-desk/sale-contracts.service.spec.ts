const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ConflictException,
} = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { SaleContractsService } = require('./sale-contracts.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeSaleContractRecord = (overrides = {}) => ({
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
      projectId: 'project-1',
      phaseId: null,
      blockId: null,
      zoneId: null,
      unitTypeId: 'unit-type-1',
      unitStatusId: 'status-sold',
      code: 'U-101',
      name: 'Unit 101',
      description: null,
      isActive: true,
      createdAt: ISO_DATE,
      updatedAt: ISO_DATE,
      unitStatus: {
        id: 'status-sold',
        code: 'SOLD',
        name: 'Sold',
        sortOrder: 4,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      },
      unitType: {
        id: 'unit-type-1',
        companyId: 'company-1',
        code: 'APT',
        name: 'Apartment',
        description: null,
        isActive: true,
        createdAt: ISO_DATE,
        updatedAt: ISO_DATE,
      },
    },
  },
  ...overrides,
});

test('sale contracts service creates a contract from a valid booked booking', async () => {
  const service = new SaleContractsService(
    {
      saleContract: {
        create: async ({ data }) => ({
          id: 'contract-1',
          bookingId: data.bookingId,
          contractDate: data.contractDate,
          contractAmount: data.contractAmount,
          reference: data.reference,
        }),
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getBookingRecord: async () => ({
        ...makeSaleContractRecord().booking,
        status: 'ACTIVE',
        saleContract: null,
        unit: {
          ...makeSaleContractRecord().booking.unit,
          unitStatus: {
            id: 'status-booked',
            code: 'BOOKED',
            name: 'Booked',
            sortOrder: 2,
            isActive: true,
            createdAt: ISO_DATE,
            updatedAt: ISO_DATE,
          },
        },
      }),
      getSaleContractRecord: async () => makeSaleContractRecord(),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const contract = await service.createSaleContract(
    'company-1',
    'actor-1',
    undefined,
    {
      bookingId: 'booking-1',
      contractDate: '2026-03-16',
      contractAmount: '8500000.00',
    },
  );

  assert.equal(contract.bookingId, 'booking-1');
  assert.equal(contract.projectCode, 'PRJ-1');
});

test('sale contracts service rejects invalid contract creation when booking state is not active', async () => {
  const service = new SaleContractsService(
    {
      saleContract: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getBookingRecord: async () => ({
        ...makeSaleContractRecord().booking,
        status: 'CONTRACTED',
        saleContract: null,
      }),
      getSaleContractRecord: async () => makeSaleContractRecord(),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createSaleContract('company-1', 'actor-1', undefined, {
        bookingId: 'booking-1',
        contractDate: '2026-03-16',
        contractAmount: '8500000.00',
      }),
    BadRequestException,
  );
});

test('sale contracts service rejects duplicate contracts for the same booking', async () => {
  const service = new SaleContractsService(
    {
      saleContract: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getBookingRecord: async () => ({
        ...makeSaleContractRecord().booking,
        saleContract: {
          id: 'contract-existing',
        },
      }),
      getSaleContractRecord: async () => makeSaleContractRecord(),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createSaleContract('company-1', 'actor-1', undefined, {
        bookingId: 'booking-1',
        contractDate: '2026-03-16',
        contractAmount: '8500000.00',
      }),
    ConflictException,
  );
});
