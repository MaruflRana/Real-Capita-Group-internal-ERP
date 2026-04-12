'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getDashboardActivity,
  getDashboardSummary,
} from '../../lib/api/dashboard';

import type {
  DashboardAccess,
  DashboardPeriod,
} from '../../lib/api/dashboard';

const DASHBOARD_STALE_TIME_MS = 60_000;

const assertCompanyId = (companyId: string | undefined) => {
  if (!companyId) {
    throw new Error('A company context is required for dashboard operations.');
  }

  return companyId;
};

const buildAccessKey = (access: DashboardAccess) => [
  access.accounting,
  access.projectProperty,
  access.crm,
  access.hr,
  access.payroll,
  access.documents,
  access.auditEvents,
] as const;

export const dashboardKeys = {
  summary: (
    companyId: string,
    access: DashboardAccess,
    period: DashboardPeriod,
  ) =>
    [
      'dashboard',
      companyId,
      'summary',
      ...buildAccessKey(access),
      period.id,
      period.dateFrom,
      period.dateTo,
    ] as const,
  activity: (companyId: string, access: DashboardAccess) =>
    ['dashboard', companyId, 'activity', ...buildAccessKey(access)] as const,
};

export const useDashboardSummary = (
  companyId: string | undefined,
  access: DashboardAccess,
  period: DashboardPeriod,
) =>
  useQuery({
    queryKey: dashboardKeys.summary(companyId ?? 'no-company', access, period),
    queryFn: () => getDashboardSummary(assertCompanyId(companyId), access, period),
    enabled: Boolean(companyId),
    placeholderData: (previousData) => previousData,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

export const useDashboardActivity = (
  companyId: string | undefined,
  access: DashboardAccess,
) =>
  useQuery({
    queryKey: dashboardKeys.activity(companyId ?? 'no-company', access),
    queryFn: () => getDashboardActivity(assertCompanyId(companyId), access),
    enabled: Boolean(companyId),
    placeholderData: (previousData) => previousData,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });
