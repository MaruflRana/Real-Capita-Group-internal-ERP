import { listVouchers } from './accounting';
import { listAttachments, listAuditEvents } from './audit-documents';
import { isApiError } from './client';
import {
  listBookings,
  listCollections,
  listSaleContracts,
} from './crm-property-desk';
import {
  getBalanceSheetReport,
  getProfitAndLossReport,
  getTrialBalanceReport,
} from './financial-reporting';
import { listEmployees, listLeaveRequests } from './hr-core';
import { listPayrollRuns } from './payroll';
import { listUnits, listUnitStatuses } from './project-property';

import type {
  AttachmentRecord,
  AuditEventRecord,
  BookingRecord,
  CollectionRecord,
  LeaveRequestRecord,
  PayrollRunRecord,
  SaleContractRecord,
  VoucherRecord,
} from './types';

const COUNT_QUERY = {
  page: 1,
  pageSize: 1,
} as const;

const ACTIVITY_PAGE_SIZE = 3;

export interface DashboardAccess {
  dashboard: boolean;
  accounting: boolean;
  financialReports: boolean;
  projectProperty: boolean;
  crm: boolean;
  hr: boolean;
  payroll: boolean;
  documents: boolean;
  auditEvents: boolean;
  orgSecurity: boolean;
}

export interface DashboardPeriod {
  id: string;
  label: string;
  dateFrom: string;
  dateTo: string;
  asOfDate: string;
}

export interface DashboardIssue {
  id: string;
  title: string;
  message: string;
}

export interface DashboardFinancialSummary {
  dateFrom: string;
  dateTo: string;
  asOfDate: string;
  netProfitLoss: string;
  totalAssets: string;
  totalLiabilitiesAndEquity: string;
  closingDebit: string;
  closingCredit: string;
  isBalanced: boolean;
  unclosedEarnings: string;
}

export interface DashboardAccountingSummary {
  draftVoucherCount: number;
  postedVoucherCount: number;
}

export interface DashboardPropertySummary {
  totalUnitCount: number;
  availableUnitCount: number;
  bookedUnitCount: number;
  soldUnitCount: number;
}

export interface DashboardCrmSummary {
  activeBookingCount: number;
  saleContractCount: number;
  recentCollectionCount: number;
}

export interface DashboardPeopleSummary {
  employeeCount?: number;
  pendingLeaveRequestCount?: number;
  draftPayrollRunCount?: number;
  finalizedPayrollRunCount?: number;
  openPayrollRunCount?: number;
}

export interface DashboardDocumentSummary {
  recentAttachmentCount?: number;
  recentAuditEventCount?: number;
  pendingAttachmentCount?: number;
}

export interface DashboardSummaryResponse {
  companyId: string;
  period: DashboardPeriod;
  financial: DashboardFinancialSummary | null;
  accounting: DashboardAccountingSummary | null;
  property: DashboardPropertySummary | null;
  crm: DashboardCrmSummary | null;
  people: DashboardPeopleSummary | null;
  documents: DashboardDocumentSummary | null;
  issues: DashboardIssue[];
}

export interface DashboardActivityResponse {
  companyId: string;
  vouchers: VoucherRecord[];
  bookings: BookingRecord[];
  saleContracts: SaleContractRecord[];
  collections: CollectionRecord[];
  leaveRequests: LeaveRequestRecord[];
  payrollRuns: PayrollRunRecord[];
  attachments: AttachmentRecord[];
  auditEvents: AuditEventRecord[];
  issues: DashboardIssue[];
}

const getIssueMessage = (error: unknown) => {
  if (isApiError(error)) {
    return error.apiError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'The request could not be completed.';
};

const createIssue = (
  id: string,
  title: string,
  error: unknown,
): DashboardIssue => ({
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

export const getDashboardSummary = async (
  companyId: string,
  access: DashboardAccess,
  period: DashboardPeriod,
): Promise<DashboardSummaryResponse> => {
  const summary: DashboardSummaryResponse = {
    companyId,
    period,
    financial: null,
    accounting: null,
    property: null,
    crm: null,
    people: null,
    documents: null,
    issues: [],
  };

  const tasks: Promise<void>[] = [];

  if (access.accounting) {
    tasks.push(
      (async () => {
        try {
          const [draftVoucherCount, postedVoucherCount] = await Promise.all([
            countListItems(
              listVouchers(companyId, {
                ...COUNT_QUERY,
                status: 'DRAFT',
              }),
            ),
            countListItems(
              listVouchers(companyId, {
                ...COUNT_QUERY,
                status: 'POSTED',
              }),
            ),
          ]);

          summary.accounting = {
            draftVoucherCount,
            postedVoucherCount,
          };
        } catch (error) {
          summary.issues.push(
            createIssue(
              'accounting-summary',
              'Accounting summary is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.financialReports) {
    tasks.push(
      (async () => {
        try {
          const [profitAndLoss, balanceSheet, trialBalance] = await Promise.all([
            getProfitAndLossReport(companyId, {
              dateFrom: period.dateFrom,
              dateTo: period.dateTo,
            }),
            getBalanceSheetReport(companyId, {
              asOfDate: period.asOfDate,
            }),
            getTrialBalanceReport(companyId, {
              dateFrom: period.dateFrom,
              dateTo: period.dateTo,
            }),
          ]);

          summary.financial = {
            dateFrom: period.dateFrom,
            dateTo: period.dateTo,
            asOfDate: period.asOfDate,
            netProfitLoss: profitAndLoss.totals.netProfitLoss,
            totalAssets: balanceSheet.totals.totalAssets,
            totalLiabilitiesAndEquity:
              balanceSheet.totals.totalLiabilitiesAndEquity,
            closingDebit: trialBalance.totals.closingDebit,
            closingCredit: trialBalance.totals.closingCredit,
            isBalanced: balanceSheet.isBalanced,
            unclosedEarnings: balanceSheet.totals.unclosedEarnings,
          };
        } catch (error) {
          summary.issues.push(
            createIssue(
              'financial-summary',
              'Financial reports summary is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.projectProperty) {
    tasks.push(
      (async () => {
        try {
          const unitStatuses = await listUnitStatuses(companyId, {
            page: 1,
            pageSize: 100,
            sortBy: 'sortOrder',
            sortOrder: 'asc',
          });

          const statusIdByCode = Object.fromEntries(
            unitStatuses.items.map((status) => [status.code, status.id]),
          ) as Record<string, string | undefined>;

          const [totalUnitCount, availableUnitCount, bookedUnitCount, soldUnitCount] =
            await Promise.all([
              countListItems(listUnits(companyId, COUNT_QUERY)),
              statusIdByCode.AVAILABLE
                ? countListItems(
                    listUnits(companyId, {
                      ...COUNT_QUERY,
                      unitStatusId: statusIdByCode.AVAILABLE,
                    }),
                  )
                : Promise.resolve(0),
              statusIdByCode.BOOKED
                ? countListItems(
                    listUnits(companyId, {
                      ...COUNT_QUERY,
                      unitStatusId: statusIdByCode.BOOKED,
                    }),
                  )
                : Promise.resolve(0),
              statusIdByCode.SOLD
                ? countListItems(
                    listUnits(companyId, {
                      ...COUNT_QUERY,
                      unitStatusId: statusIdByCode.SOLD,
                    }),
                  )
                : Promise.resolve(0),
            ]);

          summary.property = {
            totalUnitCount,
            availableUnitCount,
            bookedUnitCount,
            soldUnitCount,
          };
        } catch (error) {
          summary.issues.push(
            createIssue(
              'property-summary',
              'Project and property summary is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.crm) {
    tasks.push(
      (async () => {
        try {
          const [activeBookingCount, saleContractCount, recentCollectionCount] =
            await Promise.all([
              countListItems(
                listBookings(companyId, {
                  ...COUNT_QUERY,
                  status: 'ACTIVE',
                }),
              ),
              countListItems(listSaleContracts(companyId, COUNT_QUERY)),
              countListItems(
                listCollections(companyId, {
                  ...COUNT_QUERY,
                  dateFrom: period.dateFrom,
                  dateTo: period.dateTo,
                }),
              ),
            ]);

          summary.crm = {
            activeBookingCount,
            saleContractCount,
            recentCollectionCount,
          };
        } catch (error) {
          summary.issues.push(
            createIssue(
              'crm-summary',
              'CRM and collections summary is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.hr) {
    tasks.push(
      (async () => {
        try {
          const [employeeCount, pendingLeaveRequestCount] = await Promise.all([
            countListItems(listEmployees(companyId, COUNT_QUERY)),
            countListItems(
              listLeaveRequests(companyId, {
                ...COUNT_QUERY,
                status: 'SUBMITTED',
              }),
            ),
          ]);

          summary.people = {
            ...(summary.people ?? {}),
            employeeCount,
            pendingLeaveRequestCount,
          };
        } catch (error) {
          summary.issues.push(
            createIssue('hr-summary', 'HR summary is unavailable.', error),
          );
        }
      })(),
    );
  }

  if (access.payroll) {
    tasks.push(
      (async () => {
        try {
          const [draftPayrollRunCount, finalizedPayrollRunCount] =
            await Promise.all([
              countListItems(
                listPayrollRuns(companyId, {
                  ...COUNT_QUERY,
                  status: 'DRAFT',
                }),
              ),
              countListItems(
                listPayrollRuns(companyId, {
                  ...COUNT_QUERY,
                  status: 'FINALIZED',
                }),
              ),
            ]);

          summary.people = {
            ...(summary.people ?? {}),
            draftPayrollRunCount,
            finalizedPayrollRunCount,
            openPayrollRunCount:
              draftPayrollRunCount + finalizedPayrollRunCount,
          };
        } catch (error) {
          summary.issues.push(
            createIssue(
              'payroll-summary',
              'Payroll summary is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.documents) {
    tasks.push(
      (async () => {
        try {
          const [recentAttachmentCount, pendingAttachmentCount] =
            await Promise.all([
              countListItems(
                listAttachments(companyId, {
                  ...COUNT_QUERY,
                  dateFrom: period.dateFrom,
                  dateTo: period.dateTo,
                }),
              ),
              countListItems(
                listAttachments(companyId, {
                  ...COUNT_QUERY,
                  status: 'PENDING_UPLOAD',
                }),
              ),
            ]);

          summary.documents = {
            ...(summary.documents ?? {}),
            recentAttachmentCount,
            pendingAttachmentCount,
          };
        } catch (error) {
          summary.issues.push(
            createIssue(
              'document-summary',
              'Document summary is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.auditEvents) {
    tasks.push(
      (async () => {
        try {
          const recentAuditEventCount = await countListItems(
            listAuditEvents(companyId, {
              ...COUNT_QUERY,
              dateFrom: period.dateFrom,
              dateTo: period.dateTo,
            }),
          );

          summary.documents = {
            ...(summary.documents ?? {}),
            recentAuditEventCount,
          };
        } catch (error) {
          summary.issues.push(
            createIssue(
              'audit-summary',
              'Audit summary is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  await Promise.all(tasks);

  return summary;
};

export const getDashboardActivity = async (
  companyId: string,
  access: DashboardAccess,
): Promise<DashboardActivityResponse> => {
  const activity: DashboardActivityResponse = {
    companyId,
    vouchers: [],
    bookings: [],
    saleContracts: [],
    collections: [],
    leaveRequests: [],
    payrollRuns: [],
    attachments: [],
    auditEvents: [],
    issues: [],
  };

  const tasks: Promise<void>[] = [];

  if (access.accounting) {
    tasks.push(
      (async () => {
        try {
          const response = await listVouchers(companyId, {
            page: 1,
            pageSize: 5,
            sortBy: 'voucherDate',
            sortOrder: 'desc',
          });

          activity.vouchers = response.items;
        } catch (error) {
          activity.issues.push(
            createIssue(
              'voucher-activity',
              'Recent voucher activity is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.crm) {
    tasks.push(
      (async () => {
        try {
          const [bookings, saleContracts, collections] = await Promise.all([
            listBookings(companyId, {
              page: 1,
              pageSize: ACTIVITY_PAGE_SIZE,
              sortBy: 'bookingDate',
              sortOrder: 'desc',
            }),
            listSaleContracts(companyId, {
              page: 1,
              pageSize: ACTIVITY_PAGE_SIZE,
              sortBy: 'contractDate',
              sortOrder: 'desc',
            }),
            listCollections(companyId, {
              page: 1,
              pageSize: ACTIVITY_PAGE_SIZE,
              sortBy: 'collectionDate',
              sortOrder: 'desc',
            }),
          ]);

          activity.bookings = bookings.items;
          activity.saleContracts = saleContracts.items;
          activity.collections = collections.items;
        } catch (error) {
          activity.issues.push(
            createIssue(
              'crm-activity',
              'Recent CRM activity is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.hr) {
    tasks.push(
      (async () => {
        try {
          const response = await listLeaveRequests(companyId, {
            page: 1,
            pageSize: ACTIVITY_PAGE_SIZE,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          });

          activity.leaveRequests = response.items;
        } catch (error) {
          activity.issues.push(
            createIssue(
              'leave-activity',
              'Recent leave-request activity is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.payroll) {
    tasks.push(
      (async () => {
        try {
          const response = await listPayrollRuns(companyId, {
            page: 1,
            pageSize: ACTIVITY_PAGE_SIZE,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          });

          activity.payrollRuns = response.items;
        } catch (error) {
          activity.issues.push(
            createIssue(
              'payroll-activity',
              'Recent payroll activity is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.documents) {
    tasks.push(
      (async () => {
        try {
          const response = await listAttachments(companyId, {
            page: 1,
            pageSize: ACTIVITY_PAGE_SIZE,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          });

          activity.attachments = response.items;
        } catch (error) {
          activity.issues.push(
            createIssue(
              'attachment-activity',
              'Recent attachment activity is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  if (access.auditEvents) {
    tasks.push(
      (async () => {
        try {
          const response = await listAuditEvents(companyId, {
            page: 1,
            pageSize: ACTIVITY_PAGE_SIZE,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          });

          activity.auditEvents = response.items;
        } catch (error) {
          activity.issues.push(
            createIssue(
              'audit-activity',
              'Recent audit activity is unavailable.',
              error,
            ),
          );
        }
      })(),
    );
  }

  await Promise.all(tasks);

  return activity;
};
