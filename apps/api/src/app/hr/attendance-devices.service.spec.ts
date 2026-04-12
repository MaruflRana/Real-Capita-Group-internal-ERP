const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  NotFoundException,
} = require('@nestjs/common');

const { AttendanceDevicesService } = require('./attendance-devices.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeAttendanceDevice = (overrides = {}) => ({
  id: 'device-1',
  companyId: 'company-1',
  locationId: null,
  code: 'DEV-001',
  name: 'Head Office Device',
  description: null,
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  location: null,
  ...overrides,
});

test('attendance devices service creates a device and normalizes code/name', async () => {
  let createdData;
  const service = new AttendanceDevicesService(
    {
      attendanceDevice: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdData = data;

          return makeAttendanceDevice({
            ...data,
          });
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getLocationRecord: async () => null,
      getAttendanceDeviceRecord: async () => makeAttendanceDevice(),
    },
  );

  const attendanceDevice = await service.createAttendanceDevice('company-1', {
    code: ' dev-001 ',
    name: '  Head Office Device  ',
  });

  assert.equal(createdData.code, 'DEV-001');
  assert.equal(createdData.name, 'Head Office Device');
  assert.equal(attendanceDevice.code, 'DEV-001');
});

test('attendance devices service rejects inactive locations', async () => {
  const service = new AttendanceDevicesService(
    {
      attendanceDevice: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getLocationRecord: async () => ({
        id: 'location-1',
        isActive: false,
      }),
      getAttendanceDeviceRecord: async () => makeAttendanceDevice(),
    },
  );

  await assert.rejects(
    () =>
      service.createAttendanceDevice('company-1', {
        code: 'DEV-002',
        name: 'Branch Device',
        locationId: 'location-1',
      }),
    BadRequestException,
  );
});

test('attendance devices service keeps company-scoped detail lookup strict', async () => {
  const service = new AttendanceDevicesService(
    {
      attendanceDevice: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getAttendanceDeviceRecord: async () => {
        throw new NotFoundException('Attendance device not found.');
      },
    },
  );

  await assert.rejects(
    () =>
      service.getAttendanceDeviceDetail('company-1', 'device-other-company'),
    NotFoundException,
  );
});
