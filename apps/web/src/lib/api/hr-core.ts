import { apiRequest } from './client';
import { buildQueryString } from './query-string';
import type {
  AttendanceDeviceListQueryParams,
  AttendanceDeviceRecord,
  AttendanceLogListQueryParams,
  AttendanceLogRecord,
  BulkAttendanceLogsResult,
  BulkCreateAttendanceLogsPayload,
  CompanyUsersListQueryParams,
  CompanyUserRecord,
  CreateAttendanceDevicePayload,
  CreateAttendanceLogPayload,
  CreateDeviceUserPayload,
  CreateEmployeePayload,
  CreateLeaveRequestPayload,
  CreateLeaveTypePayload,
  DepartmentRecord,
  DeviceUserListQueryParams,
  DeviceUserRecord,
  EmployeeListQueryParams,
  EmployeeRecord,
  LeaveRequestActionPayload,
  LeaveRequestListQueryParams,
  LeaveRequestRecord,
  LeaveTypeListQueryParams,
  LeaveTypeRecord,
  ListQueryParams,
  LocationRecord,
  PaginatedResponse,
  UpdateAttendanceDevicePayload,
  UpdateDeviceUserPayload,
  UpdateEmployeePayload,
  UpdateLeaveRequestPayload,
  UpdateLeaveTypePayload,
} from './types';

export const listHrDepartments = (
  companyId: string,
  query: ListQueryParams,
) =>
  apiRequest<PaginatedResponse<DepartmentRecord>>(
    `companies/${companyId}/hr/references/departments${buildQueryString(query)}`,
  );

export const listHrLocations = (
  companyId: string,
  query: ListQueryParams,
) =>
  apiRequest<PaginatedResponse<LocationRecord>>(
    `companies/${companyId}/hr/references/locations${buildQueryString(query)}`,
  );

export const listHrUsers = (
  companyId: string,
  query: CompanyUsersListQueryParams,
) =>
  apiRequest<PaginatedResponse<CompanyUserRecord>>(
    `companies/${companyId}/hr/references/users${buildQueryString(query)}`,
  );

export const listEmployees = (
  companyId: string,
  query: EmployeeListQueryParams,
) =>
  apiRequest<PaginatedResponse<EmployeeRecord>>(
    `companies/${companyId}/employees${buildQueryString(query)}`,
  );

export const getEmployee = (companyId: string, employeeId: string) =>
  apiRequest<EmployeeRecord>(`companies/${companyId}/employees/${employeeId}`);

export const createEmployee = (
  companyId: string,
  payload: CreateEmployeePayload,
) =>
  apiRequest<EmployeeRecord>(`companies/${companyId}/employees`, {
    method: 'POST',
    body: payload,
  });

export const updateEmployee = (
  companyId: string,
  employeeId: string,
  payload: UpdateEmployeePayload,
) =>
  apiRequest<EmployeeRecord>(`companies/${companyId}/employees/${employeeId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateEmployee = (companyId: string, employeeId: string) =>
  apiRequest<EmployeeRecord>(`companies/${companyId}/employees/${employeeId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateEmployee = (companyId: string, employeeId: string) =>
  apiRequest<EmployeeRecord>(`companies/${companyId}/employees/${employeeId}/deactivate`, {
    method: 'POST',
    body: {},
  });

export const listAttendanceDevices = (
  companyId: string,
  query: AttendanceDeviceListQueryParams,
) =>
  apiRequest<PaginatedResponse<AttendanceDeviceRecord>>(
    `companies/${companyId}/attendance-devices${buildQueryString(query)}`,
  );

export const getAttendanceDevice = (
  companyId: string,
  attendanceDeviceId: string,
) =>
  apiRequest<AttendanceDeviceRecord>(
    `companies/${companyId}/attendance-devices/${attendanceDeviceId}`,
  );

export const createAttendanceDevice = (
  companyId: string,
  payload: CreateAttendanceDevicePayload,
) =>
  apiRequest<AttendanceDeviceRecord>(`companies/${companyId}/attendance-devices`, {
    method: 'POST',
    body: payload,
  });

export const updateAttendanceDevice = (
  companyId: string,
  attendanceDeviceId: string,
  payload: UpdateAttendanceDevicePayload,
) =>
  apiRequest<AttendanceDeviceRecord>(
    `companies/${companyId}/attendance-devices/${attendanceDeviceId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateAttendanceDevice = (
  companyId: string,
  attendanceDeviceId: string,
) =>
  apiRequest<AttendanceDeviceRecord>(
    `companies/${companyId}/attendance-devices/${attendanceDeviceId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateAttendanceDevice = (
  companyId: string,
  attendanceDeviceId: string,
) =>
  apiRequest<AttendanceDeviceRecord>(
    `companies/${companyId}/attendance-devices/${attendanceDeviceId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listDeviceUsers = (
  companyId: string,
  query: DeviceUserListQueryParams,
) =>
  apiRequest<PaginatedResponse<DeviceUserRecord>>(
    `companies/${companyId}/device-users${buildQueryString(query)}`,
  );

export const getDeviceUser = (companyId: string, deviceUserId: string) =>
  apiRequest<DeviceUserRecord>(`companies/${companyId}/device-users/${deviceUserId}`);

export const createDeviceUser = (
  companyId: string,
  payload: CreateDeviceUserPayload,
) =>
  apiRequest<DeviceUserRecord>(`companies/${companyId}/device-users`, {
    method: 'POST',
    body: payload,
  });

export const updateDeviceUser = (
  companyId: string,
  deviceUserId: string,
  payload: UpdateDeviceUserPayload,
) =>
  apiRequest<DeviceUserRecord>(`companies/${companyId}/device-users/${deviceUserId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateDeviceUser = (companyId: string, deviceUserId: string) =>
  apiRequest<DeviceUserRecord>(`companies/${companyId}/device-users/${deviceUserId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateDeviceUser = (companyId: string, deviceUserId: string) =>
  apiRequest<DeviceUserRecord>(`companies/${companyId}/device-users/${deviceUserId}/deactivate`, {
    method: 'POST',
    body: {},
  });

export const listAttendanceLogs = (
  companyId: string,
  query: AttendanceLogListQueryParams,
) =>
  apiRequest<PaginatedResponse<AttendanceLogRecord>>(
    `companies/${companyId}/attendance-logs${buildQueryString(query)}`,
  );

export const getAttendanceLog = (
  companyId: string,
  attendanceLogId: string,
) =>
  apiRequest<AttendanceLogRecord>(
    `companies/${companyId}/attendance-logs/${attendanceLogId}`,
  );

export const createAttendanceLog = (
  companyId: string,
  payload: CreateAttendanceLogPayload,
) =>
  apiRequest<AttendanceLogRecord>(`companies/${companyId}/attendance-logs`, {
    method: 'POST',
    body: payload,
  });

export const bulkCreateAttendanceLogs = (
  companyId: string,
  payload: BulkCreateAttendanceLogsPayload,
) =>
  apiRequest<BulkAttendanceLogsResult>(
    `companies/${companyId}/attendance-logs/bulk`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const listLeaveTypes = (
  companyId: string,
  query: LeaveTypeListQueryParams,
) =>
  apiRequest<PaginatedResponse<LeaveTypeRecord>>(
    `companies/${companyId}/leave-types${buildQueryString(query)}`,
  );

export const getLeaveType = (companyId: string, leaveTypeId: string) =>
  apiRequest<LeaveTypeRecord>(`companies/${companyId}/leave-types/${leaveTypeId}`);

export const createLeaveType = (
  companyId: string,
  payload: CreateLeaveTypePayload,
) =>
  apiRequest<LeaveTypeRecord>(`companies/${companyId}/leave-types`, {
    method: 'POST',
    body: payload,
  });

export const updateLeaveType = (
  companyId: string,
  leaveTypeId: string,
  payload: UpdateLeaveTypePayload,
) =>
  apiRequest<LeaveTypeRecord>(`companies/${companyId}/leave-types/${leaveTypeId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateLeaveType = (companyId: string, leaveTypeId: string) =>
  apiRequest<LeaveTypeRecord>(`companies/${companyId}/leave-types/${leaveTypeId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateLeaveType = (companyId: string, leaveTypeId: string) =>
  apiRequest<LeaveTypeRecord>(
    `companies/${companyId}/leave-types/${leaveTypeId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listLeaveRequests = (
  companyId: string,
  query: LeaveRequestListQueryParams,
) =>
  apiRequest<PaginatedResponse<LeaveRequestRecord>>(
    `companies/${companyId}/leave-requests${buildQueryString(query)}`,
  );

export const getLeaveRequest = (companyId: string, leaveRequestId: string) =>
  apiRequest<LeaveRequestRecord>(
    `companies/${companyId}/leave-requests/${leaveRequestId}`,
  );

export const createLeaveRequest = (
  companyId: string,
  payload: CreateLeaveRequestPayload,
) =>
  apiRequest<LeaveRequestRecord>(`companies/${companyId}/leave-requests`, {
    method: 'POST',
    body: payload,
  });

export const updateLeaveRequest = (
  companyId: string,
  leaveRequestId: string,
  payload: UpdateLeaveRequestPayload,
) =>
  apiRequest<LeaveRequestRecord>(
    `companies/${companyId}/leave-requests/${leaveRequestId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const submitLeaveRequest = (companyId: string, leaveRequestId: string) =>
  apiRequest<LeaveRequestRecord>(
    `companies/${companyId}/leave-requests/${leaveRequestId}/submit`,
    {
      method: 'POST',
      body: {},
    },
  );

export const approveLeaveRequest = (
  companyId: string,
  leaveRequestId: string,
  payload: LeaveRequestActionPayload,
) =>
  apiRequest<LeaveRequestRecord>(
    `companies/${companyId}/leave-requests/${leaveRequestId}/approve`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const rejectLeaveRequest = (
  companyId: string,
  leaveRequestId: string,
  payload: LeaveRequestActionPayload,
) =>
  apiRequest<LeaveRequestRecord>(
    `companies/${companyId}/leave-requests/${leaveRequestId}/reject`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const cancelLeaveRequest = (
  companyId: string,
  leaveRequestId: string,
  payload: LeaveRequestActionPayload,
) =>
  apiRequest<LeaveRequestRecord>(
    `companies/${companyId}/leave-requests/${leaveRequestId}/cancel`,
    {
      method: 'POST',
      body: payload,
    },
  );
