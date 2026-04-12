import { formatDate, formatDateTime, formatName } from '../../lib/format';
import type {
  AttendanceDeviceRecord,
  AttendanceLogRecord,
  CompanyUserRecord,
  DepartmentRecord,
  DeviceUserRecord,
  EmployeeRecord,
  LeaveRequestRecord,
  LeaveTypeRecord,
  LocationRecord,
} from '../../lib/api/types';

export const PAGE_SIZE = 10;
export const OPTION_PAGE_SIZE = 100;

export const normalizeOptionalText = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

export const normalizeOptionalTextToNull = (value: string | undefined) =>
  normalizeOptionalText(value) ?? null;

export const normalizeNullableId = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
};

export const getStatusQueryValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

export const getDepartmentLabel = (
  department: Pick<DepartmentRecord, 'code' | 'name'>,
) => `${department.code} - ${department.name}`;

export const getLocationLabel = (
  location: Pick<LocationRecord, 'code' | 'name'>,
) => `${location.code} - ${location.name}`;

export const getUserLabel = (
  user: Pick<
    CompanyUserRecord,
    'email' | 'firstName' | 'lastName' | 'roles'
  >,
) =>
  [
    formatName(user.firstName, user.lastName, user.email),
    user.email,
    user.roles.join(', '),
  ]
    .filter(Boolean)
    .join(' | ');

export const getEmployeeLabel = (
  employee: Pick<EmployeeRecord, 'employeeCode' | 'fullName'>,
) => `${employee.employeeCode} - ${employee.fullName}`;

export const getAttendanceDeviceLabel = (
  device: Pick<AttendanceDeviceRecord, 'code' | 'name'>,
) => `${device.code} - ${device.name}`;

export const getDeviceUserLabel = (
  deviceUser: Pick<
    DeviceUserRecord,
    'deviceEmployeeCode' | 'employeeCode' | 'employeeFullName' | 'attendanceDeviceCode'
  >,
) =>
  [
    deviceUser.deviceEmployeeCode,
    `${deviceUser.employeeCode} ${deviceUser.employeeFullName}`,
    deviceUser.attendanceDeviceCode,
  ].join(' | ');

export const getLeaveTypeLabel = (
  leaveType: Pick<LeaveTypeRecord, 'code' | 'name'>,
) => `${leaveType.code} - ${leaveType.name}`;

export const formatEmployeeContext = (
  employee: Pick<
    EmployeeRecord,
    | 'departmentName'
    | 'locationName'
    | 'managerFullName'
    | 'managerEmployeeCode'
    | 'userEmail'
  >,
) =>
  [
    employee.departmentName ? `Dept: ${employee.departmentName}` : null,
    employee.locationName ? `Location: ${employee.locationName}` : null,
    employee.managerFullName
      ? `Manager: ${employee.managerFullName}${
          employee.managerEmployeeCode ? ` (${employee.managerEmployeeCode})` : ''
        }`
      : null,
    employee.userEmail ? `User: ${employee.userEmail}` : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' | ');

export const formatAttendanceLogSummary = (
  log: Pick<
    AttendanceLogRecord,
    'employeeCode' | 'attendanceDeviceCode' | 'loggedAt' | 'direction'
  >,
) =>
  [
    log.employeeCode,
    log.attendanceDeviceCode,
    formatDateTime(log.loggedAt),
    log.direction,
  ].join(' | ');

export const formatLeaveDateRange = (
  leaveRequest: Pick<LeaveRequestRecord, 'startDate' | 'endDate'>,
) =>
  leaveRequest.startDate === leaveRequest.endDate
    ? formatDate(leaveRequest.startDate)
    : `${formatDate(leaveRequest.startDate)} to ${formatDate(leaveRequest.endDate)}`;

export const toDateTimeLocalValue = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
};
