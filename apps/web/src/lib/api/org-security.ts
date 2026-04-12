import { HEALTH_ROUTE } from '@real-capita/config';
import type { HealthCheckResponse } from '@real-capita/types';

import { apiRequest } from './client';
import { buildQueryString } from './query-string';
import type {
  AssignRolePayload,
  CompanyListQueryParams,
  CompanyRecord,
  CompanyUserRecord,
  CompanyUsersListQueryParams,
  CreateCompanyPayload,
  CreateCompanyUserPayload,
  CreateDepartmentPayload,
  CreateLocationPayload,
  DepartmentRecord,
  ListQueryParams,
  LocationRecord,
  PaginatedResponse,
  RoleAssignmentRecord,
  RoleListQueryParams,
  RoleRecord,
  UpdateCompanyPayload,
  UpdateCompanyUserPayload,
  UpdateDepartmentPayload,
  UpdateLocationPayload,
} from './types';

export const fetchHealthStatus = () =>
  apiRequest<HealthCheckResponse>(HEALTH_ROUTE, {
    authMode: 'public',
    retryOnUnauthorized: false,
  });

export const listCompanies = (query: CompanyListQueryParams) =>
  apiRequest<PaginatedResponse<CompanyRecord>>(
    `companies${buildQueryString(query)}`,
  );

export const createCompany = (payload: CreateCompanyPayload) =>
  apiRequest<CompanyRecord>('companies', {
    method: 'POST',
    body: payload,
  });

export const updateCompany = (
  companyId: string,
  payload: UpdateCompanyPayload,
) =>
  apiRequest<CompanyRecord>(`companies/${companyId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateCompany = (companyId: string) =>
  apiRequest<CompanyRecord>(`companies/${companyId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateCompany = (companyId: string) =>
  apiRequest<CompanyRecord>(`companies/${companyId}/deactivate`, {
    method: 'POST',
    body: {},
  });

export const listLocations = (
  companyId: string,
  query: ListQueryParams,
) =>
  apiRequest<PaginatedResponse<LocationRecord>>(
    `companies/${companyId}/locations${buildQueryString(query)}`,
  );

export const createLocation = (
  companyId: string,
  payload: CreateLocationPayload,
) =>
  apiRequest<LocationRecord>(`companies/${companyId}/locations`, {
    method: 'POST',
    body: payload,
  });

export const updateLocation = (
  companyId: string,
  locationId: string,
  payload: UpdateLocationPayload,
) =>
  apiRequest<LocationRecord>(
    `companies/${companyId}/locations/${locationId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateLocation = (companyId: string, locationId: string) =>
  apiRequest<LocationRecord>(
    `companies/${companyId}/locations/${locationId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateLocation = (companyId: string, locationId: string) =>
  apiRequest<LocationRecord>(
    `companies/${companyId}/locations/${locationId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listDepartments = (
  companyId: string,
  query: ListQueryParams,
) =>
  apiRequest<PaginatedResponse<DepartmentRecord>>(
    `companies/${companyId}/departments${buildQueryString(query)}`,
  );

export const createDepartment = (
  companyId: string,
  payload: CreateDepartmentPayload,
) =>
  apiRequest<DepartmentRecord>(`companies/${companyId}/departments`, {
    method: 'POST',
    body: payload,
  });

export const updateDepartment = (
  companyId: string,
  departmentId: string,
  payload: UpdateDepartmentPayload,
) =>
  apiRequest<DepartmentRecord>(
    `companies/${companyId}/departments/${departmentId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateDepartment = (
  companyId: string,
  departmentId: string,
) =>
  apiRequest<DepartmentRecord>(
    `companies/${companyId}/departments/${departmentId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateDepartment = (
  companyId: string,
  departmentId: string,
) =>
  apiRequest<DepartmentRecord>(
    `companies/${companyId}/departments/${departmentId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listUsers = (
  companyId: string,
  query: CompanyUsersListQueryParams,
) =>
  apiRequest<PaginatedResponse<CompanyUserRecord>>(
    `companies/${companyId}/users${buildQueryString(query)}`,
  );

export const createUser = (
  companyId: string,
  payload: CreateCompanyUserPayload,
) =>
  apiRequest<CompanyUserRecord>(`companies/${companyId}/users`, {
    method: 'POST',
    body: payload,
  });

export const updateUser = (
  companyId: string,
  userId: string,
  payload: UpdateCompanyUserPayload,
) =>
  apiRequest<CompanyUserRecord>(`companies/${companyId}/users/${userId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateUser = (companyId: string, userId: string) =>
  apiRequest<CompanyUserRecord>(`companies/${companyId}/users/${userId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateUser = (companyId: string, userId: string) =>
  apiRequest<CompanyUserRecord>(
    `companies/${companyId}/users/${userId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listRoles = (query: RoleListQueryParams = {}) =>
  apiRequest<PaginatedResponse<RoleRecord>>(`roles${buildQueryString(query)}`);

export const listRoleAssignments = (
  companyId: string,
  userId: string,
  query: ListQueryParams = {},
) =>
  apiRequest<PaginatedResponse<RoleAssignmentRecord>>(
    `companies/${companyId}/users/${userId}/roles${buildQueryString(query)}`,
  );

export const assignRole = (
  companyId: string,
  userId: string,
  payload: AssignRolePayload,
) =>
  apiRequest<RoleAssignmentRecord>(`companies/${companyId}/users/${userId}/roles`, {
    method: 'POST',
    body: payload,
  });

export const removeRole = (
  companyId: string,
  userId: string,
  roleCode: string,
) =>
  apiRequest<RoleAssignmentRecord>(
    `companies/${companyId}/users/${userId}/roles/${roleCode}`,
    {
      method: 'DELETE',
    },
  );
