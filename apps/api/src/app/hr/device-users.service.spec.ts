const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ConflictException,
  NotFoundException,
} = require('@nestjs/common');

const { DeviceUsersService } = require('./device-users.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeDeviceUser = (overrides = {}) => ({
  id: 'device-user-1',
  companyId: 'company-1',
  employeeId: 'employee-1',
  attendanceDeviceId: 'device-1',
  deviceEmployeeCode: '1001',
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  employee: {
    id: 'employee-1',
    employeeCode: 'EMP-001',
    fullName: 'Jane Doe',
  },
  attendanceDevice: {
    id: 'device-1',
    code: 'DEV-001',
    name: 'Head Office Device',
    locationId: null,
    location: null,
  },
  ...overrides,
});

test('device users service rejects inactive employees on create', async () => {
  const service = new DeviceUsersService(
    {
      deviceUser: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getEmployeeRecord: async () => ({
        id: 'employee-1',
        isActive: false,
      }),
      getAttendanceDeviceRecord: async () => ({
        id: 'device-1',
        isActive: true,
      }),
      getDeviceUserRecord: async () => makeDeviceUser(),
    },
  );

  await assert.rejects(
    () =>
      service.createDeviceUser('company-1', {
        employeeId: 'employee-1',
        attendanceDeviceId: 'device-1',
        deviceEmployeeCode: '1001',
      }),
    BadRequestException,
  );
});

test('device users service rejects duplicate active device codes', async () => {
  const service = new DeviceUsersService(
    {
      deviceUser: {
        findFirst: async ({ where }) => {
          if (where.employeeId) {
            return null;
          }

          return {
            id: 'existing-mapping',
          };
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getEmployeeRecord: async () => ({
        id: 'employee-1',
        isActive: true,
      }),
      getAttendanceDeviceRecord: async () => ({
        id: 'device-1',
        isActive: true,
      }),
      getDeviceUserRecord: async () => makeDeviceUser(),
    },
  );

  await assert.rejects(
    () =>
      service.createDeviceUser('company-1', {
        employeeId: 'employee-1',
        attendanceDeviceId: 'device-1',
        deviceEmployeeCode: '1001',
      }),
    ConflictException,
  );
});

test('device users service keeps company-scoped detail lookup strict', async () => {
  const service = new DeviceUsersService(
    {
      deviceUser: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getDeviceUserRecord: async () => {
        throw new NotFoundException('Attendance device user mapping not found.');
      },
    },
  );

  await assert.rejects(
    () => service.getDeviceUserDetail('company-1', 'mapping-other-company'),
    NotFoundException,
  );
});
