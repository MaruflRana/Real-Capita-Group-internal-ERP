import {
  buildPhase1AccessSummary,
  COMPANY_ROLE_LABELS,
  PHASE1_ACCESS_MATRIX,
  type Phase1AccessSummary,
  type Phase1ModuleKey,
} from '@real-capita/config';

import type { CurrentUser } from './api/types';

interface RouteAccessRequirement {
  moduleKey: Phase1ModuleKey;
  pathnamePrefix: string;
}

const ROUTE_ACCESS_REQUIREMENTS: RouteAccessRequirement[] = [
  {
    moduleKey: 'auditEvents',
    pathnamePrefix: '/audit-documents/audit-events',
  },
  {
    moduleKey: 'auditDocuments',
    pathnamePrefix: '/audit-documents',
  },
  {
    moduleKey: 'financialReports',
    pathnamePrefix: '/accounting/reports',
  },
  {
    moduleKey: 'accounting',
    pathnamePrefix: '/accounting',
  },
  {
    moduleKey: 'projectProperty',
    pathnamePrefix: '/project-property',
  },
  {
    moduleKey: 'crmPropertyDesk',
    pathnamePrefix: '/crm-property-desk',
  },
  {
    moduleKey: 'hr',
    pathnamePrefix: '/hr',
  },
  {
    moduleKey: 'payroll',
    pathnamePrefix: '/payroll',
  },
  {
    moduleKey: 'orgSecurity',
    pathnamePrefix: '/org-security',
  },
  {
    moduleKey: 'dashboard',
    pathnamePrefix: '/dashboard',
  },
] as const;

const formatLabelList = (values: string[]) => {
  if (values.length === 0) {
    return '';
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} or ${values[1]}`;
  }

  return `${values.slice(0, -1).join(', ')}, or ${values.at(-1)}`;
};

export const getUserAccessSummary = (
  user: CurrentUser | null | undefined,
): Phase1AccessSummary => buildPhase1AccessSummary(user?.roles ?? []);

export const getRouteAccessRequirement = (
  pathname: string,
): RouteAccessRequirement | null =>
  ROUTE_ACCESS_REQUIREMENTS.find(
    (requirement) =>
      pathname === requirement.pathnamePrefix ||
      pathname.startsWith(`${requirement.pathnamePrefix}/`),
  ) ?? null;

export const canAccessRoute = (
  access: Phase1AccessSummary,
  pathname: string,
): boolean => {
  const requirement = getRouteAccessRequirement(pathname);

  return requirement ? access[requirement.moduleKey] : true;
};

export const getModuleRoleLabels = (moduleKey: Phase1ModuleKey): string[] =>
  PHASE1_ACCESS_MATRIX[moduleKey].allowedRoles.map(
    (roleCode) => COMPANY_ROLE_LABELS[roleCode],
  );

export const getRoleLabel = (roleCode: string): string =>
  COMPANY_ROLE_LABELS[roleCode as keyof typeof COMPANY_ROLE_LABELS] ?? roleCode;

export const getRoleLabels = (roleCodes: readonly string[]): string[] =>
  roleCodes.map((roleCode) => getRoleLabel(roleCode));

export const getModuleAccessDescription = (
  moduleKey: Phase1ModuleKey,
): string => {
  const module = PHASE1_ACCESS_MATRIX[moduleKey];
  const roleLabels = formatLabelList(getModuleRoleLabels(moduleKey));

  return `This signed-in session does not include the ${roleLabels} access required for ${module.label.toLowerCase()} in the active company scope.`;
};
