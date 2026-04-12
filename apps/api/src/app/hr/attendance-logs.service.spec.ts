const assert = require('node:assert/strict');
const test = require('node:test');

const {
  NotFoundException,
} = require('@nestjs/common');

const { AttendanceLogsService } = require('./attendance-logs.service');

const ISO_DATE = new Date('2026-03-16T09:00:00.000Z');

const makeAttendanceLog = (overrides = {}) => ({
  id: 'attendance-log-1',
  companyId: 'company-1',
  deviceUserId: 'device-user-1',
  loggedAt: ISO_DATE,
  direction: 'IN',
  externalLogId: 'log-001',
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  deviceUser: {
    employeeId: 'employee-1',
    deviceEmployeeCode: '1001',
    employee: {
      employeeCode: 'EMP-001',
      fullName: 'Jane Doe',
    },
    attendanceDeviceId: 'device-1',
    attendanceDevice: {
      code: 'DEV-001',
      name: 'Head Office Device',
      locationId: null,
      location: null,
    },
  },
  ...overrides,
});

test('attendance logs service creates a log and returns detail', async () => {
  let createdData;
  const service = new AttendanceLogsService(
    {
      attendanceLog: {
        create: async ({ data }) => {
          createdData = data;

          return {
            id: 'attendance-log-1',
          };
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getDeviceUserRecord: async () => ({
        id: 'device-user-1',
      }),
      getAttendanceLogRecord: async () => makeAttendanceLog(),
    },
  );

  const attendanceLog = await service.createAttendanceLog('company-1', {
    deviceUserId: 'device-user-1',
    loggedAt: '2026-03-16T09:00:00.000Z',
    direction: 'IN',
    externalLogId: '  log-001  ',
  });

  assert.equal(createdData.externalLogId, 'log-001');
  assert.equal(attendanceLog.externalLogId, 'log-001');
});

test('attendance logs service bulk ingest reports created and skipped counts', async () => {
  const service = new AttendanceLogsService(
    {
      deviceUser: {
        findMany: async () => [
          {
            id: 'device-user-1',
          },
        ],
      },
      attendanceLog: {
        createMany: async () => ({
          count: 1,
        }),
      },
    },
    {
      assertCompanyExists: async () => undefined,
    },
  );

  const result = await service.bulkCreateAttendanceLogs('company-1', {
    entries: [
      {
        deviceUserId: 'device-user-1',
        loggedAt: '2026-03-16T09:00:00.000Z',
        direction: 'IN',
      },
      {
        deviceUserId: 'device-user-1',
        loggedAt: '2026-03-16T09:00:01.000Z',
        direction: 'OUT',
      },
    ],
  });

  assert.equal(result.createdCount, 1);
  assert.equal(result.skippedCount, 1);
});

test('attendance logs service rejects bulk ingest for missing mappings', async () => {
  const service = new AttendanceLogsService(
    {
      deviceUser: {
        findMany: async () => [],
      },
      attendanceLog: {},
    },
    {
      assertCompanyExists: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.bulkCreateAttendanceLogs('company-1', {
        entries: [
          {
            deviceUserId: 'missing-device-user',
            loggedAt: '2026-03-16T09:00:00.000Z',
            direction: 'IN',
          },
        ],
      }),
    NotFoundException,
  );
});
