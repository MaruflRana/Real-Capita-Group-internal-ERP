'use client';

import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@real-capita/ui';

import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { formatAccountingAmount } from '../../lib/format';

export const FinancialReportingPageHeader = ({
  title,
  description,
  scopeName,
  scopeSlug,
}: {
  title: string;
  description: string;
  scopeName?: string;
  scopeSlug?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-col gap-4 border-b border-border/70 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          Financial Reports
        </p>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6">
            {description}
          </CardDescription>
        </div>
        {scopeName ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{scopeName}</Badge>
            {scopeSlug ? <Badge variant="outline">{scopeSlug}</Badge> : null}
          </div>
        ) : null}
      </div>
    </CardHeader>
  </Card>
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
  <Card>
    <CardHeader className="border-b border-border/70">
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-4xl leading-6">
          {description}
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="space-y-5 pt-6">{children}</CardContent>
  </Card>
);

export const FinancialReportingFilterCard = ({
  children,
}: {
  children: ReactNode;
}) => (
  <Card>
    <CardContent className="space-y-4 pt-6">{children}</CardContent>
  </Card>
);

export const FinancialReportingQueryErrorBanner = ({
  message,
}: {
  message: string;
}) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
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
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
    <p className="font-semibold">{title}</p>
    <p className="mt-1">{description}</p>
  </div>
);

export const FinancialReportingAccessRequiredState = () => (
  <EmptyState
    title="Accounting access required"
    description="The active session does not currently include company_admin or company_accountant access in this company scope."
  />
);

export const ReportLoadingState = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
    {label}
  </div>
);

export const ReportRefreshHint = ({ isFetching }: { isFetching: boolean }) =>
  isFetching ? (
    <div className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
      Refreshing the report with the current filters.
    </div>
  ) : null;

export const ReportMetricGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
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
  <div
    className={[
      'rounded-3xl border px-4 py-4',
      tone === 'success'
        ? 'border-emerald-200 bg-emerald-50'
        : tone === 'warning'
          ? 'border-amber-200 bg-amber-50'
          : 'border-border/70 bg-muted/20',
    ].join(' ')}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
      {label}
    </p>
    <div className="mt-3 text-lg font-semibold text-foreground">{value}</div>
    {description ? (
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    ) : null}
  </div>
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
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {debitLabel}
      </p>
      <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
        {formatAccountingAmount(debit)}
      </p>
    </div>
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {items.map((item) => (
      <div
        className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
        key={item.label}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {item.label}
        </p>
        <div className="mt-2 text-sm text-foreground">{item.value}</div>
      </div>
    ))}
  </div>
);

export const BalanceStatusBanner = ({
  isBalanced,
}: {
  isBalanced: boolean;
}) => (
  <div
    className={[
      'rounded-2xl px-4 py-3 text-sm',
      isBalanced
        ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border border-rose-200 bg-rose-50 text-rose-900',
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
