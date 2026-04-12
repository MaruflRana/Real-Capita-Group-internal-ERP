const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');

const { LeaveTypesService } = require('./leave-types.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeLeaveType = (overrides = {}) => ({
  id: 'leave-type-1',
  companyId: 'company-1',
  code: 'CL',
  name: 'Casual Leave',
  description: null,
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  ...overrides,
});

test('leave types service creates a leave type and normalizes values', async () => {
  let createdData;
  const service = new LeaveTypesService(
    {
      leaveType: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdData = data;

          return makeLeaveType({
            ...data,
          });
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getLeaveTypeRecord: async () => makeLeaveType(),
    },
  );

  const leaveType = await service.createLeaveType('company-1', {
    code: ' cl ',
    name: '  Casual Leave  ',
  });

  assert.equal(createdData.code, 'CL');
  assert.equal(createdData.name, 'Casual Leave');
  assert.equal(leaveType.code, 'CL');
});

test('leave types service rejects duplicate names', async () => {
  const service = new LeaveTypesService(
    {
      leaveType: {
        findFirst: async ({ where }) =>
          where.name
            ? {
                id: 'existing-leave-type',
              }
            : null,
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getLeaveTypeRecord: async () => makeLeaveType(),
    },
  );

  await assert.rejects(
    () =>
      service.createLeaveType('company-1', {
        code: 'SL',
        name: 'Casual Leave',
      }),
    ConflictException,
  );
});

test('leave types service keeps company-scoped detail lookup strict', async () => {
  const service = new LeaveTypesService(
    {
      leaveType: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getLeaveTypeRecord: async () => {
        throw new NotFoundException('Leave type not found.');
      },
    },
  );

  await assert.rejects(
    () => service.getLeaveTypeDetail('company-1', 'leave-type-other-company'),
    NotFoundException,
  );
});
