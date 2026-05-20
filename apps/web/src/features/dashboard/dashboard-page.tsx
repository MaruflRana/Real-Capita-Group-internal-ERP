'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  Card,
  CardContent,
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

  const executiveKpis = useMemo(() => {
    const summary = summaryQuery.data;

    if (!summary) {
      return [];
    }

    const kpis: Array<{
      label: string;
      value: string;
      hint: string;
      tone?: 'success' | 'warning' | 'neutral';
    }> = [];

    if (summary.financial && access.financialReports) {
      const netProfitLossNum = Number(summary.financial.netProfitLoss);
      kpis.push({
        label: 'Net profit / loss',
        value: formatAccountingAmount(summary.financial.netProfitLoss),
        hint: netProfitLossNum >= 0 ? 'Profit' : 'Loss',
        tone: netProfitLossNum >= 0 ? 'success' : 'warning',
      });
      kpis.push({
        label: 'Total assets',
        value: formatAccountingAmount(summary.financial.totalAssets),
        hint: 'Balance sheet total.',
      });
    }

    if (summary.accounting && access.accounting) {
      kpis.push({
        label: 'Draft vouchers',
        value: String(summary.accounting.draftVoucherCount),
        hint: 'Awaiting posting.',
      });
      kpis.push({
        label: 'Posted vouchers',
        value: String(summary.accounting.postedVoucherCount),
        hint: 'Currently available for review.',
      });
    }

    if (summary.property && access.projectProperty) {
      kpis.push({
        label: 'Available units',
        value: String(summary.property.availableUnitCount),
        hint: 'Ready for booking.',
      });
    }

    if (summary.crm && access.crm) {
      kpis.push({
        label: 'Active bookings',
        value: String(summary.crm.activeBookingCount),
        hint: 'Operating in BOOKED state.',
      });
    }

    if (summary.people) {
      if (summary.people.pendingLeaveRequestCount !== undefined && access.hr) {
        kpis.push({
          label: 'Pending leave requests',
          value: String(summary.people.pendingLeaveRequestCount),
          hint: 'Awaiting HR action.',
        });
      }
      if (summary.people.openPayrollRunCount !== undefined && access.payroll) {
        kpis.push({
          label: 'Open payroll runs',
          value: String(summary.people.openPayrollRunCount),
          hint: 'Draft and finalized runs needing follow-up.',
        });
      }
    }

    return kpis;
  }, [
    access.accounting,
    access.crm,
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
      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <Card
          className="min-w-0 overflow-hidden border-brand-sky/40"
          data-testid="dashboard-context"
        >
          <CardHeader className="border-b border-brand-sky/40 bg-gradient-to-br from-brand-headerGradientStart via-card to-brand-headerGradientEnd/70">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Operational home
                </p>
                <CardTitle className="mt-1 text-2xl leading-8">
                  {user.currentCompany.name}
                </CardTitle>
              </div>
              <div className="hidden sm:flex items-center gap-2 ml-auto shrink-0">
                <Badge className="px-3 py-1.5 text-[11px] font-mono" variant="outline">
                  {user.currentCompany.slug}
                </Badge>
                <div className="flex flex-wrap gap-1.5">
                  {getRoleLabels(user.roles).map((role) => (
                    <Badge key={role} variant="outline" className="text-[11px]">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(160px,0.5fr)_minmax(160px,0.5fr)]">
              <div
                className="min-w-0 rounded-lg border border-brand-green/40 bg-gradient-to-br from-card to-brand-greenSoft/90 p-3"
                data-testid="dashboard-period-card"
              >
                <label
                  className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground"
                  htmlFor="dashboard-period"
                >
                  Reporting period
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-foreground"
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
                <p className="mt-2 text-xs text-muted-foreground">
                  KPIs follow <span className="font-medium text-foreground">{period.label}</span>. Recent activity always shows latest records.
                </p>
              </div>

              <div className="min-w-0 rounded-lg border border-brand-sky/40 bg-brand-skySoft/85 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
                  Last login
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatDateTime(user.lastLoginAt)}
                </p>
              </div>

              <div className="min-w-0 rounded-lg border border-brand-sky/40 bg-brand-skySoft/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
                  Workspaces
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {workspaceLabels.length} modules available
                </p>
              </div>
            </div>

            <div className="flex sm:hidden flex-wrap gap-2">
              {getRoleLabels(user.roles).map((role) => (
                <Badge key={role} variant="outline" className="text-[11px]">
                  {role}
                </Badge>
              ))}
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
        description="Core executive indicators derived from the active company and reporting window."
        eyebrow="Summary"
        title="Executive KPIs"
      >
        <DashboardIssueBanner issues={summaryQuery.data?.issues ?? []} />

        {summaryQuery.isPending ? (
          <DashboardLoadingGrid count={4} />
        ) : executiveKpis.length === 0 ? (
          <EmptyState
            description="No dashboard KPIs are available for the current role set in this company."
            title="No accessible KPIs"
          />
        ) : (
          <div className="space-y-4">
            {(() => {
              const financialKpis = executiveKpis.filter((kpi) =>
                kpi.label === 'Net profit / loss' || kpi.label === 'Total assets',
              );
              const operationalKpis = executiveKpis.filter((kpi) =>
                kpi.label !== 'Net profit / loss' && kpi.label !== 'Total assets',
              );
              const netPlKpi = financialKpis.find((kpi) => kpi.label === 'Net profit / loss');
              const assetsKpi = financialKpis.find((kpi) => kpi.label === 'Total assets');

              return (
                <>
                  {financialKpis.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
                      {netPlKpi ? (
                        <div
                          className={`rounded-xl border-2 p-5 shadow-sm ${
                            netPlKpi.tone === 'success'
                              ? 'border-emerald-300/70 bg-gradient-to-br from-emerald-50/40 to-brand-skySoft/30'
                              : netPlKpi.tone === 'warning'
                                ? 'border-rose-300/70 bg-gradient-to-br from-rose-50/40 to-brand-skySoft/30'
                                : 'border-brand-sky/50 bg-gradient-to-br from-brand-skySoft/60 to-card'
                          }`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Net profit / loss
                          </p>
                          <p className={`mt-3 text-2xl font-bold tabular-nums ${
                            netPlKpi.tone === 'success'
                              ? 'text-emerald-700'
                              : netPlKpi.tone === 'warning'
                                ? 'text-rose-700'
                                : 'text-foreground'
                          }`}>
                            {netPlKpi.value}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              netPlKpi.tone === 'success'
                                ? 'bg-emerald-100/80 text-emerald-700'
                                : netPlKpi.tone === 'warning'
                                  ? 'bg-rose-100/80 text-rose-700'
                                  : 'bg-brand-skySoft text-brand-navy'
                            }`}>
                              {netPlKpi.hint}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              for {period.label}
                            </span>
                          </div>
                        </div>
                      ) : null}
                      {assetsKpi ? (
                        <div className="rounded-xl border border-brand-sky/40 bg-brand-skySoft/50 p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Total assets
                          </p>
                          <p className="mt-3 text-xl font-bold tabular-nums text-foreground">
                            {assetsKpi.value}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">{assetsKpi.hint}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {operationalKpis.length > 0 ? (
                    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
                      {operationalKpis.map((kpi) => (
                        <div
                          className={`rounded-lg border p-3.5 ${
                            kpi.tone === 'success'
                              ? 'border-emerald-200/60 bg-emerald-50/30'
                              : kpi.tone === 'warning'
                                ? 'border-rose-200/60 bg-rose-50/30'
                                : 'border-brand-sky/35 bg-brand-skySoft/40'
                          }`}
                          key={kpi.label}
                        >
                          <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                          <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">{kpi.value}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              );
            })()}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        description="Latest operational records across accessible modules."
        eyebrow="Activity"
        title="Recent records"
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

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardSection
          description="Work queues and items that still need follow-up."
          eyebrow="Attention"
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
          description="Direct links into accessible workspaces."
          eyebrow="Navigation"
          title="Quick actions"
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
    </AppPage>
  );
};
