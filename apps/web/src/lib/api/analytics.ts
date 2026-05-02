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
import { listAttendanceLogs, listEmployees, listLeaveRequests } from './hr-core';
import { listPayrollRuns, listSalaryStructures } from './payroll';
import {
  listProjects,
  listUnits,
  listUnitStatuses,
  listUnitTypes,
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
  voucherStatusDistribution: AnalyticsDataPoint[];
  voucherTypeDistribution: AnalyticsDataPoint[];
  monthlyVoucherMovement: AnalyticsTrendPoint[];
  voucherSample: AnalyticsSampleMeta;
  unbalancedVoucherSampleCount: number;
}

export interface ProjectPropertyAnalytics {
  projectCount: number;
  unitTypeCount: number;
  totalUnitCount: number;
  unitStatusDistribution: AnalyticsDataPoint[];
  unitsByProject: AnalyticsDataPoint[];
  unitsByUnitType: AnalyticsDataPoint[];
  inventoryStatusCards: AnalyticsDataPoint[];
  unitSample: AnalyticsSampleMeta;
}

export interface CrmAnalytics {
  customerCount: number;
  leadStatusDistribution: AnalyticsDataPoint[];
  bookingStatusDistribution: AnalyticsDataPoint[];
  bookingContractFunnel: AnalyticsDataPoint[];
  installmentStateDistribution: AnalyticsDataPoint[];
  collectionTrend: AnalyticsTrendPoint[];
  collectionSample: AnalyticsSampleMeta;
}

export interface HrAnalytics {
  employeeCount: number;
  employeesByDepartment: AnalyticsDataPoint[];
  employeesByLocation: AnalyticsDataPoint[];
  leaveStatusDistribution: AnalyticsDataPoint[];
  attendanceTrend: AnalyticsTrendPoint[];
  employeeSample: AnalyticsSampleMeta;
  attendanceSample: AnalyticsSampleMeta;
}

export interface PayrollAnalytics {
  salaryStructureCount: number;
  payrollRunStatusDistribution: AnalyticsDataPoint[];
  payrollAmountTrend: AnalyticsTrendPoint[];
  payrollAmountSummary: AnalyticsDataPoint[];
  payrollRunSample: AnalyticsSampleMeta;
}

export interface AuditDocumentAnalytics {
  attachmentStatusDistribution: AnalyticsDataPoint[];
  attachmentEntityDistribution: AnalyticsDataPoint[];
  auditCategoryDistribution: AnalyticsDataPoint[];
  auditActivityTrend: AnalyticsTrendPoint[];
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
    voucherStatusDistribution,
    voucherTypeDistribution,
    monthlyVoucherMovement: sortTrend([...monthlyMovementBucket.values()]),
    voucherSample: buildSampleMeta(voucherSampleResponse),
    unbalancedVoucherSampleCount: voucherSampleResponse.items.filter(
      (voucher: VoucherRecord) =>
        Math.abs(toNumber(voucher.totalDebit) - toNumber(voucher.totalCredit)) >
        0.005,
    ).length,
  };
};

export const getProjectPropertyAnalytics = async (
  companyId: string,
): Promise<ProjectPropertyAnalytics> => {
  const [projectsCount, unitTypeCount, unitStatuses, unitSampleResponse] =
    await Promise.all([
      countListItems(listProjects(companyId, COUNT_QUERY)),
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

  return {
    projectCount: projectsCount,
    unitTypeCount,
    totalUnitCount: unitSampleResponse.meta.total,
    unitStatusDistribution,
    unitsByProject: groupCount(
      unitSampleResponse.items,
      (unit) => unit.projectId,
      (unit) => unit.projectName,
    ),
    unitsByUnitType: groupCount(
      unitSampleResponse.items,
      (unit) => unit.unitTypeId,
      (unit) => unit.unitTypeName,
    ),
    inventoryStatusCards: [
      {
        key: 'available',
        label: 'Available',
        value: statusValueByCode.AVAILABLE ?? 0,
      },
      {
        key: 'booked',
        label: 'Booked',
        value: statusValueByCode.BOOKED ?? 0,
      },
      {
        key: 'sold',
        label: 'Sold',
        value: statusValueByCode.SOLD ?? 0,
      },
    ],
    unitSample: buildSampleMeta(unitSampleResponse),
  };
};

export const getCrmAnalytics = async (
  companyId: string,
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'>,
): Promise<CrmAnalytics> => {
  const [
    customerCount,
    leadStatusDistribution,
    bookingStatusDistribution,
    saleContractCount,
    installmentStateDistribution,
    collectionSampleResponse,
  ] = await Promise.all([
    countListItems(listCustomers(companyId, COUNT_QUERY)),
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
    countListItems(listSaleContracts(companyId, COUNT_QUERY)),
    countByEnum(PROPERTY_DESK_DUE_STATES, (dueState: PropertyDeskDueState) =>
      countListItems(
        listInstallmentSchedules(companyId, {
          ...COUNT_QUERY,
          dueState,
        }),
      ),
    ),
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
  const totalCollections = collectionSampleResponse.meta.total;
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

  return {
    employeeCount: employeeSampleResponse.meta.total,
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
    attendanceTrend: sortTrend([...attendanceTrendBucket.values()]),
    employeeSample: buildSampleMeta(employeeSampleResponse),
    attendanceSample: buildSampleMeta(attendanceSampleResponse),
  };
};

export const getPayrollAnalytics = async (
  companyId: string,
): Promise<PayrollAnalytics> => {
  const [salaryStructureCount, payrollRunStatusDistribution, payrollRuns] =
    await Promise.all([
      countListItems(listSalaryStructures(companyId, COUNT_QUERY)),
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

  return {
    salaryStructureCount,
    payrollRunStatusDistribution,
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

  auditEventSampleResponse.items.forEach((event) => {
    addTrendValue(auditTrendBucket, getDayKey(event.createdAt), 'events', 1);
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

  return {
    attachmentStatusDistribution,
    attachmentEntityDistribution,
    auditCategoryDistribution,
    auditActivityTrend: sortTrend([...auditTrendBucket.values()]),
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
