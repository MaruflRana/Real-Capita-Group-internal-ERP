const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');

const { LeaveRequestsService } = require('./leave-requests.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeLeaveRequest = (overrides = {}) => ({
  id: 'leave-request-1',
  companyId: 'company-1',
  employeeId: 'employee-1',
  leaveTypeId: 'leave-type-1',
  startDate: new Date('2026-03-20T00:00:00.000Z'),
  endDate: new Date('2026-03-22T00:00:00.000Z'),
  reason: 'Family trip',
  decisionNote: null,
  status: 'DRAFT',
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  employee: {
    employeeCode: 'EMP-001',
    fullName: 'Jane Doe',
    departmentId: null,
    locationId: null,
    department: null,
    location: null,
  },
  leaveType: {
    code: 'CL',
    name: 'Casual Leave',
  },
  ...overrides,
});

test('leave requests service creates a draft leave request', async () => {
  const service = new LeaveRequestsService(
    {
      leaveRequest: {
        create: async () => ({
          id: 'leave-request-1',
        }),
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getEmployeeRecord: async () => ({
        id: 'employee-1',
        isActive: true,
      }),
      getLeaveTypeRecord: async () => ({
        id: 'leave-type-1',
        isActive: true,
      }),
      getLeaveRequestRecord: async () => makeLeaveRequest(),
    },
  );

  const leaveRequest = await service.createLeaveRequest('company-1', {
    employeeId: 'employee-1',
    leaveTypeId: 'leave-type-1',
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    reason: '  Family trip  ',
  });

  assert.equal(leaveRequest.status, 'DRAFT');
  assert.equal(leaveRequest.reason, 'Family trip');
});

test('leave requests service rejects invalid date ranges before persistence', async () => {
  const service = new LeaveRequestsService(
    {
      leaveRequest: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getEmployeeRecord: async () => ({
        id: 'employee-1',
        isActive: true,
      }),
      getLeaveTypeRecord: async () => ({
        id: 'leave-type-1',
        isActive: true,
      }),
      getLeaveRequestRecord: async () => makeLeaveRequest(),
    },
  );

  await assert.rejects(
    () =>
      service.createLeaveRequest('company-1', {
        employeeId: 'employee-1',
        leaveTypeId: 'leave-type-1',
        startDate: '2026-03-22',
        endDate: '2026-03-20',
      }),
    BadRequestException,
  );
});

test('leave requests service rejects updates once submitted', async () => {
  const service = new LeaveRequestsService(
    {
      leaveRequest: {},
    },
    {
      getLeaveRequestRecord: async () =>
        makeLeaveRequest({
          status: 'SUBMITTED',
        }),
    },
  );

  await assert.rejects(
    () =>
      service.updateLeaveRequest('company-1', 'leave-request-1', {
        reason: 'Updated reason',
      }),
    BadRequestException,
  );
});

test('leave requests service submits a draft request', async () => {
  let currentStatus = 'DRAFT';
  const service = new LeaveRequestsService(
    {
      leaveRequest: {
        update: async () => {
          currentStatus = 'SUBMITTED';
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getEmployeeRecord: async () => ({
        id: 'employee-1',
        isActive: true,
      }),
      getLeaveTypeRecord: async () => ({
        id: 'leave-type-1',
        isActive: true,
      }),
      getLeaveRequestRecord: async () =>
        makeLeaveRequest({
          status: currentStatus,
        }),
    },
  );

  const leaveRequest = await service.submitLeaveRequest(
    'company-1',
    'leave-request-1',
  );

  assert.equal(leaveRequest.status, 'SUBMITTED');
});

test('leave requests service surfaces overlap conflicts on submit', async () => {
  const service = new LeaveRequestsService(
    {
      leaveRequest: {
        update: async () => {
          throw new Error(
            'ERROR: conflicting key value violates exclusion constraint "leave_requests_active_overlap_excl"',
          );
        },
      },
    },
    {
      getEmployeeRecord: async () => ({
        id: 'employee-1',
        isActive: true,
      }),
      getLeaveTypeRecord: async () => ({
        id: 'leave-type-1',
        isActive: true,
      }),
      getLeaveRequestRecord: async () => makeLeaveRequest(),
    },
  );

  await assert.rejects(
    () => service.submitLeaveRequest('company-1', 'leave-request-1'),
    ConflictException,
  );
});

test('leave requests service keeps company-scoped detail lookup strict', async () => {
  const service = new LeaveRequestsService(
    {
      leaveRequest: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getLeaveRequestRecord: async () => {
        throw new NotFoundException('Leave request not found.');
      },
    },
  );

  await assert.rejects(
    () => service.getLeaveRequestDetail('company-1', 'leave-request-other-company'),
    NotFoundException,
  );
});
