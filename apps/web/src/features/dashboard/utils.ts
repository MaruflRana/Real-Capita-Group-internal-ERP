'use client';

import {
  Activity,
  BookOpenText,
  ClipboardList,
  FileText,
  FolderKanban,
  HandCoins,
  LayoutList,
  ReceiptText,
  Users,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';

import type { DashboardAccess, DashboardPeriod } from '../../lib/api/dashboard';

export type DashboardPeriodPresetId =
  | 'all-activity'
  | 'last-30-days'
  | 'last-90-days'
  | 'year-to-date';

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const shiftDateByDays = (value: Date, days: number) => {
  const result = new Date(value);

  result.setDate(result.getDate() + days);

  return result;
};

export const buildDashboardPeriod = (
  presetId: DashboardPeriodPresetId,
  now = new Date(),
): DashboardPeriod => {
  const today = toIsoDate(now);

  switch (presetId) {
    case 'last-30-days':
      return {
        id: presetId,
        label: 'Last 30 days',
        dateFrom: toIsoDate(shiftDateByDays(now, -29)),
        dateTo: today,
        asOfDate: today,
      };
    case 'last-90-days':
      return {
        id: presetId,
        label: 'Last 90 days',
        dateFrom: toIsoDate(shiftDateByDays(now, -89)),
        dateTo: today,
        asOfDate: today,
      };
    case 'year-to-date':
      return {
        id: presetId,
        label: 'Year to date',
        dateFrom: `${now.getFullYear()}-01-01`,
        dateTo: today,
        asOfDate: today,
      };
    case 'all-activity':
    default:
      return {
        id: 'all-activity',
        label: 'All activity',
        dateFrom: '1900-01-01',
        dateTo: '2100-12-31',
        asOfDate: '2100-12-31',
      };
  }
};

export const DASHBOARD_PERIOD_PRESETS: DashboardPeriodPresetId[] = [
  'all-activity',
  'last-30-days',
  'last-90-days',
  'year-to-date',
];

export const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');

export const getAccessibleWorkspaceLabels = (access: DashboardAccess) => {
  const items = [
    access.accounting ? 'Accounting' : null,
    access.projectProperty ? 'Project / Property' : null,
    access.crm ? 'CRM / Sales' : null,
    access.hr ? 'HR' : null,
    access.payroll ? 'Payroll' : null,
    access.documents ? 'Documents' : null,
    access.auditEvents ? 'Audit' : null,
  ];

  return items.filter((item): item is string => Boolean(item));
};

const QUICK_ACTIONS = [
  {
    id: 'new-voucher',
    title: 'New voucher',
    description: 'Start a draft accounting voucher.',
    href: APP_ROUTES.accountingVoucherCreate,
    icon: ReceiptText,
    isVisible: (access: DashboardAccess) => access.accounting,
  },
  {
    id: 'chart-of-accounts',
    title: 'Chart of accounts',
    description: 'Review or maintain the account hierarchy.',
    href: APP_ROUTES.accountingChartOfAccounts,
    icon: BookOpenText,
    isVisible: (access: DashboardAccess) => access.accounting,
  },
  {
    id: 'units-master',
    title: 'Units master',
    description: 'Open the current project inventory view.',
    href: APP_ROUTES.projectPropertyUnits,
    icon: LayoutList,
    isVisible: (access: DashboardAccess) => access.projectProperty,
  },
  {
    id: 'new-booking',
    title: 'New booking',
    description: 'Jump into active booking operations.',
    href: APP_ROUTES.crmPropertyDeskBookings,
    icon: ClipboardList,
    isVisible: (access: DashboardAccess) => access.crm,
  },
  {
    id: 'employees',
    title: 'Employees',
    description: 'Review or add employee records.',
    href: APP_ROUTES.hrEmployees,
    icon: Users,
    isVisible: (access: DashboardAccess) => access.hr,
  },
  {
    id: 'payroll-runs',
    title: 'Payroll runs',
    description: 'Manage draft and finalized payroll periods.',
    href: APP_ROUTES.payrollRuns,
    icon: HandCoins,
    isVisible: (access: DashboardAccess) => access.payroll,
  },
  {
    id: 'financial-reports',
    title: 'Financial reports',
    description: 'Open the existing reporting workspace.',
    href: APP_ROUTES.accountingReportsTrialBalance,
    icon: FileText,
    isVisible: (access: DashboardAccess) => access.accounting,
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Review attachments and document state.',
    href: APP_ROUTES.auditDocumentsAttachments,
    icon: FolderKanban,
    isVisible: (access: DashboardAccess) => access.documents,
  },
  {
    id: 'audit-events',
    title: 'Audit events',
    description: 'Inspect recent system activity.',
    href: APP_ROUTES.auditDocumentsAuditEvents,
    icon: Activity,
    isVisible: (access: DashboardAccess) => access.auditEvents,
  },
] as const;

export const getDashboardQuickActions = (access: DashboardAccess) =>
  QUICK_ACTIONS.filter((action) => action.isVisible(access));
