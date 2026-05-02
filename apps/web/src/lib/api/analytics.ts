import {
  listAccountClasses,
  listAccountGroups,
  listLedgerAccounts,
  listParticularAccounts,
  listVouchers,
} from './accounting';
import { listAttachments, listAuditEvents } from './audit-documents';
import { isApiError } from './client';
import {
  listBookings,
  listCollections,
  listCustomers,
  listInstallmentSchedules,
  listLeads,
  listSaleContracts,
} from './crm-property-desk';
import {
  getBusinessOverviewReport,
  getBalanceSheetReport,
  getProfitAndLossReport,
  getTrialBalanceReport,
} from './financial-reporting';
import {
  listAttendanceDevices,
  listAttendanceLogs,
  listDeviceUsers,
  listEmployees,
  listLeaveRequests,
  listLeaveTypes,
} from './hr-core';
import {
  listPayrollEmployees,
  listPayrollRuns,
  listSalaryStructures,
} from './payroll';
import {
  listBlocks,
  listCostCenters,
  listProjectPhases,
  listProjects,
  listUnits,
  listUnitStatuses,
  listUnitTypes,
  listZones,
} from './project-property';
import type { DashboardAccess, DashboardPeriod } from './dashboard';
import type {
  AccountingVoucherStatus,
  AccountingVoucherType,
  AttachmentEntityType,
  AttachmentStatus,
  AuditEventCategory,
  ListQueryParams,
  PaginatedResponse,
  PayrollRunStatus,
  PropertyDeskBookingStatus,
  PropertyDeskDueState,
  PropertyDeskLeadStatus,
  VoucherRecord,
} from './types';
import {
  ACCOUNTING_VOUCHER_STATUSES,
  ACCOUNTING_VOUCHER_TYPES,
  ATTACHMENT_ENTITY_TYPES,
  ATTACHMENT_STATUSES,
  AUDIT_EVENT_CATEGORIES,
  HR_ATTENDANCE_LOG_DIRECTIONS,
  HR_LEAVE_REQUEST_STATUSES,
  PAYROLL_RUN_STATUSES,
  PROPERTY_DESK_BOOKING_STATUSES,
  PROPERTY_DESK_DUE_STATES,
  PROPERTY_DESK_LEAD_STATUSES,
} from './types';

const COUNT_QUERY = {
  page: 1,
  pageSize: 1,
} as const;

const SAMPLE_QUERY = {
  page: 1,
  pageSize: 100,
} as const;

export interface AnalyticsIssue {
  id: string;
  title: string;
  message: string;
}

export interface AnalyticsDataPoint {
  key: string;
  label: string;
  value: number;
}

export interface AnalyticsTrendPoint {
  key: string;
  label: string;
  values: Record<string, number>;
}

export interface AnalyticsSampleMeta {
  sampleSize: number;
  total: number;
  isTruncated: boolean;
}

export interface AnalyticsTableRow {
  key: string;
  label: string;
  value: number;
  detail?: string;
}

export interface FinancialAnalytics {
  revenueExpense: AnalyticsDataPoint[];
  businessPerformanceTrend: AnalyticsTrendPoint[];
  salesCollectionsTrend: AnalyticsTrendPoint[];
  trialBalanceComparison: AnalyticsDataPoint[];
  balanceSheetComparison: AnalyticsDataPoint[];
  unclosedEarnings: number;
  isBalanced: boolean;
}

export interface AccountingAnalytics {
  accountStructure: AnalyticsDataPoint[];
  voucherWorkloadCards: AnalyticsDataPoint[];
  voucherAmountSummary: AnalyticsDataPoint[];
  voucherStatusDistribution: AnalyticsDataPoint[];
  voucherTypeDistribution: AnalyticsDataPoint[];
  monthlyVoucherMovement: AnalyticsTrendPoint[];
  accountingAttentionRows: AnalyticsTableRow[];
  recentPostingRows: AnalyticsTableRow[];
  voucherSample: AnalyticsSampleMeta;
  unbalancedVoucherSampleCount: number;
}

export interface ProjectPropertyAnalytics {
  projectCount: number;
  costCenterCount: number;
  phaseCount: number;
  blockCount: number;
  zoneCount: number;
  unitTypeCount: number;
  totalUnitCount: number;
  masterDataCards: AnalyticsDataPoint[];
  projectStatusDistribution: AnalyticsDataPoint[];
  unitStatusDistribution: AnalyticsDataPoint[];
  unitsByProject: AnalyticsDataPoint[];
  unitsByUnitType: AnalyticsDataPoint[];
  inventoryStatusCards: AnalyticsDataPoint[];
  topProjectInventoryRows: AnalyticsTableRow[];
  unitSample: AnalyticsSampleMeta;
}

export interface CrmAnalytics {
  customerCount: number;
  commercialActivityCards: AnalyticsDataPoint[];
  commercialValueCards: AnalyticsDataPoint[];
  leadStatusDistribution: AnalyticsDataPoint[];
  bookingStatusDistribution: AnalyticsDataPoint[];
  bookingContractFunnel: AnalyticsDataPoint[];
  installmentStateDistribution: AnalyticsDataPoint[];
  collectionTrend: AnalyticsTrendPoint[];
  crmAttentionRows: AnalyticsTableRow[];
  saleContractSample: AnalyticsSampleMeta;
  installmentSample: AnalyticsSampleMeta;
  collectionSample: AnalyticsSampleMeta;
}

export interface HrAnalytics {
  employeeCount: number;
  peopleCoverageCards: AnalyticsDataPoint[];
  employeesByDepartment: AnalyticsDataPoint[];
  employeesByLocation: AnalyticsDataPoint[];
  leaveStatusDistribution: AnalyticsDataPoint[];
  attendanceDirectionDistribution: AnalyticsDataPoint[];
  attendanceTrend: AnalyticsTrendPoint[];
  hrAttentionRows: AnalyticsTableRow[];
  employeeSample: AnalyticsSampleMeta;
  attendanceSample: AnalyticsSampleMeta;
  deviceMappingSample: AnalyticsSampleMeta;
}

export interface PayrollAnalytics {
  salaryStructureCount: number;
  payrollWorkloadCards: AnalyticsDataPoint[];
  payrollPostingCards: AnalyticsDataPoint[];
  payrollRunStatusDistribution: AnalyticsDataPoint[];
  payrollScopeDistribution: AnalyticsDataPoint[];
  payrollAmountTrend: AnalyticsTrendPoint[];
  payrollAmountSummary: AnalyticsDataPoint[];
  payrollRunRows: AnalyticsTableRow[];
  salaryStructureSample: AnalyticsSampleMeta;
  payrollEmployeeCount: number;
  payrollRunSample: AnalyticsSampleMeta;
}

export interface AuditDocumentAnalytics {
  documentCoverageCards: AnalyticsDataPoint[];
  attachmentStatusDistribution: AnalyticsDataPoint[];
  attachmentEntityDistribution: AnalyticsDataPoint[];
  attachmentActivityTrend: AnalyticsTrendPoint[];
  auditCategoryDistribution: AnalyticsDataPoint[];
  auditEventTypeDistribution: AnalyticsDataPoint[];
  auditActivityTrend: AnalyticsTrendPoint[];
  auditAttentionRows: AnalyticsTableRow[];
  attachmentSample: AnalyticsSampleMeta;
  auditEventSample: AnalyticsSampleMeta;
}

export interface DashboardAnalyticsResponse {
  companyId: string;
  period: DashboardPeriod;
  financial: FinancialAnalytics | null;
  accounting: AccountingAnalytics | null;
  property: ProjectPropertyAnalytics | null;
  crm: CrmAnalytics | null;
  hr: HrAnalytics | null;
  payroll: PayrollAnalytics | null;
  documents: AuditDocumentAnalytics | null;
  issues: AnalyticsIssue[];
}

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const amount = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(amount) ? amount : 0;
};

const getIssueMessage = (error: unknown) => {
  if (isApiError(error)) {
    return error.apiError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'The analytics request could not be completed.';
};

const createIssue = (
  id: string,
  title: string,
  error: unknown,
): AnalyticsIssue => ({
  id,
  title,
  message: getIssueMessage(error),
});

const countListItems = async (
  request: Promise<{
    meta: {
      total: number;
    };
  }>,
) => {
  const response = await request;

  return response.meta.total;
};

const buildSampleMeta = <TItem>(
  response: PaginatedResponse<TItem>,
): AnalyticsSampleMeta => ({
  sampleSize: response.items.length,
  total: response.meta.total,
  isTruncated: response.meta.total > response.items.length,
});

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');

const getMonthKey = (value: string) => value.slice(0, 7);

const getDayKey = (value: string) => value.slice(0, 10);

const sortTrend = (points: AnalyticsTrendPoint[]) =>
  [...points].sort((left, right) => left.key.localeCompare(right.key));

const addTrendValue = (
  bucket: Map<string, AnalyticsTrendPoint>,
  key: string,
  valueKey: string,
  value: number,
) => {
  const existing = bucket.get(key) ?? {
    key,
    label: key,
    values: {},
  };

  existing.values[valueKey] = (existing.values[valueKey] ?? 0) + value;
  bucket.set(key, existing);
};

const countByEnum = async <TValue extends string>(
  values: readonly TValue[],
  getCount: (value: TValue) => Promise<number>,
) =>
  Promise.all(
    values.map(async (value) => ({
      key: value,
      label: formatEnumLabel(value),
      value: await getCount(value),
    })),
  );

const groupCount = <TItem>(
  items: TItem[],
  getKey: (item: TItem) => string,
  getLabel: (item: TItem) => string,
) => {
  const bucket = new Map<string, AnalyticsDataPoint>();

  items.forEach((item) => {
    const key = getKey(item);
    const existing = bucket.get(key);

    if (existing) {
      existing.value += 1;
      return;
    }

    bucket.set(key, {
      key,
      label: getLabel(item),
      value: 1,
    });
  });

  return [...bucket.values()].sort((left, right) => right.value - left.value);
};

const getDistributionValue = (
  distribution: AnalyticsDataPoint[],
  key: string,
) =>
  distribution.find(
    (item) => item.key.toLowerCase() === key.toLowerCase(),
  )?.value ?? 0;

const formatPercentDetail = (value: number, total: number) => {
  if (total <= 0) {
    return 'No comparable records in the sampled data.';
  }

  const percent = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    style: 'percent',
  }).format(value / total);

  return `${percent} of the sampled operating set.`;
};

export const getFinancialAnalytics = async (
  companyId: string,
  period: DashboardPeriod,
): Promise<FinancialAnalytics> => {
  const [profitAndLoss, trialBalance, balanceSheet, businessOverview] =
    await Promise.all([
    getProfitAndLossReport(companyId, {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
    }),
    getTrialBalanceReport(companyId, {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
    }),
    getBalanceSheetReport(companyId, {
      asOfDate: period.asOfDate,
    }),
    getBusinessOverviewReport(companyId, {
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      bucket: 'month',
    }),
  ]);

  return {
    revenueExpense: [
      {
        key: 'revenue',
        label: 'Revenue',
        value: toNumber(profitAndLoss.totals.totalRevenue),
      },
      {
        key: 'expense',
        label: 'Expense',
        value: toNumber(profitAndLoss.totals.totalExpense),
      },
    ],
    businessPerformanceTrend: businessOverview.buckets.map((bucket) => ({
      key: bucket.bucketKey,
      label: bucket.bucketLabel,
      values: {
        revenue: toNumber(bucket.revenueAmount),
        expenses: toNumber(bucket.expenseAmount),
        profitLoss: toNumber(bucket.netProfitLossAmount),
      },
    })),
    salesCollectionsTrend: businessOverview.buckets.map((bucket) => ({
      key: bucket.bucketKey,
      label: bucket.bucketLabel,
      values: {
        contractedSales: toNumber(bucket.contractedSalesAmount),
        collectedSales: toNumber(bucket.collectedSalesAmount),
      },
    })),
    trialBalanceComparison: [
      {
        key: 'closing-debit',
        label: 'Closing debit',
        value: toNumber(trialBalance.totals.closingDebit),
      },
      {
        key: 'closing-credit',
        label: 'Closing credit',
        value: toNumber(trialBalance.totals.closingCredit),
      },
    ],
    balanceSheetComparison: [
      {
        key: 'assets',
        label: 'Assets',
        value: toNumber(balanceSheet.totals.totalAssets),
      },
      {
        key: 'liabilities-equity',
        label: 'Liabilities + equity',
        value: toNumber(balanceSheet.totals.totalLiabilitiesAndEquity),
      },
    ],
    unclosedEarnings: toNumber(balanceSheet.totals.unclosedEarnings),
    isBalanced: balanceSheet.isBalanced,
  };
};

export const getAccountingAnalytics = async (
  companyId: string,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
): Promise<AccountingAnalytics> => {
  const [
    accountClassCount,
    accountGroupCount,
    ledgerAccountCount,
    postingAccountCount,
    voucherStatusDistribution,
    voucherTypeDistribution,
    voucherSampleResponse,
  ] = await Promise.all([
    countListItems(listAccountClasses(companyId, COUNT_QUERY)),
    countListItems(listAccountGroups(companyId, COUNT_QUERY)),
    countListItems(listLedgerAccounts(companyId, COUNT_QUERY)),
    countListItems(listParticularAccounts(companyId, COUNT_QUERY)),
    countByEnum(
      ACCOUNTING_VOUCHER_STATUSES,
      (status: AccountingVoucherStatus) =>
        countListItems(
          listVouchers(companyId, {
            ...COUNT_QUERY,
            status,
          }),
        ),
    ),
    countByEnum(
      ACCOUNTING_VOUCHER_TYPES,
      (voucherType: AccountingVoucherType) =>
        countListItems(
          listVouchers(companyId, {
            ...COUNT_QUERY,
            voucherType,
          }),
        ),
    ),
    listVouchers(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'voucherDate',
      sortOrder: 'desc',
      ...(period?.dateFrom ? { dateFrom: period.dateFrom } : {}),
      ...(period?.dateTo ? { dateTo: period.dateTo } : {}),
    }),
  ]);

  const monthlyMovementBucket = new Map<string, AnalyticsTrendPoint>();

  voucherSampleResponse.items.forEach((voucher) => {
    const monthKey = getMonthKey(voucher.voucherDate);

    addTrendValue(
      monthlyMovementBucket,
      monthKey,
      'debit',
      toNumber(voucher.totalDebit),
    );
    addTrendValue(
      monthlyMovementBucket,
      monthKey,
      'credit',
      toNumber(voucher.totalCredit),
    );
  });
  const draftVoucherCount = getDistributionValue(
    voucherStatusDistribution,
    'DRAFT',
  );
  const postedVoucherCount = getDistributionValue(
    voucherStatusDistribution,
    'POSTED',
  );
  const totalSampleDebit = voucherSampleResponse.items.reduce(
    (sum, voucher) => sum + toNumber(voucher.totalDebit),
    0,
  );
  const totalSampleCredit = voucherSampleResponse.items.reduce(
    (sum, voucher) => sum + toNumber(voucher.totalCredit),
    0,
  );
  const unbalancedVoucherSampleCount = voucherSampleResponse.items.filter(
    (voucher: VoucherRecord) =>
      Math.abs(toNumber(voucher.totalDebit) - toNumber(voucher.totalCredit)) >
      0.005,
  ).length;
  const latestDraft = voucherSampleResponse.items.find(
    (voucher) => voucher.status === 'DRAFT',
  );

  return {
    accountStructure: [
      {
        key: 'account-classes',
        label: 'Account classes',
        value: accountClassCount,
      },
      {
        key: 'account-groups',
        label: 'Groups',
        value: accountGroupCount,
      },
      {
        key: 'ledger-accounts',
        label: 'Ledgers',
        value: ledgerAccountCount,
      },
      {
        key: 'posting-accounts',
        label: 'Posting accounts',
        value: postingAccountCount,
      },
    ],
    voucherWorkloadCards: [
      {
        key: 'draft-vouchers',
        label: 'Draft vouchers',
        value: draftVoucherCount,
      },
      {
        key: 'posted-vouchers',
        label: 'Posted vouchers',
        value: postedVoucherCount,
      },
      {
        key: 'needs-attention',
        label: 'Needs attention',
        value: draftVoucherCount + unbalancedVoucherSampleCount,
      },
      {
        key: 'sampled-vouchers',
        label: 'Recent vouchers',
        value: voucherSampleResponse.items.length,
      },
    ],
    voucherAmountSummary: [
      {
        key: 'sample-debit',
        label: 'Sample debit',
        value: totalSampleDebit,
      },
      {
        key: 'sample-credit',
        label: 'Sample credit',
        value: totalSampleCredit,
      },
      {
        key: 'sample-difference',
        label: 'Debit / credit difference',
        value: Math.abs(totalSampleDebit - totalSampleCredit),
      },
    ],
    voucherStatusDistribution,
    voucherTypeDistribution,
    monthlyVoucherMovement: sortTrend([...monthlyMovementBucket.values()]),
    accountingAttentionRows: [
      {
        key: 'draft-vouchers',
        label: 'Draft vouchers awaiting posting',
        value: draftVoucherCount,
        detail: latestDraft
          ? `Latest draft: ${latestDraft.reference ?? latestDraft.description ?? latestDraft.id}`
          : 'No draft vouchers in the sampled records.',
      },
      {
        key: 'unbalanced-sample',
        label: 'Unbalanced sampled vouchers',
        value: unbalancedVoucherSampleCount,
        detail:
          'Detected by comparing debit and credit totals returned by the voucher list.',
      },
    ],
    recentPostingRows: voucherSampleResponse.items
      .filter((voucher) => voucher.status === 'POSTED')
      .slice(0, 5)
      .map((voucher) => ({
        key: voucher.id,
        label:
          voucher.reference?.trim() ||
          voucher.description?.trim() ||
          `${voucher.voucherType} voucher`,
        value: toNumber(voucher.totalDebit),
        detail: `Posted ${voucher.postedAt ? getDayKey(voucher.postedAt) : getDayKey(voucher.voucherDate)} with ${voucher.lineCount} lines.`,
      })),
    voucherSample: buildSampleMeta(voucherSampleResponse),
    unbalancedVoucherSampleCount,
  };
};

export const getProjectPropertyAnalytics = async (
  companyId: string,
): Promise<ProjectPropertyAnalytics> => {
  const [
    projectsCount,
    activeProjectCount,
    inactiveProjectCount,
    costCenterCount,
    phaseCount,
    blockCount,
    zoneCount,
    unitTypeCount,
    unitStatuses,
    unitSampleResponse,
  ] = await Promise.all([
    countListItems(listProjects(companyId, COUNT_QUERY)),
    countListItems(
      listProjects(companyId, {
        ...COUNT_QUERY,
        isActive: true,
      }),
    ),
    countListItems(
      listProjects(companyId, {
        ...COUNT_QUERY,
        isActive: false,
      }),
    ),
    countListItems(listCostCenters(companyId, COUNT_QUERY)),
    countListItems(listProjectPhases(companyId, COUNT_QUERY)),
    countListItems(listBlocks(companyId, COUNT_QUERY)),
    countListItems(listZones(companyId, COUNT_QUERY)),
    countListItems(listUnitTypes(companyId, COUNT_QUERY)),
    listUnitStatuses(companyId, {
      page: 1,
      pageSize: 100,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    }),
    listUnits(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    }),
  ]);

  const unitStatusDistribution = await Promise.all(
    unitStatuses.items.map(async (status) => ({
      key: status.code,
      label: status.name,
      value: await countListItems(
        listUnits(companyId, {
          ...COUNT_QUERY,
          unitStatusId: status.id,
        }),
      ),
    })),
  );
  const statusValueByCode = Object.fromEntries(
    unitStatusDistribution.map((item) => [item.key, item.value]),
  ) as Record<string, number | undefined>;
  const unitsByProject = groupCount(
    unitSampleResponse.items,
    (unit) => unit.projectId,
    (unit) => unit.projectName,
  );
  const unitsByUnitType = groupCount(
    unitSampleResponse.items,
    (unit) => unit.unitTypeId,
    (unit) => unit.unitTypeName,
  );
  const totalUnitCount = unitSampleResponse.meta.total;
  const availableUnitCount = statusValueByCode.AVAILABLE ?? 0;
  const bookedUnitCount = statusValueByCode.BOOKED ?? 0;
  const soldUnitCount = statusValueByCode.SOLD ?? 0;
  const allottedUnitCount = statusValueByCode.ALLOTTED ?? 0;

  return {
    projectCount: projectsCount,
    costCenterCount,
    phaseCount,
    blockCount,
    zoneCount,
    unitTypeCount,
    totalUnitCount,
    masterDataCards: [
      {
        key: 'projects',
        label: 'Projects',
        value: projectsCount,
      },
      {
        key: 'cost-centers',
        label: 'Cost centers',
        value: costCenterCount,
      },
      {
        key: 'phases',
        label: 'Phases',
        value: phaseCount,
      },
      {
        key: 'blocks-zones',
        label: 'Blocks / zones',
        value: blockCount + zoneCount,
      },
      {
        key: 'unit-types',
        label: 'Unit types',
        value: unitTypeCount,
      },
      {
        key: 'unit-statuses',
        label: 'Unit statuses',
        value: unitStatuses.meta.total,
      },
    ],
    projectStatusDistribution: [
      {
        key: 'active-projects',
        label: 'Active projects',
        value: activeProjectCount,
      },
      {
        key: 'inactive-projects',
        label: 'Inactive projects',
        value: inactiveProjectCount,
      },
    ],
    unitStatusDistribution,
    unitsByProject,
    unitsByUnitType,
    inventoryStatusCards: [
      {
        key: 'total-units',
        label: 'Total units',
        value: totalUnitCount,
      },
      {
        key: 'available',
        label: 'Available',
        value: availableUnitCount,
      },
      {
        key: 'booked',
        label: 'Booked',
        value: bookedUnitCount,
      },
      {
        key: 'sold',
        label: 'Sold',
        value: soldUnitCount,
      },
      {
        key: 'allotted',
        label: 'Allotted',
        value: allottedUnitCount,
      },
    ],
    topProjectInventoryRows: unitsByProject.slice(0, 5).map((item) => ({
      key: item.key,
      label: item.label,
      value: item.value,
      detail: formatPercentDetail(item.value, unitSampleResponse.items.length),
    })),
    unitSample: buildSampleMeta(unitSampleResponse),
  };
};

export const getCrmAnalytics = async (
  companyId: string,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
): Promise<CrmAnalytics> => {
  const [
    customerCount,
    activeCustomerCount,
    leadStatusDistribution,
    bookingStatusDistribution,
    saleContractSampleResponse,
    installmentStateDistribution,
    installmentSampleResponse,
    collectionSampleResponse,
  ] = await Promise.all([
    countListItems(listCustomers(companyId, COUNT_QUERY)),
    countListItems(
      listCustomers(companyId, {
        ...COUNT_QUERY,
        isActive: true,
      }),
    ),
    countByEnum(
      PROPERTY_DESK_LEAD_STATUSES,
      (status: PropertyDeskLeadStatus) =>
        countListItems(
          listLeads(companyId, {
            ...COUNT_QUERY,
            status,
          }),
        ),
    ),
    countByEnum(
      PROPERTY_DESK_BOOKING_STATUSES,
      (status: PropertyDeskBookingStatus) =>
        countListItems(
          listBookings(companyId, {
            ...COUNT_QUERY,
            status,
          }),
        ),
    ),
    listSaleContracts(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'contractDate',
      sortOrder: 'desc',
      ...(period?.dateFrom ? { dateFrom: period.dateFrom } : {}),
      ...(period?.dateTo ? { dateTo: period.dateTo } : {}),
    }),
    countByEnum(PROPERTY_DESK_DUE_STATES, (dueState: PropertyDeskDueState) =>
      countListItems(
        listInstallmentSchedules(companyId, {
          ...COUNT_QUERY,
          dueState,
        }),
      ),
    ),
    listInstallmentSchedules(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'dueDate',
      sortOrder: 'asc',
    }),
    listCollections(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'collectionDate',
      sortOrder: 'desc',
      ...(period?.dateFrom ? { dateFrom: period.dateFrom } : {}),
      ...(period?.dateTo ? { dateTo: period.dateTo } : {}),
    }),
  ]);

  const totalLeads = leadStatusDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const totalBookings = bookingStatusDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const saleContractCount = saleContractSampleResponse.meta.total;
  const totalCollections = collectionSampleResponse.meta.total;
  const totalContractedSales = saleContractSampleResponse.items.reduce(
    (sum, saleContract) => sum + toNumber(saleContract.contractAmount),
    0,
  );
  const totalCollectedSales = collectionSampleResponse.items.reduce(
    (sum, collection) => sum + toNumber(collection.amount),
    0,
  );
  const openInstallmentBalance = installmentSampleResponse.items.reduce(
    (sum, installment) => sum + toNumber(installment.balanceAmount),
    0,
  );
  const collectionTrendBucket = new Map<string, AnalyticsTrendPoint>();

  collectionSampleResponse.items.forEach((collection) => {
    addTrendValue(
      collectionTrendBucket,
      getMonthKey(collection.collectionDate),
      'collections',
      toNumber(collection.amount),
    );
  });

  return {
    customerCount,
    commercialActivityCards: [
      {
        key: 'customers',
        label: 'Customers',
        value: customerCount,
      },
      {
        key: 'active-customers',
        label: 'Active customers',
        value: activeCustomerCount,
      },
      {
        key: 'leads',
        label: 'Leads',
        value: totalLeads,
      },
      {
        key: 'bookings',
        label: 'Bookings',
        value: totalBookings,
      },
      {
        key: 'contracts',
        label: 'Sale contracts',
        value: saleContractCount,
      },
      {
        key: 'collections',
        label: 'Collections',
        value: totalCollections,
      },
    ],
    commercialValueCards: [
      {
        key: 'contracted-sales',
        label: 'Contracted sales',
        value: totalContractedSales,
      },
      {
        key: 'collected-sales',
        label: 'Collected sales',
        value: totalCollectedSales,
      },
      {
        key: 'open-installments',
        label: 'Open installment balance',
        value: openInstallmentBalance,
      },
    ],
    leadStatusDistribution,
    bookingStatusDistribution,
    bookingContractFunnel: [
      {
        key: 'leads',
        label: 'Leads',
        value: totalLeads,
      },
      {
        key: 'bookings',
        label: 'Bookings',
        value: totalBookings,
      },
      {
        key: 'contracts',
        label: 'Contracts',
        value: saleContractCount,
      },
      {
        key: 'collections',
        label: 'Collections',
        value: totalCollections,
      },
    ],
    installmentStateDistribution,
    collectionTrend: sortTrend([...collectionTrendBucket.values()]),
    crmAttentionRows: [
      {
        key: 'active-bookings',
        label: 'Active bookings before contract',
        value: getDistributionValue(bookingStatusDistribution, 'ACTIVE'),
        detail: 'Bookings still in ACTIVE state using the booking list API.',
      },
      {
        key: 'overdue-installments',
        label: 'Overdue installments',
        value: getDistributionValue(installmentStateDistribution, 'overdue'),
        detail: 'Due-state count returned by the installment schedule endpoint.',
      },
      {
        key: 'collection-count',
        label: 'Recent collections',
        value: totalCollections,
        detail: period?.dateFrom
          ? `Collections between ${period.dateFrom} and ${period.dateTo}.`
          : 'Latest collections returned by the list endpoint.',
      },
    ],
    saleContractSample: buildSampleMeta(saleContractSampleResponse),
    installmentSample: buildSampleMeta(installmentSampleResponse),
    collectionSample: buildSampleMeta(collectionSampleResponse),
  };
};

export const getHrAnalytics = async (
  companyId: string,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
): Promise<HrAnalytics> => {
  const [
    employeeSampleResponse,
    leaveStatusDistribution,
    attendanceSampleResponse,
    attendanceDeviceCount,
    deviceUserSampleResponse,
    leaveTypeCount,
  ] = await Promise.all([
    listEmployees(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'employeeCode',
      sortOrder: 'asc',
    }),
    countByEnum(HR_LEAVE_REQUEST_STATUSES, (status) =>
      countListItems(
        listLeaveRequests(companyId, {
          ...COUNT_QUERY,
          status,
        }),
      ),
    ),
    listAttendanceLogs(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'loggedAt',
      sortOrder: 'desc',
      ...(period?.dateFrom ? { dateFrom: period.dateFrom } : {}),
      ...(period?.dateTo ? { dateTo: period.dateTo } : {}),
    }),
    countListItems(listAttendanceDevices(companyId, COUNT_QUERY)),
    listDeviceUsers(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    }),
    countListItems(listLeaveTypes(companyId, COUNT_QUERY)),
  ]);
  const attendanceTrendBucket = new Map<string, AnalyticsTrendPoint>();

  attendanceSampleResponse.items.forEach((attendanceLog) => {
    addTrendValue(
      attendanceTrendBucket,
      getDayKey(attendanceLog.loggedAt),
      attendanceLog.direction.toLowerCase(),
      1,
    );
  });

  HR_ATTENDANCE_LOG_DIRECTIONS.forEach((direction) => {
    attendanceTrendBucket.forEach((point) => {
      point.values[direction.toLowerCase()] =
        point.values[direction.toLowerCase()] ?? 0;
    });
  });
  const attendanceDirectionDistribution = HR_ATTENDANCE_LOG_DIRECTIONS.map(
    (direction) => ({
      key: direction,
      label: formatEnumLabel(direction),
      value: attendanceSampleResponse.items.filter(
        (attendanceLog) => attendanceLog.direction === direction,
      ).length,
    }),
  );
  const mappedEmployeeCount = new Set(
    deviceUserSampleResponse.items.map((deviceUser) => deviceUser.employeeId),
  ).size;
  const submittedLeaveCount = getDistributionValue(
    leaveStatusDistribution,
    'SUBMITTED',
  );

  return {
    employeeCount: employeeSampleResponse.meta.total,
    peopleCoverageCards: [
      {
        key: 'employees',
        label: 'Employees',
        value: employeeSampleResponse.meta.total,
      },
      {
        key: 'mapped-employees',
        label: 'Mapped employees',
        value: mappedEmployeeCount,
      },
      {
        key: 'attendance-devices',
        label: 'Attendance devices',
        value: attendanceDeviceCount,
      },
      {
        key: 'leave-types',
        label: 'Leave types',
        value: leaveTypeCount,
      },
      {
        key: 'submitted-leave',
        label: 'Submitted leave',
        value: submittedLeaveCount,
      },
    ],
    employeesByDepartment: groupCount(
      employeeSampleResponse.items,
      (employee) => employee.departmentId ?? 'unassigned-department',
      (employee) => employee.departmentName ?? 'No department',
    ),
    employeesByLocation: groupCount(
      employeeSampleResponse.items,
      (employee) => employee.locationId ?? 'unassigned-location',
      (employee) => employee.locationName ?? 'No location',
    ),
    leaveStatusDistribution,
    attendanceDirectionDistribution,
    attendanceTrend: sortTrend([...attendanceTrendBucket.values()]),
    hrAttentionRows: [
      {
        key: 'submitted-leave',
        label: 'Leave requests awaiting review',
        value: submittedLeaveCount,
        detail: 'Current SUBMITTED leave requests returned by HR list filters.',
      },
      {
        key: 'unmapped-employees',
        label: 'Employees without sampled device mapping',
        value: Math.max(employeeSampleResponse.meta.total - mappedEmployeeCount, 0),
        detail:
          'Compares employee count with sampled device-user mappings; large companies may require filtered review.',
      },
      {
        key: 'attendance-logs',
        label: 'Attendance logs in period',
        value: attendanceSampleResponse.meta.total,
        detail: period?.dateFrom
          ? `Logs between ${period.dateFrom} and ${period.dateTo}.`
          : 'Latest attendance logs returned by the list endpoint.',
      },
    ],
    employeeSample: buildSampleMeta(employeeSampleResponse),
    attendanceSample: buildSampleMeta(attendanceSampleResponse),
    deviceMappingSample: buildSampleMeta(deviceUserSampleResponse),
  };
};

export const getPayrollAnalytics = async (
  companyId: string,
): Promise<PayrollAnalytics> => {
  const [
    salaryStructures,
    payrollEmployeeCount,
    payrollRunStatusDistribution,
    payrollRuns,
  ] =
    await Promise.all([
      listSalaryStructures(companyId, {
        ...SAMPLE_QUERY,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      }),
      countListItems(listPayrollEmployees(companyId, COUNT_QUERY)),
      countByEnum(PAYROLL_RUN_STATUSES, (status: PayrollRunStatus) =>
        countListItems(
          listPayrollRuns(companyId, {
            ...COUNT_QUERY,
            status,
          }),
        ),
      ),
      listPayrollRuns(companyId, {
        ...SAMPLE_QUERY,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    ]);
  const amountTrendBucket = new Map<string, AnalyticsTrendPoint>();
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  const salaryStructureCount = salaryStructures.meta.total;

  payrollRuns.items.forEach((run) => {
    const periodKey = `${run.payrollYear}-${String(run.payrollMonth).padStart(2, '0')}`;
    const gross =
      toNumber(run.totalBasicAmount) + toNumber(run.totalAllowanceAmount);
    const deduction = toNumber(run.totalDeductionAmount);
    const net = toNumber(run.totalNetAmount);

    totalGross += gross;
    totalDeductions += deduction;
    totalNet += net;
    addTrendValue(amountTrendBucket, periodKey, 'gross', gross);
    addTrendValue(amountTrendBucket, periodKey, 'deductions', deduction);
    addTrendValue(amountTrendBucket, periodKey, 'net', net);
  });
  const draftRunCount = getDistributionValue(
    payrollRunStatusDistribution,
    'DRAFT',
  );
  const finalizedRunCount = getDistributionValue(
    payrollRunStatusDistribution,
    'FINALIZED',
  );
  const postedRunCount = getDistributionValue(
    payrollRunStatusDistribution,
    'POSTED',
  );
  const cancelledRunCount = getDistributionValue(
    payrollRunStatusDistribution,
    'CANCELLED',
  );
  const activeRunCount = draftRunCount + finalizedRunCount;
  const payrollScopeDistribution = groupCount(
    payrollRuns.items,
    (run) => run.projectId ?? run.costCenterId ?? 'company-wide',
    (run) => run.projectName ?? run.costCenterName ?? 'Company-wide',
  );

  return {
    salaryStructureCount,
    payrollWorkloadCards: [
      {
        key: 'salary-structures',
        label: 'Salary structures',
        value: salaryStructureCount,
      },
      {
        key: 'payroll-employees',
        label: 'Payroll employees',
        value: payrollEmployeeCount,
      },
      {
        key: 'draft-runs',
        label: 'Draft runs',
        value: draftRunCount,
      },
      {
        key: 'finalized-runs',
        label: 'Finalized runs',
        value: finalizedRunCount,
      },
      {
        key: 'posted-runs',
        label: 'Posted runs',
        value: postedRunCount,
      },
    ],
    payrollPostingCards: [
      {
        key: 'active-runs',
        label: 'Runs needing follow-up',
        value: activeRunCount,
      },
      {
        key: 'ready-to-post',
        label: 'Ready to post',
        value: finalizedRunCount,
      },
      {
        key: 'posted-runs',
        label: 'Posted runs',
        value: postedRunCount,
      },
      {
        key: 'cancelled-runs',
        label: 'Cancelled runs',
        value: cancelledRunCount,
      },
    ],
    payrollRunStatusDistribution,
    payrollScopeDistribution,
    payrollAmountTrend: sortTrend([...amountTrendBucket.values()]),
    payrollAmountSummary: [
      {
        key: 'gross',
        label: 'Gross',
        value: totalGross,
      },
      {
        key: 'deductions',
        label: 'Deductions',
        value: totalDeductions,
      },
      {
        key: 'net',
        label: 'Net',
        value: totalNet,
      },
    ],
    payrollRunRows: payrollRuns.items.slice(0, 5).map((run) => ({
      key: run.id,
      label: `${run.payrollYear}-${String(run.payrollMonth).padStart(2, '0')}`,
      value: toNumber(run.totalNetAmount),
      detail: `${formatEnumLabel(run.status)} run, ${run.lineCount} lines, ${run.projectName ?? run.costCenterName ?? 'company-wide scope'}.`,
    })),
    salaryStructureSample: buildSampleMeta(salaryStructures),
    payrollEmployeeCount,
    payrollRunSample: buildSampleMeta(payrollRuns),
  };
};

export const getAuditDocumentAnalytics = async (
  companyId: string,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
): Promise<AuditDocumentAnalytics> => {
  const [
    attachmentStatusDistribution,
    attachmentSampleResponse,
    auditCategoryDistribution,
    auditEventSampleResponse,
  ] = await Promise.all([
    countByEnum(ATTACHMENT_STATUSES, (status: AttachmentStatus) =>
      countListItems(
        listAttachments(companyId, {
          ...COUNT_QUERY,
          status,
        }),
      ),
    ),
    listAttachments(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...(period?.dateFrom ? { dateFrom: period.dateFrom } : {}),
      ...(period?.dateTo ? { dateTo: period.dateTo } : {}),
    }),
    countByEnum(AUDIT_EVENT_CATEGORIES, (category: AuditEventCategory) =>
      countListItems(
        listAuditEvents(companyId, {
          ...COUNT_QUERY,
          category,
        }),
      ),
    ),
    listAuditEvents(companyId, {
      ...SAMPLE_QUERY,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...(period?.dateFrom ? { dateFrom: period.dateFrom } : {}),
      ...(period?.dateTo ? { dateTo: period.dateTo } : {}),
    }),
  ]);
  const auditTrendBucket = new Map<string, AnalyticsTrendPoint>();
  const attachmentTrendBucket = new Map<string, AnalyticsTrendPoint>();

  auditEventSampleResponse.items.forEach((event) => {
    addTrendValue(auditTrendBucket, getDayKey(event.createdAt), 'events', 1);
  });
  attachmentSampleResponse.items.forEach((attachment) => {
    addTrendValue(
      attachmentTrendBucket,
      getDayKey(attachment.createdAt),
      'uploads',
      1,
    );
    if (attachment.status === 'AVAILABLE') {
      addTrendValue(
        attachmentTrendBucket,
        getDayKey(attachment.createdAt),
        'available',
        1,
      );
    }
  });

  const attachmentEntityDistribution = ATTACHMENT_ENTITY_TYPES.map(
    (entityType: AttachmentEntityType) => ({
      key: entityType,
      label: formatEnumLabel(entityType),
      value: attachmentSampleResponse.items.reduce(
        (count, attachment) =>
          count +
          attachment.links.filter(
            (link) => link.isActive && link.entityType === entityType,
          ).length,
        0,
      ),
    }),
  ).filter((item) => item.value > 0);
  const attachmentLinkCount = attachmentSampleResponse.items.reduce(
    (sum, attachment) =>
      sum + attachment.links.filter((link) => link.isActive).length,
    0,
  );
  const unlinkedAttachmentCount = attachmentSampleResponse.items.filter(
    (attachment) => attachment.activeLinkCount === 0,
  ).length;
  const auditEventTypeDistribution = groupCount(
    auditEventSampleResponse.items,
    (event) => event.eventType,
    (event) => event.eventType,
  );

  return {
    documentCoverageCards: [
      {
        key: 'attachments',
        label: 'Attachments',
        value: attachmentSampleResponse.meta.total,
      },
      {
        key: 'available-attachments',
        label: 'Available files',
        value: getDistributionValue(attachmentStatusDistribution, 'AVAILABLE'),
      },
      {
        key: 'pending-uploads',
        label: 'Pending uploads',
        value: getDistributionValue(
          attachmentStatusDistribution,
          'PENDING_UPLOAD',
        ),
      },
      {
        key: 'active-links',
        label: 'Active links',
        value: attachmentLinkCount,
      },
      {
        key: 'audit-events',
        label: 'Audit events',
        value: auditEventSampleResponse.meta.total,
      },
    ],
    attachmentStatusDistribution,
    attachmentEntityDistribution,
    attachmentActivityTrend: sortTrend([...attachmentTrendBucket.values()]),
    auditCategoryDistribution,
    auditEventTypeDistribution,
    auditActivityTrend: sortTrend([...auditTrendBucket.values()]),
    auditAttentionRows: [
      {
        key: 'pending-uploads',
        label: 'Attachments pending finalize',
        value: getDistributionValue(
          attachmentStatusDistribution,
          'PENDING_UPLOAD',
        ),
        detail:
          'Files still in upload-intent state from the attachment metadata endpoint.',
      },
      {
        key: 'unlinked-attachments',
        label: 'Sampled attachments without active links',
        value: unlinkedAttachmentCount,
        detail:
          'Counts sampled attachments with no active entity links in the returned metadata.',
      },
      {
        key: 'auth-events',
        label: 'Auth audit events',
        value: getDistributionValue(auditCategoryDistribution, 'AUTH'),
        detail: 'Authentication activity visible through the audit event API.',
      },
    ],
    attachmentSample: buildSampleMeta(attachmentSampleResponse),
    auditEventSample: buildSampleMeta(auditEventSampleResponse),
  };
};

export const getDashboardAnalytics = async (
  companyId: string,
  access: DashboardAccess,
  period: DashboardPeriod,
): Promise<DashboardAnalyticsResponse> => {
  const response: DashboardAnalyticsResponse = {
    companyId,
    period,
    financial: null,
    accounting: null,
    property: null,
    crm: null,
    hr: null,
    payroll: null,
    documents: null,
    issues: [],
  };
  const tasks: Promise<void>[] = [];

  const pushTask = <TValue>(
    enabled: boolean,
    issueId: string,
    issueTitle: string,
    load: () => Promise<TValue>,
    assign: (value: TValue) => void,
  ) => {
    if (!enabled) {
      return;
    }

    tasks.push(
      load()
        .then(assign)
        .catch((error) => {
          response.issues.push(createIssue(issueId, issueTitle, error));
        }),
    );
  };

  pushTask(
    access.financialReports,
    'financial-analytics',
    'Financial analytics are unavailable.',
    () => getFinancialAnalytics(companyId, period),
    (value) => {
      response.financial = value;
    },
  );
  pushTask(
    access.accounting,
    'accounting-analytics',
    'Accounting analytics are unavailable.',
    () => getAccountingAnalytics(companyId, period),
    (value) => {
      response.accounting = value;
    },
  );
  pushTask(
    access.projectProperty,
    'property-analytics',
    'Project and property analytics are unavailable.',
    () => getProjectPropertyAnalytics(companyId),
    (value) => {
      response.property = value;
    },
  );
  pushTask(
    access.crm,
    'crm-analytics',
    'CRM and property-desk analytics are unavailable.',
    () => getCrmAnalytics(companyId, period),
    (value) => {
      response.crm = value;
    },
  );
  pushTask(
    access.hr,
    'hr-analytics',
    'HR analytics are unavailable.',
    () => getHrAnalytics(companyId, period),
    (value) => {
      response.hr = value;
    },
  );
  pushTask(
    access.payroll,
    'payroll-analytics',
    'Payroll analytics are unavailable.',
    () => getPayrollAnalytics(companyId),
    (value) => {
      response.payroll = value;
    },
  );
  pushTask(
    access.documents || access.auditEvents,
    'document-audit-analytics',
    'Document and audit analytics are unavailable.',
    () => getAuditDocumentAnalytics(companyId, period),
    (value) => {
      response.documents = value;
    },
  );

  await Promise.all(tasks);

  return response;
};

export const analyticsCountQuery = COUNT_QUERY satisfies ListQueryParams;
