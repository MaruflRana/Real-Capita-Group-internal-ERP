/**
 * Route-aware fallback resolver for Defense Trace.
 *
 * When no exact registry entry matches a clicked UI element,
 * this resolver infers useful source locations from the current
 * route pathname using prefix-based module mapping.
 */

export interface RouteSourceResolverResult {
  likelyRouteFile: string;
  likelyFeatureFolder: string;
  likelyApiHelper: string;
  backendCandidates: readonly string[];
  prismaModels: readonly string[];
  gitGrepCommands: readonly GitGrepCommand[];
}

export interface GitGrepCommand {
  label: string;
  command: string;
}

interface ModulePrefixMapping {
  routePrefix: string;
  featureFolder: string;
  apiHelper: string;
  backendCandidates: readonly string[];
  prismaModels: readonly string[];
}

const MODULE_PREFIX_MAPPINGS: readonly ModulePrefixMapping[] = [
  {
    routePrefix: '/org-security',
    featureFolder: 'apps/web/src/features/org-security',
    apiHelper: 'apps/web/src/lib/api/org-security.ts',
    backendCandidates: [
      'apps/api/src/app/companies',
      'apps/api/src/app/departments',
      'apps/api/src/app/locations',
      'apps/api/src/app/users',
      'apps/api/src/app/roles',
    ],
    prismaModels: ['Company', 'Department', 'Location', 'User', 'Role', 'UserRole'],
  },
  {
    routePrefix: '/project-property',
    featureFolder: 'apps/web/src/features/project-property',
    apiHelper: 'apps/web/src/lib/api/project-property.ts',
    backendCandidates: ['apps/api/src/app/project-property'],
    prismaModels: [
      'Project',
      'CostCenter',
      'ProjectPhase',
      'Block',
      'Zone',
      'UnitType',
      'UnitStatus',
      'Unit',
    ],
  },
  {
    routePrefix: '/crm-property-desk',
    featureFolder: 'apps/web/src/features/crm-property-desk',
    apiHelper: 'apps/web/src/lib/api/crm-property-desk.ts',
    backendCandidates: ['apps/api/src/app/crm-property-desk'],
    prismaModels: [
      'Customer',
      'Lead',
      'Booking',
      'SaleContract',
      'InstallmentSchedule',
      'Collection',
    ],
  },
  {
    routePrefix: '/hr',
    featureFolder: 'apps/web/src/features/hr-core',
    apiHelper: 'apps/web/src/lib/api/hr-core.ts',
    backendCandidates: ['apps/api/src/app/hr'],
    prismaModels: [
      'Employee',
      'AttendanceDevice',
      'DeviceUser',
      'AttendanceLog',
      'LeaveType',
      'LeaveRequest',
    ],
  },
  {
    routePrefix: '/payroll',
    featureFolder: 'apps/web/src/features/payroll-core',
    apiHelper: 'apps/web/src/lib/api/payroll.ts',
    backendCandidates: ['apps/api/src/app/payroll'],
    prismaModels: ['SalaryStructure', 'PayrollRun', 'PayrollRunLine', 'Voucher'],
  },
  {
    routePrefix: '/accounting/reports',
    featureFolder: 'apps/web/src/features/financial-reporting',
    apiHelper: 'apps/web/src/lib/api/financial-reporting.ts',
    backendCandidates: ['apps/api/src/app/financial-reporting'],
    prismaModels: [
      'Voucher',
      'VoucherLine',
      'ParticularAccount',
      'LedgerAccount',
      'AccountGroup',
      'AccountClass',
    ],
  },
  {
    routePrefix: '/accounting',
    featureFolder: 'apps/web/src/features/accounting',
    apiHelper: 'apps/web/src/lib/api/accounting.ts',
    backendCandidates: [
      'apps/api/src/app/chart-of-accounts',
      'apps/api/src/app/vouchers',
    ],
    prismaModels: [
      'Voucher',
      'VoucherLine',
      'ParticularAccount',
      'LedgerAccount',
      'AccountGroup',
      'AccountClass',
    ],
  },
  {
    routePrefix: '/audit-documents',
    featureFolder: 'apps/web/src/features/audit-documents',
    apiHelper: 'apps/web/src/lib/api/audit-documents.ts',
    backendCandidates: [
      'apps/api/src/app/attachments',
      'apps/api/src/app/audit',
      'apps/api/src/app/storage',
    ],
    prismaModels: ['Attachment', 'AttachmentLink', 'AuditEvent'],
  },
];

const normalizePathname = (pathname: string): string => {
  if (!pathname) {
    return '/';
  }

  const [pathOnly] = pathname.split(/[?#]/);
  const normalized = pathOnly?.startsWith('/') ? pathOnly : `/${pathOnly}`;

  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
};

const escapeDoubleQuotes = (value: string): string => value.replace(/"/g, '\\"');

/**
 * Infer the likely Next.js route file from a pathname.
 *
 * For `/org-security/departments` →
 *   `apps/web/src/app/(app)/org-security/departments/page.tsx`
 *
 * For `/accounting/reports/general-ledger` →
 *   `apps/web/src/app/(app)/accounting/reports/general-ledger/page.tsx`
 */
const inferRouteFile = (pathname: string): string => {
  const normalized = normalizePathname(pathname);

  if (normalized === '/login') {
    return 'apps/web/src/app/(public)/login/page.tsx';
  }

  if (normalized === '/') {
    return 'apps/web/src/app/(app)/page.tsx';
  }

  return `apps/web/src/app/(app)${normalized}/page.tsx`;
};

/**
 * Find the best-matching module prefix mapping for a given pathname.
 *
 * Longer/more-specific prefixes take priority (e.g. `/accounting/reports`
 * wins over `/accounting` for `/accounting/reports/trial-balance`).
 */
const findModuleMapping = (pathname: string): ModulePrefixMapping | null => {
  const normalized = normalizePathname(pathname);

  let bestMatch: ModulePrefixMapping | null = null;
  let bestMatchLength = 0;

  for (const mapping of MODULE_PREFIX_MAPPINGS) {
    const prefix = mapping.routePrefix;

    if (
      normalized === prefix ||
      normalized.startsWith(`${prefix}/`)
    ) {
      if (prefix.length > bestMatchLength) {
        bestMatch = mapping;
        bestMatchLength = prefix.length;
      }
    }
  }

  return bestMatch;
};

/**
 * Derive a search term from the route path and optional clicked text.
 *
 * Uses the last meaningful route segment, or the clicked text if provided.
 */
const deriveSearchTerm = (pathname: string, clickedText?: string): string => {
  if (clickedText && clickedText.trim().length >= 2) {
    return clickedText.trim();
  }

  const segments = normalizePathname(pathname)
    .split('/')
    .filter(Boolean);

  return segments.at(-1) ?? segments.at(0) ?? 'dashboard';
};

/**
 * Build git grep commands for the resolved route context.
 *
 * Uses git grep (not ripgrep) because ripgrep may not exist on all machines.
 */
const buildGitGrepCommands = (
  pathname: string,
  mapping: ModulePrefixMapping,
  clickedText?: string,
): readonly GitGrepCommand[] => {
  const searchTerm = deriveSearchTerm(pathname, clickedText);
  const capitalSearchTerm =
    searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
  const routeSearch = normalizePathname(pathname);
  const escapedSearch = escapeDoubleQuotes(searchTerm);
  const escapedCapital = escapeDoubleQuotes(capitalSearchTerm);
  const escapedRoute = escapeDoubleQuotes(routeSearch);
  const firstModel = mapping.prismaModels[0] ?? capitalSearchTerm;

  return [
    {
      label: `Search "${capitalSearchTerm}" across frontend and backend`,
      command: `git grep -n "${escapedCapital}" -- apps/web/src apps/api/src prisma`,
    },
    {
      label: `Search route "${routeSearch}" across frontend and backend`,
      command: `git grep -n "${escapedRoute}" -- apps/web/src apps/api/src prisma`,
    },
    {
      label: `Find Prisma model "${firstModel}"`,
      command: `git grep -n "model ${escapeDoubleQuotes(firstModel)}" -- prisma/schema.prisma`,
    },
  ];
};

/**
 * Resolve route-aware source guidance for a pathname.
 *
 * Returns inferred frontend route, feature folder, API helper,
 * backend candidates, Prisma models, and git grep commands.
 * Returns null if no module prefix matches the pathname.
 */
export const resolveRouteSource = (
  pathname: string,
  clickedText?: string,
): RouteSourceResolverResult | null => {
  const mapping = findModuleMapping(pathname);

  if (!mapping) {
    return null;
  }

  return {
    likelyRouteFile: inferRouteFile(pathname),
    likelyFeatureFolder: mapping.featureFolder,
    likelyApiHelper: mapping.apiHelper,
    backendCandidates: mapping.backendCandidates,
    prismaModels: mapping.prismaModels,
    gitGrepCommands: buildGitGrepCommands(pathname, mapping, clickedText),
  };
};

/**
 * Get the full list of supported route prefixes.
 */
export const getSupportedRoutePrefixes = (): readonly string[] =>
  MODULE_PREFIX_MAPPINGS.map((mapping) => mapping.routePrefix);
