const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');

const { CustomersService } = require('./customers.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

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
