'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateAttendanceDevice,
  activateDeviceUser,
  activateEmployee,
  activateLeaveType,
  approveLeaveRequest,
  bulkCreateAttendanceLogs,
  cancelLeaveRequest,
  createAttendanceDevice,
  createAttendanceLog,
  createDeviceUser,
  createEmployee,
  createLeaveRequest,
  createLeaveType,
  deactivateAttendanceDevice,
  deactivateDeviceUser,
  deactivateEmployee,
  deactivateLeaveType,
  getAttendanceDevice,
  getAttendanceLog,
  getDeviceUser,
  getEmployee,
  getLeaveRequest,
  getLeaveType,
  listAttendanceDevices,
  listAttendanceLogs,
  listDeviceUsers,
  listEmployees,
  listHrDepartments,
  listHrLocations,
  listHrUsers,
  listLeaveRequests,
  listLeaveTypes,
  rejectLeaveRequest,
  submitLeaveRequest,
  updateAttendanceDevice,
  updateDeviceUser,
  updateEmployee,
  updateLeaveRequest,
  updateLeaveType,
} from '../../lib/api/hr-core';
import type {
  AttendanceDeviceListQueryParams,
  BulkCreateAttendanceLogsPayload,
  CompanyUsersListQueryParams,
  CreateAttendanceDevicePayload,
  CreateAttendanceLogPayload,
  CreateDeviceUserPayload,
  CreateEmployeePayload,
  CreateLeaveRequestPayload,
  CreateLeaveTypePayload,
  DeviceUserListQueryParams,
  EmployeeListQueryParams,
  LeaveRequestActionPayload,
  LeaveRequestListQueryParams,
  LeaveTypeListQueryParams,
  ListQueryParams,
  UpdateAttendanceDevicePayload,
  UpdateDeviceUserPayload,
  UpdateEmployeePayload,
  UpdateLeaveRequestPayload,
  UpdateLeaveTypePayload,
  AttendanceLogListQueryParams,
} from '../../lib/api/types';

const assertCompanyId = (companyId: string | undefined): string => {
  if (!companyId) {
    throw new Error('A company context is required for HR operations.');
  }

  return companyId;
};

export const hrCoreKeys = {
  all: (companyId: string) => ['hr-core', companyId] as const,
  departments: (companyId: string, query: ListQueryParams) =>
    ['hr-core', companyId, 'departments', query] as const,
  locations: (companyId: string, query: ListQueryParams) =>
    ['hr-core', companyId, 'locations', query] as const,
  users: (companyId: string, query: CompanyUsersListQueryParams) =>
    ['hr-core', companyId, 'users', query] as const,
  employees: (companyId: string, query: EmployeeListQueryParams) =>
    ['hr-core', companyId, 'employees', query] as const,
  employee: (companyId: string, employeeId: string) =>
    ['hr-core', companyId, 'employee', employeeId] as const,
  attendanceDevices: (
    companyId: string,
    query: AttendanceDeviceListQueryParams,
  ) => ['hr-core', companyId, 'attendance-devices', query] as const,
  attendanceDevice: (companyId: string, attendanceDeviceId: string) =>
    ['hr-core', companyId, 'attendance-device', attendanceDeviceId] as const,
  deviceUsers: (companyId: string, query: DeviceUserListQueryParams) =>
    ['hr-core', companyId, 'device-users', query] as const,
  deviceUser: (companyId: string, deviceUserId: string) =>
    ['hr-core', companyId, 'device-user', deviceUserId] as const,
  attendanceLogs: (companyId: string, query: AttendanceLogListQueryParams) =>
    ['hr-core', companyId, 'attendance-logs', query] as const,
  attendanceLog: (companyId: string, attendanceLogId: string) =>
    ['hr-core', companyId, 'attendance-log', attendanceLogId] as const,
  leaveTypes: (companyId: string, query: LeaveTypeListQueryParams) =>
    ['hr-core', companyId, 'leave-types', query] as const,
  leaveType: (companyId: string, leaveTypeId: string) =>
    ['hr-core', companyId, 'leave-type', leaveTypeId] as const,
  leaveRequests: (companyId: string, query: LeaveRequestListQueryParams) =>
    ['hr-core', companyId, 'leave-requests', query] as const,
  leaveRequest: (companyId: string, leaveRequestId: string) =>
    ['hr-core', companyId, 'leave-request', leaveRequestId] as const,
};

const invalidateHrCore = async (
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | undefined,
) => {
  if (!companyId) {
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: hrCoreKeys.all(companyId),
  });
};

export const useHrDepartments = (
  companyId: string | undefined,
  query: ListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.departments(companyId ?? 'no-company', query),
    queryFn: () => listHrDepartments(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useHrLocations = (
  companyId: string | undefined,
  query: ListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.locations(companyId ?? 'no-company', query),
    queryFn: () => listHrLocations(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useHrUsers = (
  companyId: string | undefined,
  query: CompanyUsersListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.users(companyId ?? 'no-company', query),
    queryFn: () => listHrUsers(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useEmployees = (
  companyId: string | undefined,
  query: EmployeeListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.employees(companyId ?? 'no-company', query),
    queryFn: () => listEmployees(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useEmployee = (
  companyId: string | undefined,
  employeeId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.employee(companyId ?? 'no-company', employeeId),
    queryFn: () => getEmployee(assertCompanyId(companyId), employeeId),
    enabled: enabled && Boolean(companyId) && employeeId.length > 0,
  });

export const useSaveEmployee = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId?: string;
      payload: CreateEmployeePayload | UpdateEmployeePayload;
    }) =>
      employeeId
        ? updateEmployee(
            assertCompanyId(companyId),
            employeeId,
            payload as UpdateEmployeePayload,
          )
        : createEmployee(
            assertCompanyId(companyId),
            payload as CreateEmployeePayload,
          ),
    onSuccess: async (employee) => {
      if (companyId) {
        queryClient.setQueryData(hrCoreKeys.employee(companyId, employee.id), employee);
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useToggleEmployee = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      isActive,
    }: {
      employeeId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateEmployee(assertCompanyId(companyId), employeeId)
        : activateEmployee(assertCompanyId(companyId), employeeId),
    onSuccess: async (employee) => {
      if (companyId) {
        queryClient.setQueryData(hrCoreKeys.employee(companyId, employee.id), employee);
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useAttendanceDevices = (
  companyId: string | undefined,
  query: AttendanceDeviceListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.attendanceDevices(companyId ?? 'no-company', query),
    queryFn: () => listAttendanceDevices(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useAttendanceDevice = (
  companyId: string | undefined,
  attendanceDeviceId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.attendanceDevice(
      companyId ?? 'no-company',
      attendanceDeviceId,
    ),
    queryFn: () =>
      getAttendanceDevice(assertCompanyId(companyId), attendanceDeviceId),
    enabled: enabled && Boolean(companyId) && attendanceDeviceId.length > 0,
  });

export const useSaveAttendanceDevice = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attendanceDeviceId,
      payload,
    }: {
      attendanceDeviceId?: string;
      payload: CreateAttendanceDevicePayload | UpdateAttendanceDevicePayload;
    }) =>
      attendanceDeviceId
        ? updateAttendanceDevice(
            assertCompanyId(companyId),
            attendanceDeviceId,
            payload as UpdateAttendanceDevicePayload,
          )
        : createAttendanceDevice(
            assertCompanyId(companyId),
            payload as CreateAttendanceDevicePayload,
          ),
    onSuccess: async (attendanceDevice) => {
      if (companyId) {
        queryClient.setQueryData(
          hrCoreKeys.attendanceDevice(companyId, attendanceDevice.id),
          attendanceDevice,
        );
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useToggleAttendanceDevice = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attendanceDeviceId,
      isActive,
    }: {
      attendanceDeviceId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateAttendanceDevice(
            assertCompanyId(companyId),
            attendanceDeviceId,
          )
        : activateAttendanceDevice(assertCompanyId(companyId), attendanceDeviceId),
    onSuccess: async (attendanceDevice) => {
      if (companyId) {
        queryClient.setQueryData(
          hrCoreKeys.attendanceDevice(companyId, attendanceDevice.id),
          attendanceDevice,
        );
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useDeviceUsers = (
  companyId: string | undefined,
  query: DeviceUserListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.deviceUsers(companyId ?? 'no-company', query),
    queryFn: () => listDeviceUsers(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useDeviceUser = (
  companyId: string | undefined,
  deviceUserId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.deviceUser(companyId ?? 'no-company', deviceUserId),
    queryFn: () => getDeviceUser(assertCompanyId(companyId), deviceUserId),
    enabled: enabled && Boolean(companyId) && deviceUserId.length > 0,
  });

export const useSaveDeviceUser = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deviceUserId,
      payload,
    }: {
      deviceUserId?: string;
      payload: CreateDeviceUserPayload | UpdateDeviceUserPayload;
    }) =>
      deviceUserId
        ? updateDeviceUser(
            assertCompanyId(companyId),
            deviceUserId,
            payload as UpdateDeviceUserPayload,
          )
        : createDeviceUser(
            assertCompanyId(companyId),
            payload as CreateDeviceUserPayload,
          ),
    onSuccess: async (deviceUser) => {
      if (companyId) {
        queryClient.setQueryData(hrCoreKeys.deviceUser(companyId, deviceUser.id), deviceUser);
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useToggleDeviceUser = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deviceUserId,
      isActive,
    }: {
      deviceUserId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateDeviceUser(assertCompanyId(companyId), deviceUserId)
        : activateDeviceUser(assertCompanyId(companyId), deviceUserId),
    onSuccess: async (deviceUser) => {
      if (companyId) {
        queryClient.setQueryData(hrCoreKeys.deviceUser(companyId, deviceUser.id), deviceUser);
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useAttendanceLogs = (
  companyId: string | undefined,
  query: AttendanceLogListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.attendanceLogs(companyId ?? 'no-company', query),
    queryFn: () => listAttendanceLogs(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useAttendanceLog = (
  companyId: string | undefined,
  attendanceLogId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.attendanceLog(companyId ?? 'no-company', attendanceLogId),
    queryFn: () => getAttendanceLog(assertCompanyId(companyId), attendanceLogId),
    enabled: enabled && Boolean(companyId) && attendanceLogId.length > 0,
  });

export const useCreateAttendanceLog = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAttendanceLogPayload) =>
      createAttendanceLog(assertCompanyId(companyId), payload),
    onSuccess: async (attendanceLog) => {
      if (companyId) {
        queryClient.setQueryData(
          hrCoreKeys.attendanceLog(companyId, attendanceLog.id),
          attendanceLog,
        );
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useBulkCreateAttendanceLogs = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkCreateAttendanceLogsPayload) =>
      bulkCreateAttendanceLogs(assertCompanyId(companyId), payload),
    onSuccess: async () => {
      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useLeaveTypes = (
  companyId: string | undefined,
  query: LeaveTypeListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.leaveTypes(companyId ?? 'no-company', query),
    queryFn: () => listLeaveTypes(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useLeaveType = (
  companyId: string | undefined,
  leaveTypeId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.leaveType(companyId ?? 'no-company', leaveTypeId),
    queryFn: () => getLeaveType(assertCompanyId(companyId), leaveTypeId),
    enabled: enabled && Boolean(companyId) && leaveTypeId.length > 0,
  });

export const useSaveLeaveType = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leaveTypeId,
      payload,
    }: {
      leaveTypeId?: string;
      payload: CreateLeaveTypePayload | UpdateLeaveTypePayload;
    }) =>
      leaveTypeId
        ? updateLeaveType(
            assertCompanyId(companyId),
            leaveTypeId,
            payload as UpdateLeaveTypePayload,
          )
        : createLeaveType(
            assertCompanyId(companyId),
            payload as CreateLeaveTypePayload,
          ),
    onSuccess: async (leaveType) => {
      if (companyId) {
        queryClient.setQueryData(hrCoreKeys.leaveType(companyId, leaveType.id), leaveType);
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useToggleLeaveType = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leaveTypeId,
      isActive,
    }: {
      leaveTypeId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateLeaveType(assertCompanyId(companyId), leaveTypeId)
        : activateLeaveType(assertCompanyId(companyId), leaveTypeId),
    onSuccess: async (leaveType) => {
      if (companyId) {
        queryClient.setQueryData(hrCoreKeys.leaveType(companyId, leaveType.id), leaveType);
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useLeaveRequests = (
  companyId: string | undefined,
  query: LeaveRequestListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.leaveRequests(companyId ?? 'no-company', query),
    queryFn: () => listLeaveRequests(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useLeaveRequest = (
  companyId: string | undefined,
  leaveRequestId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: hrCoreKeys.leaveRequest(companyId ?? 'no-company', leaveRequestId),
    queryFn: () => getLeaveRequest(assertCompanyId(companyId), leaveRequestId),
    enabled: enabled && Boolean(companyId) && leaveRequestId.length > 0,
  });

export const useSaveLeaveRequest = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leaveRequestId,
      payload,
    }: {
      leaveRequestId?: string;
      payload: CreateLeaveRequestPayload | UpdateLeaveRequestPayload;
    }) =>
      leaveRequestId
        ? updateLeaveRequest(
            assertCompanyId(companyId),
            leaveRequestId,
            payload as UpdateLeaveRequestPayload,
          )
        : createLeaveRequest(
            assertCompanyId(companyId),
            payload as CreateLeaveRequestPayload,
          ),
    onSuccess: async (leaveRequest) => {
      if (companyId) {
        queryClient.setQueryData(
          hrCoreKeys.leaveRequest(companyId, leaveRequest.id),
          leaveRequest,
        );
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};

export const useLeaveRequestAction = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leaveRequestId,
      action,
      payload,
    }: {
      leaveRequestId: string;
      action: 'submit' | 'approve' | 'reject' | 'cancel';
      payload?: LeaveRequestActionPayload;
    }) => {
      const resolvedCompanyId = assertCompanyId(companyId);

      switch (action) {
        case 'submit':
          return submitLeaveRequest(resolvedCompanyId, leaveRequestId);
        case 'approve':
          return approveLeaveRequest(
            resolvedCompanyId,
            leaveRequestId,
            payload ?? {},
          );
        case 'reject':
          return rejectLeaveRequest(
            resolvedCompanyId,
            leaveRequestId,
            payload ?? {},
          );
        case 'cancel':
          return cancelLeaveRequest(
            resolvedCompanyId,
            leaveRequestId,
            payload ?? {},
          );
      }
    },
    onSuccess: async (leaveRequest) => {
      if (companyId) {
        queryClient.setQueryData(
          hrCoreKeys.leaveRequest(companyId, leaveRequest.id),
          leaveRequest,
        );
      }

      await invalidateHrCore(queryClient, companyId);
    },
  });
};
