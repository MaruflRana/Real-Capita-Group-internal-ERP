'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateSalaryStructure,
  cancelPayrollRun,
  createPayrollRun,
  createPayrollRunLine,
  createSalaryStructure,
  deactivateSalaryStructure,
  finalizePayrollRun,
  getPayrollRun,
  getSalaryStructure,
  listPayrollCostCenters,
  listPayrollEmployees,
  listPayrollParticularAccounts,
  listPayrollProjects,
  listPayrollRunLines,
  listPayrollRuns,
  listSalaryStructures,
  postPayrollRun,
  removePayrollRunLine,
  updatePayrollRun,
  updatePayrollRunLine,
  updateSalaryStructure,
} from '../../lib/api/payroll';
import type {
  CostCenterListQueryParams,
  CreatePayrollRunLinePayload,
  CreatePayrollRunPayload,
  CreateSalaryStructurePayload,
  EmployeeListQueryParams,
  ParticularAccountListQueryParams,
  PayrollRunLineListQueryParams,
  PayrollRunListQueryParams,
  PostPayrollRunPayload,
  ProjectListQueryParams,
  SalaryStructureListQueryParams,
  SalaryStructureRecord,
  UpdatePayrollRunLinePayload,
  UpdatePayrollRunPayload,
  UpdateSalaryStructurePayload,
} from '../../lib/api/types';

const assertCompanyId = (companyId: string | undefined): string => {
  if (!companyId) {
    throw new Error('A company context is required for payroll operations.');
  }

  return companyId;
};

export const payrollKeys = {
  all: (companyId: string) => ['payroll-core', companyId] as const,
  projects: (companyId: string, query: ProjectListQueryParams) =>
    ['payroll-core', companyId, 'projects', query] as const,
  costCenters: (companyId: string, query: CostCenterListQueryParams) =>
    ['payroll-core', companyId, 'cost-centers', query] as const,
  employees: (companyId: string, query: EmployeeListQueryParams) =>
    ['payroll-core', companyId, 'employees', query] as const,
  particularAccounts: (
    companyId: string,
    query: ParticularAccountListQueryParams,
  ) => ['payroll-core', companyId, 'particular-accounts', query] as const,
  salaryStructures: (
    companyId: string,
    query: SalaryStructureListQueryParams,
  ) => ['payroll-core', companyId, 'salary-structures', query] as const,
  salaryStructure: (companyId: string, salaryStructureId: string) =>
    ['payroll-core', companyId, 'salary-structure', salaryStructureId] as const,
  payrollRuns: (companyId: string, query: PayrollRunListQueryParams) =>
    ['payroll-core', companyId, 'payroll-runs', query] as const,
  payrollRun: (companyId: string, payrollRunId: string) =>
    ['payroll-core', companyId, 'payroll-run', payrollRunId] as const,
  payrollRunLines: (
    companyId: string,
    payrollRunId: string,
    query: PayrollRunLineListQueryParams,
  ) => ['payroll-core', companyId, 'payroll-run-lines', payrollRunId, query] as const,
};

const invalidatePayroll = async (
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | undefined,
) => {
  if (!companyId) {
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: payrollKeys.all(companyId),
  });
};

const writeSalaryStructureCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  salaryStructure: SalaryStructureRecord,
) => {
  queryClient.setQueryData(
    payrollKeys.salaryStructure(salaryStructure.companyId, salaryStructure.id),
    salaryStructure,
  );
};

export const usePayrollProjects = (
  companyId: string | undefined,
  query: ProjectListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.projects(companyId ?? 'no-company', query),
    queryFn: () => listPayrollProjects(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const usePayrollCostCenters = (
  companyId: string | undefined,
  query: CostCenterListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.costCenters(companyId ?? 'no-company', query),
    queryFn: () => listPayrollCostCenters(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const usePayrollEmployees = (
  companyId: string | undefined,
  query: EmployeeListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.employees(companyId ?? 'no-company', query),
    queryFn: () => listPayrollEmployees(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const usePayrollParticularAccounts = (
  companyId: string | undefined,
  query: ParticularAccountListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.particularAccounts(companyId ?? 'no-company', query),
    queryFn: () => listPayrollParticularAccounts(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useSalaryStructures = (
  companyId: string | undefined,
  query: SalaryStructureListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.salaryStructures(companyId ?? 'no-company', query),
    queryFn: () => listSalaryStructures(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useSalaryStructure = (
  companyId: string | undefined,
  salaryStructureId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.salaryStructure(companyId ?? 'no-company', salaryStructureId),
    queryFn: () => getSalaryStructure(assertCompanyId(companyId), salaryStructureId),
    enabled: enabled && Boolean(companyId) && salaryStructureId.length > 0,
  });

export const useSaveSalaryStructure = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      salaryStructureId,
      payload,
    }: {
      salaryStructureId?: string;
      payload: CreateSalaryStructurePayload | UpdateSalaryStructurePayload;
    }) =>
      salaryStructureId
        ? updateSalaryStructure(
            assertCompanyId(companyId),
            salaryStructureId,
            payload as UpdateSalaryStructurePayload,
          )
        : createSalaryStructure(
            assertCompanyId(companyId),
            payload as CreateSalaryStructurePayload,
          ),
    onSuccess: async (salaryStructure) => {
      writeSalaryStructureCache(queryClient, salaryStructure);
      await invalidatePayroll(queryClient, companyId);
    },
  });
};

export const useToggleSalaryStructure = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      salaryStructureId,
      isActive,
    }: {
      salaryStructureId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateSalaryStructure(assertCompanyId(companyId), salaryStructureId)
        : activateSalaryStructure(assertCompanyId(companyId), salaryStructureId),
    onSuccess: async (salaryStructure) => {
      writeSalaryStructureCache(queryClient, salaryStructure);
      await invalidatePayroll(queryClient, companyId);
    },
  });
};

export const usePayrollRuns = (
  companyId: string | undefined,
  query: PayrollRunListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.payrollRuns(companyId ?? 'no-company', query),
    queryFn: () => listPayrollRuns(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const usePayrollRun = (
  companyId: string | undefined,
  payrollRunId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.payrollRun(companyId ?? 'no-company', payrollRunId),
    queryFn: () => getPayrollRun(assertCompanyId(companyId), payrollRunId),
    enabled: enabled && Boolean(companyId) && payrollRunId.length > 0,
  });

export const useSavePayrollRun = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payrollRunId,
      payload,
    }: {
      payrollRunId?: string;
      payload: CreatePayrollRunPayload | UpdatePayrollRunPayload;
    }) =>
      payrollRunId
        ? updatePayrollRun(
            assertCompanyId(companyId),
            payrollRunId,
            payload as UpdatePayrollRunPayload,
          )
        : createPayrollRun(
            assertCompanyId(companyId),
            payload as CreatePayrollRunPayload,
          ),
    onSuccess: async (payrollRun) => {
      if (companyId) {
        queryClient.setQueryData(payrollKeys.payrollRun(companyId, payrollRun.id), payrollRun);
      }

      await invalidatePayroll(queryClient, companyId);
    },
  });
};

export const usePayrollRunLifecycle = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payrollRunId,
      action,
    }: {
      payrollRunId: string;
      action: 'finalize' | 'cancel';
    }) =>
      action === 'finalize'
        ? finalizePayrollRun(assertCompanyId(companyId), payrollRunId)
        : cancelPayrollRun(assertCompanyId(companyId), payrollRunId),
    onSuccess: async (payrollRun) => {
      if (companyId) {
        queryClient.setQueryData(payrollKeys.payrollRun(companyId, payrollRun.id), payrollRun);
      }

      await invalidatePayroll(queryClient, companyId);
    },
  });
};

export const usePostPayrollRun = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payrollRunId,
      payload,
    }: {
      payrollRunId: string;
      payload: PostPayrollRunPayload;
    }) => postPayrollRun(assertCompanyId(companyId), payrollRunId, payload),
    onSuccess: async (payrollRun) => {
      if (companyId) {
        queryClient.setQueryData(payrollKeys.payrollRun(companyId, payrollRun.id), payrollRun);
      }

      await invalidatePayroll(queryClient, companyId);
    },
  });
};

export const usePayrollRunLines = (
  companyId: string | undefined,
  payrollRunId: string,
  query: PayrollRunLineListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: payrollKeys.payrollRunLines(
      companyId ?? 'no-company',
      payrollRunId,
      query,
    ),
    queryFn: () => listPayrollRunLines(assertCompanyId(companyId), payrollRunId, query),
    enabled: enabled && Boolean(companyId) && payrollRunId.length > 0,
  });

export const useSavePayrollRunLine = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payrollRunId,
      payrollRunLineId,
      payload,
    }: {
      payrollRunId: string;
      payrollRunLineId?: string;
      payload: CreatePayrollRunLinePayload | UpdatePayrollRunLinePayload;
    }) =>
      payrollRunLineId
        ? updatePayrollRunLine(
            assertCompanyId(companyId),
            payrollRunId,
            payrollRunLineId,
            payload as UpdatePayrollRunLinePayload,
          )
        : createPayrollRunLine(
            assertCompanyId(companyId),
            payrollRunId,
            payload as CreatePayrollRunLinePayload,
          ),
    onSuccess: async () => {
      await invalidatePayroll(queryClient, companyId);
    },
  });
};

export const useRemovePayrollRunLine = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payrollRunId,
      payrollRunLineId,
    }: {
      payrollRunId: string;
      payrollRunLineId: string;
    }) =>
      removePayrollRunLine(
        assertCompanyId(companyId),
        payrollRunId,
        payrollRunLineId,
      ),
    onSuccess: async () => {
      await invalidatePayroll(queryClient, companyId);
    },
  });
};
