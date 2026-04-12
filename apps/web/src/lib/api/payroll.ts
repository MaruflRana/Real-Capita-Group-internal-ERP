import { apiRequest } from './client';
import { buildQueryString } from './query-string';
import type {
  CreatePayrollRunLinePayload,
  CreatePayrollRunPayload,
  CreateSalaryStructurePayload,
  EmployeeListQueryParams,
  PaginatedResponse,
  ParticularAccountListQueryParams,
  PayrollRunLineListQueryParams,
  PayrollRunLineRecord,
  PayrollRunListQueryParams,
  PayrollRunRecord,
  PostPayrollRunPayload,
  ProjectListQueryParams,
  ProjectRecord,
  CostCenterListQueryParams,
  CostCenterRecord,
  SalaryStructureListQueryParams,
  SalaryStructureRecord,
  ParticularAccountRecord,
  EmployeeRecord,
  UpdatePayrollRunLinePayload,
  UpdatePayrollRunPayload,
  UpdateSalaryStructurePayload,
} from './types';

export const listPayrollProjects = (
  companyId: string,
  query: ProjectListQueryParams,
) =>
  apiRequest<PaginatedResponse<ProjectRecord>>(
    `companies/${companyId}/payroll/references/projects${buildQueryString(query)}`,
  );

export const listPayrollCostCenters = (
  companyId: string,
  query: CostCenterListQueryParams,
) =>
  apiRequest<PaginatedResponse<CostCenterRecord>>(
    `companies/${companyId}/payroll/references/cost-centers${buildQueryString(query)}`,
  );

export const listPayrollEmployees = (
  companyId: string,
  query: EmployeeListQueryParams,
) =>
  apiRequest<PaginatedResponse<EmployeeRecord>>(
    `companies/${companyId}/payroll/references/employees${buildQueryString(query)}`,
  );

export const listPayrollParticularAccounts = (
  companyId: string,
  query: ParticularAccountListQueryParams,
) =>
  apiRequest<PaginatedResponse<ParticularAccountRecord>>(
    `companies/${companyId}/payroll/references/particular-accounts${buildQueryString(query)}`,
  );

export const listSalaryStructures = (
  companyId: string,
  query: SalaryStructureListQueryParams,
) =>
  apiRequest<PaginatedResponse<SalaryStructureRecord>>(
    `companies/${companyId}/salary-structures${buildQueryString(query)}`,
  );

export const getSalaryStructure = (
  companyId: string,
  salaryStructureId: string,
) =>
  apiRequest<SalaryStructureRecord>(
    `companies/${companyId}/salary-structures/${salaryStructureId}`,
  );

export const createSalaryStructure = (
  companyId: string,
  payload: CreateSalaryStructurePayload,
) =>
  apiRequest<SalaryStructureRecord>(`companies/${companyId}/salary-structures`, {
    method: 'POST',
    body: payload,
  });

export const updateSalaryStructure = (
  companyId: string,
  salaryStructureId: string,
  payload: UpdateSalaryStructurePayload,
) =>
  apiRequest<SalaryStructureRecord>(
    `companies/${companyId}/salary-structures/${salaryStructureId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateSalaryStructure = (
  companyId: string,
  salaryStructureId: string,
) =>
  apiRequest<SalaryStructureRecord>(
    `companies/${companyId}/salary-structures/${salaryStructureId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateSalaryStructure = (
  companyId: string,
  salaryStructureId: string,
) =>
  apiRequest<SalaryStructureRecord>(
    `companies/${companyId}/salary-structures/${salaryStructureId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listPayrollRuns = (
  companyId: string,
  query: PayrollRunListQueryParams,
) =>
  apiRequest<PaginatedResponse<PayrollRunRecord>>(
    `companies/${companyId}/payroll-runs${buildQueryString(query)}`,
  );

export const getPayrollRun = (companyId: string, payrollRunId: string) =>
  apiRequest<PayrollRunRecord>(`companies/${companyId}/payroll-runs/${payrollRunId}`);

export const createPayrollRun = (
  companyId: string,
  payload: CreatePayrollRunPayload,
) =>
  apiRequest<PayrollRunRecord>(`companies/${companyId}/payroll-runs`, {
    method: 'POST',
    body: payload,
  });

export const updatePayrollRun = (
  companyId: string,
  payrollRunId: string,
  payload: UpdatePayrollRunPayload,
) =>
  apiRequest<PayrollRunRecord>(
    `companies/${companyId}/payroll-runs/${payrollRunId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const finalizePayrollRun = (companyId: string, payrollRunId: string) =>
  apiRequest<PayrollRunRecord>(
    `companies/${companyId}/payroll-runs/${payrollRunId}/finalize`,
    {
      method: 'POST',
      body: {},
    },
  );

export const cancelPayrollRun = (companyId: string, payrollRunId: string) =>
  apiRequest<PayrollRunRecord>(
    `companies/${companyId}/payroll-runs/${payrollRunId}/cancel`,
    {
      method: 'POST',
      body: {},
    },
  );

export const postPayrollRun = (
  companyId: string,
  payrollRunId: string,
  payload: PostPayrollRunPayload,
) =>
  apiRequest<PayrollRunRecord>(
    `companies/${companyId}/payroll-runs/${payrollRunId}/post`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const listPayrollRunLines = (
  companyId: string,
  payrollRunId: string,
  query: PayrollRunLineListQueryParams,
) =>
  apiRequest<PaginatedResponse<PayrollRunLineRecord>>(
    `companies/${companyId}/payroll-runs/${payrollRunId}/lines${buildQueryString(query)}`,
  );

export const createPayrollRunLine = (
  companyId: string,
  payrollRunId: string,
  payload: CreatePayrollRunLinePayload,
) =>
  apiRequest<PayrollRunLineRecord>(
    `companies/${companyId}/payroll-runs/${payrollRunId}/lines`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const updatePayrollRunLine = (
  companyId: string,
  payrollRunId: string,
  payrollRunLineId: string,
  payload: UpdatePayrollRunLinePayload,
) =>
  apiRequest<PayrollRunLineRecord>(
    `companies/${companyId}/payroll-runs/${payrollRunId}/lines/${payrollRunLineId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const removePayrollRunLine = (
  companyId: string,
  payrollRunId: string,
  payrollRunLineId: string,
) =>
  apiRequest<void>(
    `companies/${companyId}/payroll-runs/${payrollRunId}/lines/${payrollRunLineId}`,
    {
      method: 'DELETE',
    },
  );
