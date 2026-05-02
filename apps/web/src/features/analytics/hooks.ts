'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getAccountingAnalytics,
  getAuditDocumentAnalytics,
  getCrmAnalytics,
  getDashboardAnalytics,
  getHrAnalytics,
  getPayrollAnalytics,
  getProjectPropertyAnalytics,
} from '../../lib/api/analytics';
import type { DashboardAccess, DashboardPeriod } from '../../lib/api/dashboard';

const ANALYTICS_STALE_TIME_MS = 60_000;

const assertCompanyId = (companyId: string | undefined) => {
  if (!companyId) {
    throw new Error('A company context is required for analytics.');
  }

  return companyId;
};

const buildPeriodKey = (
  period:
    | Partial<Pick<DashboardPeriod, 'dateFrom' | 'dateTo' | 'asOfDate'>>
    | undefined,
) => [period?.dateFrom ?? '', period?.dateTo ?? '', period?.asOfDate ?? ''];

const buildAccessKey = (access: DashboardAccess) => [
  access.dashboard,
  access.accounting,
  access.financialReports,
  access.projectProperty,
  access.crm,
  access.hr,
  access.payroll,
  access.documents,
  access.auditEvents,
  access.orgSecurity,
] as const;

export const analyticsKeys = {
  dashboard: (
    companyId: string,
    access: DashboardAccess,
    period: DashboardPeriod,
  ) =>
    [
      'analytics',
      companyId,
      'dashboard',
      ...buildAccessKey(access),
      ...buildPeriodKey(period),
    ] as const,
  accounting: (
    companyId: string,
    period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
  ) =>
    ['analytics', companyId, 'accounting', ...buildPeriodKey(period)] as const,
  property: (companyId: string) =>
    ['analytics', companyId, 'project-property'] as const,
  crm: (
    companyId: string,
    period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
  ) => ['analytics', companyId, 'crm', ...buildPeriodKey(period)] as const,
  hr: (
    companyId: string,
    period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
  ) => ['analytics', companyId, 'hr', ...buildPeriodKey(period)] as const,
  payroll: (companyId: string) => ['analytics', companyId, 'payroll'] as const,
  auditDocuments: (
    companyId: string,
    period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
  ) =>
    ['analytics', companyId, 'audit-documents', ...buildPeriodKey(period)] as const,
};

export const useDashboardAnalytics = (
  companyId: string | undefined,
  access: DashboardAccess,
  period: DashboardPeriod,
) =>
  useQuery({
    queryKey: analyticsKeys.dashboard(companyId ?? 'no-company', access, period),
    queryFn: () =>
      getDashboardAnalytics(assertCompanyId(companyId), access, period),
    enabled: Boolean(companyId) && access.dashboard,
    placeholderData: (previousData) => previousData,
    staleTime: ANALYTICS_STALE_TIME_MS,
  });

export const useAccountingAnalytics = (
  companyId: string | undefined,
  enabled = true,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
) =>
  useQuery({
    queryKey: analyticsKeys.accounting(companyId ?? 'no-company', period),
    queryFn: () => getAccountingAnalytics(assertCompanyId(companyId), period),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
    staleTime: ANALYTICS_STALE_TIME_MS,
  });

export const useProjectPropertyAnalytics = (
  companyId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: analyticsKeys.property(companyId ?? 'no-company'),
    queryFn: () => getProjectPropertyAnalytics(assertCompanyId(companyId)),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
    staleTime: ANALYTICS_STALE_TIME_MS,
  });

export const useCrmAnalytics = (
  companyId: string | undefined,
  enabled = true,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
) =>
  useQuery({
    queryKey: analyticsKeys.crm(companyId ?? 'no-company', period),
    queryFn: () => getCrmAnalytics(assertCompanyId(companyId), period),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
    staleTime: ANALYTICS_STALE_TIME_MS,
  });

export const useHrAnalytics = (
  companyId: string | undefined,
  enabled = true,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
) =>
  useQuery({
    queryKey: analyticsKeys.hr(companyId ?? 'no-company', period),
    queryFn: () => getHrAnalytics(assertCompanyId(companyId), period),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
    staleTime: ANALYTICS_STALE_TIME_MS,
  });

export const usePayrollAnalytics = (
  companyId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: analyticsKeys.payroll(companyId ?? 'no-company'),
    queryFn: () => getPayrollAnalytics(assertCompanyId(companyId)),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
    staleTime: ANALYTICS_STALE_TIME_MS,
  });

export const useAuditDocumentAnalytics = (
  companyId: string | undefined,
  enabled = true,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
) =>
  useQuery({
    queryKey: analyticsKeys.auditDocuments(companyId ?? 'no-company', period),
    queryFn: () => getAuditDocumentAnalytics(assertCompanyId(companyId), period),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
    staleTime: ANALYTICS_STALE_TIME_MS,
  });
