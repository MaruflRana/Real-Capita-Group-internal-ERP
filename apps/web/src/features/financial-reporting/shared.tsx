'use client';

import type { ReactNode } from 'react';

import { Card, CardContent } from '@real-capita/ui';

import { EmptyState } from '../../components/ui/empty-state';
import {
  DataSourceNote,
  KpiCard,
  ModulePageHeader,
  ReportSection,
  ReportGrid,
  StatusChip,
} from '../../components/ui/erp-primitives';
import { formatAccountingAmount } from '../../lib/format';

export const FinancialReportingPageHeader = ({
  title,
  description,
  scopeName,
  scopeSlug,
  actions,
}: {
  title: string;
  description: string;
  scopeName?: string;
  scopeSlug?: string;
  actions?: ReactNode;
}) => (
  <ModulePageHeader
    actions={actions}
    description={description}
    eyebrow="Financial Reports"
    scopeName={scopeName}
    scopeSlug={scopeSlug}
    title={title}
  />
);

export const FinancialReportingSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <ReportSection description={description} title={title}>
    {children}
  </ReportSection>
);

export const FinancialReportingFilterCard = ({
  children,
}: {
  children: ReactNode;
}) => (
  <Card>
    <CardContent className="space-y-4 pt-5 sm:pt-6">{children}</CardContent>
  </Card>
);

export const FinancialReportingQueryErrorBanner = ({
  message,
}: {
  message: string;
}) => (
  <div className="rounded-lg border border-status-danger/25 bg-status-dangerSoft px-4 py-3 text-sm font-medium text-status-danger">
    {message}
  </div>
);

export const FinancialReportingReadOnlyNotice = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-lg border border-status-warning/30 bg-status-warningSoft px-4 py-3 text-sm text-status-warning">
    <p className="font-semibold">{title}</p>
    <p className="mt-1">{description}</p>
  </div>
);

export const FinancialReportContextStrip = ({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    tone?: 'default' | 'info' | 'success' | 'warning' | 'danger';
  }>;
}) => (
  <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
    {items.map((item) => (
      <div
        className="min-w-0 rounded-lg border border-border bg-surface-raised px-3.5 py-3"
        key={item.label}
      >
        <p className="erp-label">{item.label}</p>
        <div className="mt-2 min-w-0 text-sm font-semibold leading-6 text-foreground">
          {item.tone ? (
            <StatusChip tone={item.tone}>{item.value}</StatusChip>
          ) : (
            item.value
          )}
        </div>
      </div>
    ))}
  </div>
);

export const FinancialReportingAccessRequiredState = () => (
  <EmptyState
    title="Accounting access required"
    description="The active session does not currently include company_admin or company_accountant access in this company scope."
  />
);

export const ReportLoadingState = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-border bg-surface-muted px-4 py-8 text-sm text-muted-foreground">
    {label}
  </div>
);

export const ReportRefreshHint = ({ isFetching }: { isFetching: boolean }) =>
  isFetching ? (
    <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
      Refreshing the report with the current filters.
    </div>
  ) : null;

export const ReportMetricGrid = ({ children }: { children: ReactNode }) => (
  <ReportGrid>{children}</ReportGrid>
);

export const ReportMetricCard = ({
  label,
  value,
  description,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  description?: string;
  tone?: 'default' | 'success' | 'warning';
}) => (
  <KpiCard
    helper={description}
    label={label}
    tone={
      tone === 'success'
        ? 'success'
        : tone === 'warning'
          ? 'warning'
          : 'default'
    }
    value={value}
  />
);

export const ReportAmountPair = ({
  debit,
  credit,
  debitLabel = 'Debit',
  creditLabel = 'Credit',
}: {
  debit: string;
  credit: string;
  debitLabel?: string;
  creditLabel?: string;
}) => (
  <div className="grid grid-cols-2 gap-3">
    <div>
      <p className="text-sm font-semibold text-muted-foreground">
        {debitLabel}
      </p>
      <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
        {formatAccountingAmount(debit)}
      </p>
    </div>
    <div>
      <p className="text-sm font-semibold text-muted-foreground">
        {creditLabel}
      </p>
      <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
        {formatAccountingAmount(credit)}
      </p>
    </div>
  </div>
);

export const ReportValueList = ({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
}) => (
  <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
    {items.map((item) => (
      <div
        className="min-w-0 rounded-lg border border-border bg-surface-muted px-4 py-3"
        key={item.label}
      >
        <p className="text-sm font-semibold leading-5 text-muted-foreground">
          {item.label}
        </p>
        <div className="mt-2 break-words text-sm text-foreground [overflow-wrap:anywhere]">
          {item.value}
        </div>
      </div>
    ))}
  </div>
);

export const FinancialReportingPrintContext = ({
  items,
  title,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
  title: string;
}) => (
  <div className="print-only rounded-lg border border-border bg-background px-4 py-4">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-semibold text-muted-foreground">
            {item.label}
          </p>
          <div className="mt-1 text-sm text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  </div>
);

export const BalanceStatusBanner = ({
  isBalanced,
}: {
  isBalanced: boolean;
}) => (
  <div
    className={[
      'rounded-lg px-4 py-3 text-sm',
      isBalanced
        ? 'border border-status-success/25 bg-status-successSoft text-status-success'
        : 'border border-status-danger/25 bg-status-dangerSoft text-status-danger',
    ].join(' ')}
  >
    <p className="font-semibold">
      {isBalanced
        ? 'Balance sheet is balanced.'
        : 'Balance sheet is not balanced.'}
    </p>
    <p className="mt-1">
      {isBalanced
        ? 'Assets equal liabilities plus equity for the selected as-of date.'
        : 'The backend reported an imbalance for the selected as-of date. Treat the statement as diagnostic until that issue is resolved.'}
    </p>
  </div>
);

export const ReportAssumptionNote = ({ children }: { children: ReactNode }) => (
  <DataSourceNote className="rounded-lg border border-border bg-surface-muted px-4 py-3">
    {children}
  </DataSourceNote>
);
