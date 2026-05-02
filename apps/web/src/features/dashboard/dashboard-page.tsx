'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  buttonVariants,
  cn,
} from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { AppPage } from '../../components/ui/erp-primitives';
import { getRoleLabels } from '../../lib/access';
import { DashboardAnalyticsPanel } from '../analytics/module-panels';
import {
  formatAttachmentStatusLabel,
  formatAuditEventCategoryLabel,
  formatFileSize,
  getAuditTargetLabel,
} from '../audit-documents/utils';
import { formatVoucherStatusLabel } from '../accounting/utils';
import {
  formatPayrollPeriodLabel,
  formatPayrollRunStatusLabel,
  getPayrollRunScopeLabel,
} from '../payroll-core/utils';
import {
  DashboardAttentionCard,
  DashboardIssueBanner,
  DashboardLoadingGrid,
  DashboardQuickActionTile,
  DashboardSection,
  DashboardSummaryPanel,
  DashboardTimelinePanel,
} from './shared';
import { HealthStatusCard } from './health-status-card';
import { useDashboardActivity, useDashboardSummary } from './hooks';
import {
  buildDashboardPeriod,
  DASHBOARD_PERIOD_PRESETS,
  formatEnumLabel,
  getAccessibleWorkspaceLabels,
  getDashboardQuickActions,
  type DashboardPeriodPresetId,
} from './utils';
import {
  APP_ROUTES,
  getAttachmentDetailRoute,
  getPayrollRunDetailRoute,
  getVoucherDetailRoute,
} from '../../lib/routes';
import {
  formatAccountingAmount,
  formatDate,
  formatDateTime,
} from '../../lib/format';

export const DashboardPage = () => {
  const {
    access: userAccess,
    canAccessAccounting,
    canAccessAuditEvents,
    canAccessCrmPropertyDesk,
    canAccessDocuments,
    canAccessHr,
    canAccessOrgSecurity,
    canAccessPayroll,
    canAccessProjectProperty,
    user,
  } = useAuth();
  const [periodPreset, setPeriodPreset] =
    useState<DashboardPeriodPresetId>('all-activity');

  if (!user) {
    return null;
  }

  const access = useMemo(
    () => ({
      dashboard: userAccess.dashboard,
      accounting: canAccessAccounting,
      financialReports: userAccess.financialReports,
      projectProperty: canAccessProjectProperty,
      crm: canAccessCrmPropertyDesk,
      hr: canAccessHr,
      payroll: canAccessPayroll,
      documents: canAccessDocuments,
      auditEvents: canAccessAuditEvents,
      orgSecurity: canAccessOrgSecurity,
    }),
    [
      canAccessAccounting,
      canAccessAuditEvents,
      canAccessCrmPropertyDesk,
      canAccessDocuments,
      canAccessHr,
      canAccessOrgSecurity,
      canAccessPayroll,
      canAccessProjectProperty,
      userAccess.dashboard,
      userAccess.financialReports,
    ],
  );
  const period = useMemo(
    () => buildDashboardPeriod(periodPreset),
    [periodPreset],
  );
  const summaryQuery = useDashboardSummary(user.currentCompany.id, access, period);
  const activityQuery = useDashboardActivity(user.currentCompany.id, access);

  const workspaceLabels = getAccessibleWorkspaceLabels(access);
  const quickActions = getDashboardQuickActions(access);

  const summaryPanels = useMemo(() => {
    const panels: Array<{
      key: string;
      title: string;
      description: string;
      href: string;
      items: Array<{
        label: string;
        value: string;
        hint: string;
      }>;
    }> = [];
    const summary = summaryQuery.data;

    if (!summary) {
      return panels;
    }

    if (summary.financial && access.financialReports) {
      panels.push({
        key: 'financial',
        title: 'Financial summary',
        description:
          'Posted-statement metrics from the existing reporting endpoints for the active company.',
        href: APP_ROUTES.accountingReportsBusinessOverview,
        items: [
          {
            label: 'Net profit / loss',
            value: formatAccountingAmount(summary.financial.netProfitLoss),
            hint: `Reporting window: ${summary.period.label}`,
          },
          {
            label: 'Total assets',
            value: formatAccountingAmount(summary.financial.totalAssets),
            hint: `Balance sheet as of ${formatDate(summary.financial.asOfDate)}`,
          },
          {
            label: 'Liabilities + equity',
            value: formatAccountingAmount(
              summary.financial.totalLiabilitiesAndEquity,
            ),
            hint: summary.financial.isBalanced
              ? 'Balance sheet remains in balance.'
              : 'Balance sheet needs review.',
          },
          {
            label: 'Trial balance',
            value: `${formatAccountingAmount(summary.financial.closingDebit)} / ${formatAccountingAmount(summary.financial.closingCredit)}`,
            hint: 'Closing debit and credit totals from the current reporting window.',
          },
        ],
      });
    }

    if (summary.accounting && access.accounting) {
      panels.push({
        key: 'accounting',
        title: 'Accounting operations',
        description:
          'Current voucher workload pulled directly from the accounting module.',
        href: APP_ROUTES.accountingVouchers,
        items: [
          {
            label: 'Draft vouchers',
            value: String(summary.accounting.draftVoucherCount),
            hint: 'Editable vouchers awaiting explicit posting.',
          },
          {
            label: 'Posted vouchers',
            value: String(summary.accounting.postedVoucherCount),
            hint: 'Posted vouchers currently visible in company scope.',
          },
        ],
      });
    }

    if ((summary.property || summary.crm) && (access.projectProperty || access.crm)) {
      panels.push({
        key: 'property-sales',
        title: 'Property and sales',
        description:
          'Current inventory and commercial activity across the master and CRM slices.',
        href: access.projectProperty
          ? APP_ROUTES.projectPropertyUnits
          : APP_ROUTES.crmPropertyDeskBookings,
        items: [
          ...(summary.property
            ? [
                {
                  label: 'Total units',
                  value: String(summary.property.totalUnitCount),
                  hint: 'All units currently tracked in the active company.',
                },
                {
                  label: 'Available units',
                  value: String(summary.property.availableUnitCount),
                  hint: 'Units currently ready for booking.',
                },
                {
                  label: 'Booked units',
                  value: String(summary.property.bookedUnitCount),
                  hint: 'Units presently reserved in the sales pipeline.',
                },
                {
                  label: 'Sold units',
                  value: String(summary.property.soldUnitCount),
                  hint: 'Units fully converted into sales.',
                },
              ]
            : []),
          ...(summary.crm
            ? [
                {
                  label: 'Active bookings',
                  value: String(summary.crm.activeBookingCount),
                  hint: 'Bookings still operating in the BOOKED state.',
                },
                {
                  label: 'Sale contracts',
                  value: String(summary.crm.saleContractCount),
                  hint: 'Contracts recorded in the existing CRM contract module.',
                },
                {
                  label: 'Recent collections',
                  value: String(summary.crm.recentCollectionCount),
                  hint: `Collections recorded during ${summary.period.label.toLowerCase()}.`,
                },
              ]
            : []),
        ],
      });
    }

    if (summary.people && (access.hr || access.payroll)) {
      panels.push({
        key: 'people',
        title: 'People operations',
        description:
          'Headcount, leave-review workload, and payroll run status for the current company.',
        href: access.payroll ? APP_ROUTES.payrollRuns : APP_ROUTES.hrLeaveRequests,
        items: [
          ...(summary.people.employeeCount !== undefined
            ? [
                {
                  label: 'Employees',
                  value: String(summary.people.employeeCount),
                  hint: 'Employee records available to the current HR scope.',
                },
              ]
            : []),
          ...(summary.people.pendingLeaveRequestCount !== undefined
            ? [
                {
                  label: 'Pending leave requests',
                  value: String(summary.people.pendingLeaveRequestCount),
                  hint: 'Leave requests currently in SUBMITTED state.',
                },
              ]
            : []),
          ...(summary.people.openPayrollRunCount !== undefined
            ? [
                {
                  label: 'Open payroll runs',
                  value: String(summary.people.openPayrollRunCount),
                  hint: 'Draft and finalized payroll runs that still need follow-up.',
                },
              ]
            : []),
        ],
      });
    }

    if (summary.documents && (access.documents || access.auditEvents)) {
      panels.push({
        key: 'documents',
        title: 'Documents and audit',
        description:
          'Recent file activity and audit traffic using the existing attachment and audit modules.',
        href: access.documents
          ? APP_ROUTES.auditDocumentsAttachments
          : APP_ROUTES.auditDocumentsAuditEvents,
        items: [
          ...(summary.documents.recentAttachmentCount !== undefined
            ? [
                {
                  label: 'Recent attachments',
                  value: String(summary.documents.recentAttachmentCount),
                  hint: `Attachments created during ${summary.period.label.toLowerCase()}.`,
                },
              ]
            : []),
          ...(summary.documents.recentAuditEventCount !== undefined
            ? [
                {
                  label: 'Recent audit events',
                  value: String(summary.documents.recentAuditEventCount),
                  hint: `Audit events created during ${summary.period.label.toLowerCase()}.`,
                },
              ]
            : []),
        ],
      });
    }

    return panels.filter((panel) => panel.items.length > 0);
  }, [
    access.accounting,
    access.auditEvents,
    access.crm,
    access.documents,
    access.financialReports,
    access.hr,
    access.payroll,
    access.projectProperty,
    summaryQuery.data,
  ]);
  const recentActivityPanels = useMemo(() => {
    const activity = activityQuery.data;

    if (!activity) {
      return [];
    }

    const panels: Array<{
      key: string;
      title: string;
      description: string;
      href: string;
      items: Array<{
        id: string;
        typeLabel: string;
        title: string;
        occurredAt: string;
        details: string[];
        href?: string;
      }>;
      emptyTitle: string;
      emptyDescription: string;
    }> = [];

    if (access.accounting) {
      panels.push({
        key: 'recent-vouchers',
        title: 'Recent vouchers',
        description:
          'Latest accounting records from the company voucher list.',
        href: APP_ROUTES.accountingVouchers,
        items: activity.vouchers.map((voucher) => ({
          id: `voucher-${voucher.id}`,
          typeLabel: voucher.voucherType,
          title:
            voucher.reference?.trim() ||
            voucher.description?.trim() ||
            `Voucher ${voucher.id}`,
          occurredAt: voucher.voucherDate,
          href: getVoucherDetailRoute(voucher.id),
          details: [
            formatVoucherStatusLabel(voucher.status),
            `${formatAccountingAmount(voucher.totalDebit)} debit`,
            `${voucher.lineCount} lines`,
          ],
        })),
        emptyTitle: 'No vouchers found',
        emptyDescription:
          'Voucher activity will appear here once accounting entries are available.',
      });
    }

    if (access.crm) {
      const crmItems = [
        ...activity.bookings.map((booking) => ({
          id: `booking-${booking.id}`,
          typeLabel: 'Booking',
          title: `${booking.customerName} booked ${booking.unitCode}`,
          occurredAt: booking.bookingDate,
          href: APP_ROUTES.crmPropertyDeskBookings,
          details: [
            booking.projectCode,
            formatEnumLabel(booking.status),
            formatAccountingAmount(booking.bookingAmount),
          ].filter(Boolean),
        })),
        ...activity.saleContracts.map((saleContract) => ({
          id: `sale-contract-${saleContract.id}`,
          typeLabel: 'Sale contract',
          title: `${saleContract.customerName} contract for ${saleContract.unitCode}`,
          occurredAt: saleContract.contractDate,
          href: APP_ROUTES.crmPropertyDeskSaleContracts,
          details: [
            saleContract.projectCode,
            formatAccountingAmount(saleContract.contractAmount),
            saleContract.reference?.trim() || 'Reference not set',
          ],
        })),
        ...activity.collections.map((collection) => ({
          id: `collection-${collection.id}`,
          typeLabel: 'Collection',
          title: `${collection.customerName} collection recorded`,
          occurredAt: collection.collectionDate,
          href: APP_ROUTES.crmPropertyDeskCollections,
          details: [
            formatAccountingAmount(collection.amount),
            collection.voucherReference?.trim() || 'Voucher reference unavailable',
            collection.reference?.trim() || 'No external reference',
          ],
        })),
      ]
        .sort(
          (left, right) =>
            new Date(right.occurredAt).getTime() -
            new Date(left.occurredAt).getTime(),
        )
        .slice(0, 5);

      panels.push({
        key: 'recent-commercial',
        title: 'Recent commercial activity',
        description:
          'Latest bookings, contracts, and collections in the CRM workspace.',
        href: APP_ROUTES.crmPropertyDeskBookings,
        items: crmItems,
        emptyTitle: 'No commercial activity found',
        emptyDescription:
          'Bookings, contracts, and collections will appear here once recorded.',
      });
    }

    if (access.hr || access.payroll) {
      const peopleItems = [
        ...activity.leaveRequests.map((leaveRequest) => ({
          id: `leave-${leaveRequest.id}`,
          typeLabel: 'Leave request',
          title: `${leaveRequest.employeeFullName} requested ${leaveRequest.leaveTypeName}`,
          occurredAt: leaveRequest.createdAt,
          href: APP_ROUTES.hrLeaveRequests,
          details: [
            formatEnumLabel(leaveRequest.status),
            `${formatDate(leaveRequest.startDate)} to ${formatDate(leaveRequest.endDate)}`,
          ],
        })),
        ...activity.payrollRuns.map((payrollRun) => ({
          id: `payroll-run-${payrollRun.id}`,
          typeLabel: 'Payroll run',
          title: formatPayrollPeriodLabel(
            payrollRun.payrollYear,
            payrollRun.payrollMonth,
          ),
          occurredAt: payrollRun.createdAt,
          href: getPayrollRunDetailRoute(payrollRun.id),
          details: [
            formatPayrollRunStatusLabel(payrollRun.status),
            getPayrollRunScopeLabel(payrollRun),
            formatAccountingAmount(payrollRun.totalNetAmount),
          ],
        })),
      ]
        .sort(
          (left, right) =>
            new Date(right.occurredAt).getTime() -
            new Date(left.occurredAt).getTime(),
        )
        .slice(0, 5);

      panels.push({
        key: 'recent-people',
        title: 'Recent people operations',
        description:
          'Latest leave-request and payroll run records available to this session.',
        href: access.payroll ? APP_ROUTES.payrollRuns : APP_ROUTES.hrLeaveRequests,
        items: peopleItems,
        emptyTitle: 'No people activity found',
        emptyDescription:
          'Leave requests and payroll runs will appear here once records exist.',
      });
    }

    if (access.documents || access.auditEvents) {
      const documentItems = [
        ...activity.attachments.map((attachment) => ({
          id: `attachment-${attachment.id}`,
          typeLabel: 'Attachment',
          title: attachment.originalFileName,
          occurredAt: attachment.createdAt,
          href: getAttachmentDetailRoute(attachment.id),
          details: [
            formatAttachmentStatusLabel(attachment.status),
            formatFileSize(attachment.sizeBytes),
            attachment.mimeType,
          ],
        })),
        ...activity.auditEvents.map((auditEvent) => ({
          id: `audit-${auditEvent.id}`,
          typeLabel: 'Audit event',
          title: auditEvent.eventType,
          occurredAt: auditEvent.createdAt,
          href: APP_ROUTES.auditDocumentsAuditEvents,
          details: [
            formatAuditEventCategoryLabel(auditEvent.category),
            getAuditTargetLabel(auditEvent),
          ],
        })),
      ]
        .sort(
          (left, right) =>
            new Date(right.occurredAt).getTime() -
            new Date(left.occurredAt).getTime(),
        )
        .slice(0, 5);

      panels.push({
        key: 'recent-documents',
        title: 'Recent document activity',
        description:
          'Latest attachment and audit records in the current company scope.',
        href: access.documents
          ? APP_ROUTES.auditDocumentsAttachments
          : APP_ROUTES.auditDocumentsAuditEvents,
        items: documentItems,
        emptyTitle: 'No document activity found',
        emptyDescription:
          'Attachments and audit events will appear here once records are created.',
      });
    }

    return panels;
  }, [
    activityQuery.data,
    access.accounting,
    access.auditEvents,
    access.crm,
    access.documents,
    access.hr,
    access.payroll,
  ]);
  const attentionItems = useMemo(() => {
    const summary = summaryQuery.data;

    if (!summary) {
      return [];
    }

    const items: Array<{
      key: string;
      title: string;
      count: number;
      description: string;
      href: string;
    } | null> = [
      access.accounting && summary.accounting
        ? {
            key: 'draft-vouchers',
            title: 'Draft vouchers awaiting posting',
            count: summary.accounting.draftVoucherCount,
            description:
              'Draft accounting vouchers still require explicit posting.',
            href: APP_ROUTES.accountingVouchers,
          }
        : null,
      access.projectProperty && summary.property
        ? {
            key: 'available-units',
            title: 'Available units ready for booking',
            count: summary.property.availableUnitCount,
            description:
              'Current inventory that is still in AVAILABLE status.',
            href: APP_ROUTES.projectPropertyUnits,
          }
        : null,
      access.hr &&
      summary.people?.pendingLeaveRequestCount !== undefined
        ? {
            key: 'pending-leave',
            title: 'Leave requests awaiting review',
            count: summary.people.pendingLeaveRequestCount,
            description:
              'Submitted leave requests that still need HR action.',
            href: APP_ROUTES.hrLeaveRequests,
          }
        : null,
      access.payroll &&
      summary.people?.finalizedPayrollRunCount !== undefined
        ? {
            key: 'finalized-payroll',
            title: 'Payroll runs awaiting posting',
            count: summary.people.finalizedPayrollRunCount,
            description:
              'Finalized payroll runs that are ready for accounting posting.',
            href: APP_ROUTES.payrollPosting,
          }
        : null,
      access.documents &&
      summary.documents?.pendingAttachmentCount !== undefined
        ? {
            key: 'pending-attachments',
            title: 'Attachments awaiting finalize',
            count: summary.documents.pendingAttachmentCount,
            description:
              'Uploads still pending finalization before download or linking.',
            href: APP_ROUTES.auditDocumentsAttachments,
          }
        : null,
    ];

    return items.filter((item): item is NonNullable<(typeof items)[number]> =>
      Boolean(item),
    );
  }, [
    access.accounting,
    access.documents,
    access.hr,
    access.payroll,
    access.projectProperty,
    summaryQuery.data,
  ]);

  return (
    <AppPage>
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="min-w-0 overflow-hidden" data-testid="dashboard-context">
          <CardHeader className="border-b border-border bg-surface-raised">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Operational home
            </p>
            <CardTitle className="text-2xl leading-8">
              {user.currentCompany.name}
            </CardTitle>
            <CardDescription className="max-w-4xl leading-6">
              Real-time operational snapshot for the active company session,
              using the existing REST modules already available in this ERP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(180px,240px)]">
              <div className="min-w-0 rounded-lg border border-border bg-surface-muted p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Current company
                </p>
                <p className="mt-2 truncate font-mono text-sm font-semibold text-foreground">
                  {user.currentCompany.slug}
                </p>
              </div>
              <div className="min-w-0 rounded-lg border border-border bg-surface-muted p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Last login
                </p>
                <p className="mt-2 whitespace-nowrap text-sm font-semibold leading-6 text-foreground">
                  {formatDateTime(user.lastLoginAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4">
              <div className="min-w-0 rounded-lg border border-border bg-surface-muted p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Accessible workspaces
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {workspaceLabels.length} available
                  </p>
                </div>
                <div
                  className="mt-3 flex min-w-0 flex-wrap gap-2"
                  data-testid="dashboard-workspace-chips"
                >
                  {workspaceLabels.length > 0 ? (
                    workspaceLabels.map((label) => (
                      <Badge
                        className="max-w-full whitespace-nowrap px-3 py-1.5 text-[11px]"
                        key={label}
                        variant="outline"
                      >
                        <span className="truncate">{label}</span>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No module access is attached to this session yet.
                    </p>
                  )}
                </div>
              </div>

              <div
                className="min-w-0 rounded-lg border border-border bg-surface-muted p-4"
                data-testid="dashboard-period-card"
              >
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="dashboard-period"
                >
                  Dashboard period
                </label>
                <select
                  className="mt-3 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground"
                  id="dashboard-period"
                  onChange={(event) =>
                    setPeriodPreset(event.target.value as DashboardPeriodPresetId)
                  }
                  value={periodPreset}
                >
                  {DASHBOARD_PERIOD_PRESETS.map((preset) => {
                    const option = buildDashboardPeriod(preset);

                    return (
                      <option key={preset} value={preset}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Financial metrics and recent-count widgets follow{' '}
                  <span className="font-medium text-foreground">{period.label}</span>.
                  Recent activity panels always show the latest available records.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <HealthStatusCard />
      </section>

      <DashboardSection
        action={
          canAccessOrgSecurity ? (
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              href={APP_ROUTES.orgSecurityCompanies}
            >
              Open company admin
            </Link>
          ) : undefined
        }
        description="Production-minded summary panels built on top of the existing reporting, accounting, CRM, HR, payroll, attachment, and audit endpoints."
        eyebrow="Summary"
        title="Company snapshot"
      >
        <DashboardIssueBanner issues={summaryQuery.data?.issues ?? []} />

        {summaryQuery.isPending ? (
          <DashboardLoadingGrid count={4} />
        ) : summaryPanels.length === 0 ? (
          <EmptyState
            description="No dashboard summaries are available for the current role set in this company."
            title="No accessible summary panels"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {summaryPanels.map((panel) => (
              <DashboardSummaryPanel
                description={panel.description}
                href={panel.href}
                items={panel.items}
                key={panel.key}
                title={panel.title}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        description="Visual summaries built from existing Phase 1 REST data for the active company and role set."
        eyebrow="Analytics"
        title="Operational analytics"
      >
        <DashboardAnalyticsPanel
          access={access}
          companyId={user.currentCompany.id}
          companySlug={user.currentCompany.slug}
          period={period}
        />
      </DashboardSection>

      <DashboardSection
        description="Latest operational records across the modules this session can access."
        eyebrow="Recent Activity"
        title="Latest records"
      >
        <DashboardIssueBanner issues={activityQuery.data?.issues ?? []} />

        {activityQuery.isPending ? (
          <DashboardLoadingGrid count={4} />
        ) : recentActivityPanels.length === 0 ? (
          <EmptyState
            description="Recent activity panels will appear once accessible modules return live records."
            title="No recent activity panels"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {recentActivityPanels.map((panel) => (
              <DashboardTimelinePanel
                description={panel.description}
                emptyDescription={panel.emptyDescription}
                emptyTitle={panel.emptyTitle}
                href={panel.href}
                items={panel.items}
                key={panel.key}
                title={panel.title}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardSection
          description="Current work queues and operational items that still need follow-up."
          eyebrow="Needs Attention"
          title="Pending work"
        >
          {summaryQuery.isPending ? (
            <DashboardLoadingGrid count={4} />
          ) : attentionItems.length === 0 ? (
            <EmptyState
              description="There are no outstanding dashboard work queues for the modules available to this session."
              title="No pending work"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {attentionItems.map((item) => (
                <DashboardAttentionCard
                  count={item.count}
                  description={item.description}
                  href={item.href}
                  key={item.key}
                  title={item.title}
                />
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          description="Direct links into the existing module routes already available in this monorepo."
          eyebrow="Quick Actions"
          title="Jump to work"
        >
          {quickActions.length === 0 ? (
            <EmptyState
              description="No quick actions are available for the current company role set."
              title="No shortcuts available"
            />
          ) : (
            <div className="grid gap-4">
              {quickActions.map((action) => (
                <DashboardQuickActionTile
                  description={action.description}
                  href={action.href}
                  icon={action.icon}
                  key={action.id}
                  title={action.title}
                />
              ))}
            </div>
          )}
        </DashboardSection>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <p className="text-xs font-semibold text-primary">
              Session context
            </p>
            <CardTitle>Active roles</CardTitle>
            <CardDescription>
              The dashboard remains company-aware and keeps the active role set
              visible in the landing experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {getRoleLabels(user.roles).map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
              Other company memberships remain available in the shell session
              menu. Prompt 21 keeps the operational home anchored to the active
              login company.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs font-semibold text-primary">
              Company memberships
            </p>
            <CardTitle>Available company scopes</CardTitle>
            <CardDescription>
              Multi-company assignments remain visible from the operational home
              without changing the existing auth/session model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.assignments.length === 0 ? (
              <EmptyState
                description="No company assignments are attached to this identity."
                title="No assignments found"
              />
            ) : (
              user.assignments.map((assignment) => (
                <div
                  className="rounded-3xl border border-border/70 bg-background/80 p-4"
                  key={assignment.company.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {assignment.company.name}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                        {assignment.company.slug}
                      </p>
                    </div>
                    {assignment.company.id === user.currentCompany.id ? (
                      <Badge variant="success">Active session</Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getRoleLabels(assignment.roles).map((role) => (
                      <Badge key={`${assignment.company.id}-${role}`} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </AppPage>
  );
};
