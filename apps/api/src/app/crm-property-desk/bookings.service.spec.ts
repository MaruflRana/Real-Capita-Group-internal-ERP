const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');
const { Prisma } = require('@prisma/client');

const { BookingsService } = require('./bookings.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeBookingRecord = (overrides = {}) => ({
  id: 'booking-1',
  companyId: 'company-1',
  projectId: 'project-1',
  customerId: 'customer-1',
  unitId: 'unit-1',
  bookingDate: ISO_DATE,
  bookingAmount: new Prisma.Decimal('50000.00'),
  status: 'ACTIVE',
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
    unitStatusId: 'status-booked',
    code: 'U-101',
    name: 'Unit 101',
    description: null,
    isActive: true,
    createdAt: ISO_DATE,
    updatedAt: ISO_DATE,
    unitStatus: {
      id: 'status-booked',
      code: 'BOOKED',
      name: 'Booked',
      sortOrder: 2,
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
  saleContract: null,
  ...overrides,
});

test('bookings service creates a booking within company scope and maps the booked unit state', async () => {
  let createdData;
  const service = new BookingsService(
    {
      booking: {
        create: async ({ data }) => {
          createdData = data;

          return {
            id: 'booking-1',
            projectId: data.projectId,
            customerId: data.customerId,
            unitId: data.unitId,
            bookingDate: data.bookingDate,
            bookingAmount: data.bookingAmount,
          };
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => ({
        id: 'customer-1',
        isActive: true,
      }),
      getUnitRecord: async () => ({
        id: 'unit-1',
        projectId: 'project-1',
        isActive: true,
        project: {
          id: 'project-1',
          companyId: 'company-1',
          isActive: true,
        },
        unitStatus: {
          code: 'AVAILABLE',
        },
      }),
      getBookingRecord: async () => makeBookingRecord(),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const booking = await service.createBooking('company-1', 'actor-1', undefined, {
    customerId: 'customer-1',
    unitId: 'unit-1',
    bookingDate: '2026-03-16',
    bookingAmount: '50000.00',
  });

  assert.equal(createdData.projectId, 'project-1');
  assert.equal(booking.projectCode, 'PRJ-1');
  assert.equal(booking.unitStatusCode, 'BOOKED');
});

test('bookings service rejects booking a non-AVAILABLE unit', async () => {
  const service = new BookingsService(
    {
      booking: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => ({
        id: 'customer-1',
        isActive: true,
      }),
      getUnitRecord: async () => ({
        id: 'unit-1',
        projectId: 'project-1',
        isActive: true,
        project: {
          id: 'project-1',
          companyId: 'company-1',
          isActive: true,
        },
        unitStatus: {
          code: 'BOOKED',
        },
      }),
      getBookingRecord: async () => makeBookingRecord(),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createBooking('company-1', 'actor-1', undefined, {
        customerId: 'customer-1',
        unitId: 'unit-1',
        bookingDate: '2026-03-16',
        bookingAmount: '50000.00',
      }),
    BadRequestException,
  );
});

test('bookings service converts double-booking conflicts into a clear conflict error', async () => {
  const service = new BookingsService(
    {
      booking: {
        create: async () => {
          throw new Prisma.PrismaClientKnownRequestError('conflict', {
            code: 'P2002',
            clientVersion: 'test',
          });
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getCustomerRecord: async () => ({
        id: 'customer-1',
        isActive: true,
      }),
      getUnitRecord: async () => ({
        id: 'unit-1',
        projectId: 'project-1',
        isActive: true,
        project: {
          id: 'project-1',
          companyId: 'company-1',
          isActive: true,
        },
        unitStatus: {
          code: 'AVAILABLE',
        },
      }),
      getBookingRecord: async () => makeBookingRecord(),
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createBooking('company-1', 'actor-1', undefined, {
        customerId: 'customer-1',
        unitId: 'unit-1',
        bookingDate: '2026-03-16',
        bookingAmount: '50000.00',
      }),
    ConflictException,
  );
});

test('bookings service keeps company-scoped detail lookup strict', async () => {
  const service = new BookingsService(
    {
      booking: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getBookingRecord: async () => {
        throw new NotFoundException('Booking not found.');
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () => service.getBookingDetail('company-1', 'booking-other-company'),
    NotFoundException,
  );
});
