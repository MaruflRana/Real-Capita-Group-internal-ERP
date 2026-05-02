'use client';

import type { ReactNode } from 'react';

import { cn } from '@real-capita/ui';

import {
  AnalyticsGrid as ErpAnalyticsGrid,
  ChartCardShell,
  EmptyStateBlock,
  MetricCard,
  TableShell,
} from '../../components/ui/erp-primitives';
import { formatAccountingAmount, formatDate } from '../../lib/format';
import type {
  AnalyticsDataPoint,
  AnalyticsIssue,
  AnalyticsSampleMeta,
  AnalyticsTrendPoint,
} from '../../lib/api/analytics';

export type AnalyticsValueFormat =
  | 'number'
  | 'currency'
  | 'compactCurrency'
  | 'percent';
type AnalyticsGridColumns = 'two' | 'three';
export type ChartTone =
  | 'revenue'
  | 'positive'
  | 'expense'
  | 'negative'
  | 'neutral'
  | 'balance'
  | 'warning'
  | 'pending'
  | 'sales'
  | 'property'
  | 'hr'
  | 'payroll'
  | 'audit'
  | 'documents';

type ChartSeries = {
  key: string;
  label: string;
  tone?: ChartTone;
  marker?: string;
};

type ChartLegendItem = {
  key: string;
  label: string;
  value?: number | string | ReactNode;
  tone?: ChartTone;
  marker?: string;
};

const DEFAULT_TONES: ChartTone[] = [
  'revenue',
  'expense',
  'balance',
  'sales',
  'property',
  'payroll',
  'warning',
  'audit',
  'documents',
  'neutral',
];

const CHART_TONE_STYLES: Record<
  ChartTone,
  {
    bar: string;
    border: string;
    soft: string;
    text: string;
    marker: string;
    primitiveTone: 'default' | 'info' | 'success' | 'warning' | 'danger';
  }
> = {
  revenue: {
    bar: 'bg-chart-revenue',
    border: 'border-chart-revenue/25',
    soft: 'bg-status-successSoft',
    text: 'text-status-success',
    marker: 'R',
    primitiveTone: 'success',
  },
  positive: {
    bar: 'bg-chart-revenue',
    border: 'border-chart-revenue/25',
    soft: 'bg-status-successSoft',
    text: 'text-status-success',
    marker: '+',
    primitiveTone: 'success',
  },
  expense: {
    bar: 'bg-chart-expense',
    border: 'border-chart-expense/25',
    soft: 'bg-status-dangerSoft',
    text: 'text-status-danger',
    marker: 'E',
    primitiveTone: 'danger',
  },
  negative: {
    bar: 'bg-chart-expense',
    border: 'border-chart-expense/25',
    soft: 'bg-status-dangerSoft',
    text: 'text-status-danger',
    marker: '-',
    primitiveTone: 'danger',
  },
  neutral: {
    bar: 'bg-chart-slate',
    border: 'border-chart-slate/25',
    soft: 'bg-surface-muted',
    text: 'text-muted-foreground',
    marker: 'N',
    primitiveTone: 'default',
  },
  balance: {
    bar: 'bg-chart-balance',
    border: 'border-chart-balance/25',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
    marker: 'B',
    primitiveTone: 'info',
  },
  warning: {
    bar: 'bg-chart-warning',
    border: 'border-chart-warning/30',
    soft: 'bg-status-warningSoft',
    text: 'text-status-warning',
    marker: 'W',
    primitiveTone: 'warning',
  },
  pending: {
    bar: 'bg-chart-warning',
    border: 'border-chart-warning/30',
    soft: 'bg-status-warningSoft',
    text: 'text-status-warning',
    marker: 'P',
    primitiveTone: 'warning',
  },
  sales: {
    bar: 'bg-chart-sales',
    border: 'border-chart-sales/25',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
    marker: 'S',
    primitiveTone: 'info',
  },
  property: {
    bar: 'bg-chart-property',
    border: 'border-chart-property/25',
    soft: 'bg-surface-muted',
    text: 'text-foreground',
    marker: 'U',
    primitiveTone: 'default',
  },
  hr: {
    bar: 'bg-chart-hr',
    border: 'border-chart-hr/25',
    soft: 'bg-surface-muted',
    text: 'text-foreground',
    marker: 'H',
    primitiveTone: 'default',
  },
  payroll: {
    bar: 'bg-chart-payroll',
    border: 'border-chart-payroll/25',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
    marker: 'P',
    primitiveTone: 'info',
  },
  audit: {
    bar: 'bg-chart-audit',
    border: 'border-chart-audit/25',
    soft: 'bg-surface-muted',
    text: 'text-foreground',
    marker: 'A',
    primitiveTone: 'default',
  },
  documents: {
    bar: 'bg-chart-documents',
    border: 'border-chart-documents/25',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
    marker: 'D',
    primitiveTone: 'info',
  },
};

const numberFormatter = new Intl.NumberFormat('en-US');
const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  notation: 'compact',
});
const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  style: 'percent',
});

const toFiniteNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const amount = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(amount) ? amount : 0;
};

const getToneStyle = (tone: ChartTone) => CHART_TONE_STYLES[tone];

const getDefaultTone = (index: number): ChartTone =>
  DEFAULT_TONES[index % DEFAULT_TONES.length] ?? 'neutral';

const inferChartTone = (
  key: string,
  label: string,
  index: number,
): ChartTone => {
  const value = `${key} ${label}`.toLowerCase();

  if (
    value.includes('expense') ||
    value.includes('deduction') ||
    value.includes('loss')
  ) {
    return 'expense';
  }

  if (
    value.includes('revenue') ||
    value.includes('profit') ||
    value.includes('posted')
  ) {
    return 'revenue';
  }

  if (
    value.includes('contract') ||
    value.includes('collection') ||
    value.includes('sale') ||
    value.includes('booking') ||
    value.includes('lead') ||
    value.includes('customer')
  ) {
    return 'sales';
  }

  if (
    value.includes('unit') ||
    value.includes('project') ||
    value.includes('available') ||
    value.includes('booked') ||
    value.includes('sold')
  ) {
    return 'property';
  }

  if (
    value.includes('employee') ||
    value.includes('attendance') ||
    value.includes('leave') ||
    value === 'in in' ||
    value === 'out out'
  ) {
    return 'hr';
  }

  if (
    value.includes('payroll') ||
    value.includes('gross') ||
    value.includes('net')
  ) {
    return 'payroll';
  }

  if (
    value.includes('pending') ||
    value.includes('draft') ||
    value.includes('unknown') ||
    value.includes('submitted')
  ) {
    return 'warning';
  }

  if (value.includes('attachment') || value.includes('document')) {
    return 'documents';
  }

  if (value.includes('audit') || value.includes('event')) {
    return 'audit';
  }

  if (
    value.includes('debit') ||
    value.includes('credit') ||
    value.includes('asset') ||
    value.includes('liabilit') ||
    value.includes('equity') ||
    value.includes('balance')
  ) {
    return 'balance';
  }

  return getDefaultTone(index);
};

const decorateSeries = (series: ChartSeries[]) =>
  series.map((item, index) => {
    const tone = item.tone ?? inferChartTone(item.key, item.label, index);
    const style = getToneStyle(tone);

    return {
      ...item,
      marker: item.marker ?? style.marker,
      tone,
      style,
    };
  });

const formatNodeValue = (
  value: ChartLegendItem['value'],
  format: AnalyticsValueFormat,
) => {
  if (typeof value === 'number') {
    return formatAnalyticsValue(value, format);
  }

  return value;
};

const buildLabel = (label: string) => formatTechnicalLabel(label);

const getPositiveItems = (data: AnalyticsDataPoint[]) =>
  data.filter((item) => Math.abs(toFiniteNumber(item.value)) > 0);

const getSeriesTotals = (data: AnalyticsTrendPoint[], series: ChartSeries[]) =>
  series.map((item) =>
    data.reduce(
      (sum, point) => sum + toFiniteNumber(point.values[item.key]),
      0,
    ),
  );

export const formatCount = (value: number | string | null | undefined) =>
  numberFormatter.format(toFiniteNumber(value));

export const formatCompactCurrency = (
  value: number | string | null | undefined,
) => compactNumberFormatter.format(toFiniteNumber(value));

export const formatPercentValue = (value: number | string | null | undefined) =>
  percentFormatter.format(toFiniteNumber(value));

export const formatTechnicalLabel = (
  value: string | null | undefined,
  emptyLabel = 'Unspecified',
) => {
  if (!value) {
    return emptyLabel;
  }

  const trimmed = value.trim();

  if (trimmed === 'UNCLOSED_EARNINGS') {
    return 'Unclosed earnings adjustment';
  }

  const hasTechnicalSeparator =
    trimmed.includes('_') || trimmed.includes('.') || trimmed.includes('-');

  if (!hasTechnicalSeparator && trimmed !== trimmed.toUpperCase()) {
    return trimmed;
  }

  if (/^[A-Z0-9&/+.-]{1,4}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .replace(/[._-]/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
};

export const formatDateBucketLabel = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return 'N/A';
  }

  if (value.includes(' to ')) {
    return value
      .split(' to ')
      .map((part) => formatDateBucketLabel(part))
      .join(' to ');
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}-01T00:00:00`));
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDate(value);
  }

  return value;
};

export const formatAnalyticsValue = (
  value: number,
  format: AnalyticsValueFormat = 'number',
) => {
  if (format === 'currency') {
    return formatAccountingAmount(value);
  }

  if (format === 'compactCurrency') {
    return formatCompactCurrency(value);
  }

  if (format === 'percent') {
    return formatPercentValue(value);
  }

  return formatCount(value);
};

export const formatAnalyticsFullValue = (
  value: number,
  format: AnalyticsValueFormat = 'number',
) => {
  if (format === 'compactCurrency') {
    return formatAccountingAmount(value);
  }

  return formatAnalyticsValue(value, format);
};

export const AnalyticsCard = ({
  title,
  description,
  insight,
  metaLabel,
  children,
  footer,
}: {
  title: string;
  description?: string;
  insight?: ReactNode;
  metaLabel?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) => (
  <ChartCardShell
    description={description}
    footer={footer}
    insight={insight}
    metaLabel={metaLabel}
    title={title}
  >
    {children}
  </ChartCardShell>
);

export const AnalyticsGrid = ({
  children,
  columns = 'two',
}: {
  children: ReactNode;
  columns?: AnalyticsGridColumns;
}) => (
  <ErpAnalyticsGrid
    className={cn(
      columns === 'three'
        ? '[grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))]'
        : '[grid-template-columns:repeat(auto-fit,minmax(min(100%,30rem),1fr))]',
    )}
  >
    {children}
  </ErpAnalyticsGrid>
);

export const ChartLoadingState = ({ label }: { label: string }) => (
  <div className="min-h-44 rounded-lg border border-border bg-surface-muted px-4 py-5">
    <p className="text-sm font-semibold text-foreground">Loading analytics</p>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{label}</p>
    <div className="mt-5 grid h-24 grid-cols-6 items-end gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="animate-pulse rounded-t-sm bg-border"
          key={`chart-loading-${index}`}
          style={{ height: `${34 + index * 8}%` }}
        />
      ))}
    </div>
  </div>
);

export const ChartEmptyState = ({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) => (
  <EmptyStateBlock
    className={cn('min-h-40', className)}
    description={description}
    title={title}
  />
);

export const ChartErrorState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <EmptyStateBlock
    className="min-h-40 border-status-danger/30 bg-status-dangerSoft"
    description={description}
    title={title}
  />
);

export const AnalyticsLoadingState = ({ label }: { label: string }) => (
  <ChartLoadingState label={label} />
);

export const AnalyticsEmptyState = ({
  title,
  description,
  showDemoHint = false,
}: {
  title: string;
  description: string;
  showDemoHint?: boolean;
}) => {
  const resolvedDescription = showDemoHint
    ? `${description} For a populated supervisor demo, run corepack pnpm seed:demo and then corepack pnpm seed:demo:verify.`
    : description;

  return <ChartEmptyState description={resolvedDescription} title={title} />;
};

export const AnalyticsIssueBanner = ({
  issues,
}: {
  issues: AnalyticsIssue[];
}) => {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-status-warning/30 bg-status-warningSoft px-4 py-3 text-sm leading-6 text-status-warning">
      <p className="font-semibold">Some analytics data could not load.</p>
      <div className="mt-2 space-y-1">
        {issues.map((issue) => (
          <p key={issue.id}>
            <span className="font-medium">{issue.title}</span> {issue.message}
          </p>
        ))}
      </div>
    </div>
  );
};

export const ChartLegend = ({
  items,
  format = 'number',
  className,
}: {
  items: ChartLegendItem[];
  format?: AnalyticsValueFormat;
  className?: string;
}) => (
  <div
    className={cn(
      'grid min-w-0 gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr))]',
      className,
    )}
  >
    {items.map((item, index) => {
      const tone = item.tone ?? inferChartTone(item.key, item.label, index);
      const style = getToneStyle(tone);
      const value = formatNodeValue(item.value, format);

      return (
        <div
          aria-label={`${buildLabel(item.label)}${value ? ` ${value}` : ''}`}
          className="flex min-w-0 flex-col items-start gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          key={item.key}
          title={buildLabel(item.label)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold leading-none text-white',
                style.bar,
              )}
            >
              {item.marker ?? style.marker}
            </span>
            <span className="min-w-0 font-medium leading-5 text-foreground">
              {buildLabel(item.label)}
            </span>
          </span>
          {value ? (
            <span className="pl-7 font-mono text-xs tabular-nums text-muted-foreground">
              {value}
            </span>
          ) : null}
        </div>
      );
    })}
  </div>
);

export const MetricCardGrid = ({
  items,
  format = 'number',
}: {
  items: AnalyticsDataPoint[];
  format?: AnalyticsValueFormat;
}) => (
  <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
    {items.map((item, index) => {
      const tone = inferChartTone(item.key, item.label, index);
      const style = getToneStyle(tone);

      return (
        <MetricCard
          className={cn(style.border, style.soft)}
          key={item.key}
          label={buildLabel(item.label)}
          tone={style.primitiveTone}
          value={
            <span
              className={cn(
                format === 'currency' || format === 'compactCurrency'
                  ? 'font-mono text-lg sm:text-xl'
                  : 'text-2xl',
              )}
            >
              {formatAnalyticsValue(item.value, format)}
            </span>
          }
        />
      );
    })}
  </div>
);

export const ComparisonBarChart = ({
  data,
  emptyTitle,
  emptyDescription,
  format = 'number',
  maxItems,
}: {
  data: AnalyticsDataPoint[];
  emptyTitle: string;
  emptyDescription: string;
  format?: AnalyticsValueFormat;
  maxItems?: number;
}) => {
  const visible = getPositiveItems(data).slice(0, maxItems);
  const maxValue = visible.reduce(
    (max, item) => Math.max(max, Math.abs(item.value)),
    0,
  );
  const total = visible.reduce((sum, item) => sum + Math.abs(item.value), 0);

  if (visible.length === 0 || total <= 0 || maxValue <= 0) {
    return (
      <AnalyticsEmptyState description={emptyDescription} title={emptyTitle} />
    );
  }

  return (
    <div
      aria-label={visible
        .map(
          (item) =>
            `${buildLabel(item.label)} ${formatAnalyticsFullValue(item.value, format)}`,
        )
        .join(', ')}
      className="min-w-0 space-y-3"
      role="img"
    >
      {visible.map((item, index) => {
        const tone = inferChartTone(item.key, item.label, index);
        const style = getToneStyle(tone);
        const percentOfMax =
          maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0;
        const percentOfTotal = total > 0 ? Math.abs(item.value) / total : 0;
        const displayLabel = buildLabel(item.label);
        const displayValue = formatAnalyticsFullValue(item.value, format);

        return (
          <div
            className="min-w-0 rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
            key={item.key}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold leading-none text-white',
                    style.bar,
                  )}
                >
                  {style.marker}
                </span>
                <span
                  aria-label={displayLabel}
                  className="truncate text-sm font-semibold leading-5 text-foreground"
                  title={displayLabel}
                >
                  {displayLabel}
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-right font-mono text-sm tabular-nums text-foreground">
                {displayValue}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_3.25rem] items-center gap-3">
              <div
                aria-hidden="true"
                className="h-3 overflow-hidden rounded-full bg-surface-muted"
              >
                <div
                  className={cn('h-full rounded-full', style.bar)}
                  style={{ width: `${Math.max(percentOfMax, 2)}%` }}
                />
              </div>
              <span className="whitespace-nowrap text-right font-mono text-xs tabular-nums text-muted-foreground">
                {formatPercentValue(percentOfTotal)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DistributionChart = ({
  data,
  emptyTitle,
  emptyDescription,
  format = 'number',
  maxItems,
}: {
  data: AnalyticsDataPoint[];
  emptyTitle: string;
  emptyDescription: string;
  format?: AnalyticsValueFormat;
  maxItems?: number;
}) => {
  const visible = getPositiveItems(data).slice(0, maxItems);
  const total = visible.reduce((sum, item) => sum + Math.abs(item.value), 0);

  if (visible.length === 0 || total <= 0) {
    return (
      <AnalyticsEmptyState description={emptyDescription} title={emptyTitle} />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <div
        aria-label={visible
          .map(
            (item) =>
              `${buildLabel(item.label)} ${formatAnalyticsFullValue(item.value, format)}`,
          )
          .join(', ')}
        className="rounded-lg border border-border bg-surface-raised px-3 py-3"
        role="img"
      >
        <div className="flex h-8 overflow-hidden rounded-md bg-surface-muted">
          {visible.map((item, index) => {
            const tone = inferChartTone(item.key, item.label, index);
            const style = getToneStyle(tone);
            const width = total > 0 ? (Math.abs(item.value) / total) * 100 : 0;
            const label = buildLabel(item.label);

            return (
              <div
                className={cn('min-w-2 border-r border-white/40', style.bar)}
                key={item.key}
                style={{ width: `${Math.max(width, 2)}%` }}
                title={`${label}: ${formatAnalyticsFullValue(item.value, format)} (${formatPercentValue(width / 100)})`}
              />
            );
          })}
        </div>
      </div>

      <ChartLegend
        format={format}
        items={visible.map((item, index) => {
          const tone = inferChartTone(item.key, item.label, index);
          const style = getToneStyle(tone);

          return {
            key: item.key,
            label: item.label,
            marker: style.marker,
            tone,
            value: item.value,
          };
        })}
      />

      <ComparisonBarChart
        data={visible}
        emptyDescription={emptyDescription}
        emptyTitle={emptyTitle}
        format={format}
      />
    </div>
  );
};

export const DistributionBarList = ({
  data,
  emptyTitle,
  emptyDescription,
  format = 'number',
}: {
  data: AnalyticsDataPoint[];
  emptyTitle: string;
  emptyDescription: string;
  format?: AnalyticsValueFormat;
}) => (
  <DistributionChart
    data={data}
    emptyDescription={emptyDescription}
    emptyTitle={emptyTitle}
    format={format}
  />
);

export const TrendBarChart = ({
  data,
  series,
  emptyTitle,
  emptyDescription,
  format = 'number',
}: {
  data: AnalyticsTrendPoint[];
  series: ChartSeries[];
  emptyTitle: string;
  emptyDescription: string;
  format?: AnalyticsValueFormat;
}) => {
  const decoratedSeries = decorateSeries(series);
  const firstValueIndex = data.findIndex((point) =>
    decoratedSeries.some(
      (item) => Math.abs(toFiniteNumber(point.values[item.key])) > 0,
    ),
  );
  let lastValueIndex = -1;

  for (let index = data.length - 1; index >= 0; index -= 1) {
    const point = data[index];

    if (
      point &&
      decoratedSeries.some(
        (item) => Math.abs(toFiniteNumber(point.values[item.key])) > 0,
      )
    ) {
      lastValueIndex = index;
      break;
    }
  }
  const chartData =
    firstValueIndex >= 0 && lastValueIndex >= firstValueIndex
      ? data.slice(
          Math.max(0, firstValueIndex - 1),
          Math.min(data.length, lastValueIndex + 2),
        )
      : data;
  const maxValue = chartData.reduce(
    (max, point) =>
      Math.max(
        max,
        ...decoratedSeries.map((item) =>
          Math.abs(toFiniteNumber(point.values[item.key])),
        ),
      ),
    0,
  );

  if (chartData.length === 0 || maxValue <= 0) {
    return (
      <AnalyticsEmptyState description={emptyDescription} title={emptyTitle} />
    );
  }

  const totals = getSeriesTotals(data, decoratedSeries);
  const requiresScroll = chartData.length > 6 || decoratedSeries.length > 3;
  const compactFormat = format === 'currency' ? 'compactCurrency' : format;

  return (
    <div
      aria-label={decoratedSeries
        .map(
          (item, index) =>
            `${item.label} total ${formatAnalyticsFullValue(totals[index] ?? 0, format)}`,
        )
        .join(', ')}
      className="min-w-0 max-w-full space-y-4"
      role="img"
    >
      <div className="max-w-full rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-raised px-4 py-3 text-xs font-semibold text-muted-foreground">
          <span>Trend scale</span>
          <span className="whitespace-nowrap font-mono tabular-nums">
            Max {formatAnalyticsValue(maxValue, compactFormat)}
          </span>
        </div>
        <div className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-3 px-3 py-4 sm:px-4">
          <div className="flex h-48 flex-col justify-between pr-1 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
            <span>{formatAnalyticsValue(maxValue, compactFormat)}</span>
            <span>{formatAnalyticsValue(maxValue / 2, compactFormat)}</span>
            <span>0</span>
          </div>
          <div className={cn('min-w-0', requiresScroll && 'overflow-x-auto')}>
            <div
              className={cn(
                'flex h-full min-h-56 gap-4',
                requiresScroll ? 'min-w-max' : 'min-w-0',
              )}
            >
              {chartData.map((point) => {
                const label = formatDateBucketLabel(point.label);

                return (
                  <div
                    className={cn(
                      'flex min-w-0 flex-1 flex-col justify-end',
                      requiresScroll && 'min-w-24',
                    )}
                    key={point.key}
                  >
                    <div className="relative flex h-48 items-end justify-center gap-1.5 overflow-hidden rounded-t-lg border-b border-l border-border bg-surface-muted px-2 pb-0">
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-1/2 border-t border-border/70"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 border-t border-border/70"
                      />
                      {decoratedSeries.map((item) => {
                        const value = toFiniteNumber(point.values[item.key]);
                        const height =
                          maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
                        const isNegative = value < 0;
                        const style = isNegative
                          ? getToneStyle('negative')
                          : item.style;

                        return (
                          <div
                            aria-label={`${label} ${item.label}: ${formatAnalyticsFullValue(value, format)}`}
                            className={cn(
                              'relative z-10 w-4 max-w-6 rounded-t-sm transition-colors',
                              style.bar,
                            )}
                            key={`${point.key}-${item.key}`}
                            role="img"
                            style={{
                              height: `${value === 0 ? 0 : Math.max(height, 4)}%`,
                            }}
                            title={`${label} ${item.label}: ${formatAnalyticsFullValue(value, format)}`}
                          />
                        );
                      })}
                    </div>
                    <p
                      aria-label={label}
                      className="mt-2 truncate whitespace-nowrap text-center text-xs leading-4 text-muted-foreground"
                      title={label}
                    >
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <ChartLegend
        format={format}
        items={decoratedSeries.map((item, index) => ({
          key: item.key,
          label: item.label,
          marker: item.marker,
          tone: item.tone,
          value: totals[index] ?? 0,
        }))}
      />
    </div>
  );
};

export const TrendChartCard = ({
  title,
  insight,
  description,
  metaLabel,
  footer,
  data,
  series,
  emptyTitle,
  emptyDescription,
  format = 'number',
}: {
  title: string;
  insight?: ReactNode;
  description?: string;
  metaLabel?: ReactNode;
  footer?: ReactNode;
  data: AnalyticsTrendPoint[];
  series: ChartSeries[];
  emptyTitle: string;
  emptyDescription: string;
  format?: AnalyticsValueFormat;
}) => (
  <ChartCardShell
    description={description}
    footer={footer}
    insight={insight}
    metaLabel={metaLabel}
    title={title}
  >
    <TrendBarChart
      data={data}
      emptyDescription={emptyDescription}
      emptyTitle={emptyTitle}
      format={format}
      series={series}
    />
  </ChartCardShell>
);

export const ComparisonBarChartCard = ({
  title,
  insight,
  description,
  metaLabel,
  footer,
  data,
  emptyTitle,
  emptyDescription,
  format = 'number',
}: {
  title: string;
  insight?: ReactNode;
  description?: string;
  metaLabel?: ReactNode;
  footer?: ReactNode;
  data: AnalyticsDataPoint[];
  emptyTitle: string;
  emptyDescription: string;
  format?: AnalyticsValueFormat;
}) => (
  <ChartCardShell
    description={description}
    footer={footer}
    insight={insight}
    metaLabel={metaLabel}
    title={title}
  >
    <ComparisonBarChart
      data={data}
      emptyDescription={emptyDescription}
      emptyTitle={emptyTitle}
      format={format}
    />
  </ChartCardShell>
);

export const DistributionChartCard = ({
  title,
  insight,
  description,
  metaLabel,
  footer,
  data,
  emptyTitle,
  emptyDescription,
  format = 'number',
}: {
  title: string;
  insight?: ReactNode;
  description?: string;
  metaLabel?: ReactNode;
  footer?: ReactNode;
  data: AnalyticsDataPoint[];
  emptyTitle: string;
  emptyDescription: string;
  format?: AnalyticsValueFormat;
}) => (
  <ChartCardShell
    description={description}
    footer={footer}
    insight={insight}
    metaLabel={metaLabel}
    title={title}
  >
    <DistributionChart
      data={data}
      emptyDescription={emptyDescription}
      emptyTitle={emptyTitle}
      format={format}
    />
  </ChartCardShell>
);

export const StackedStatusCard = DistributionChartCard;

export const KpiTrendCard = ({
  title,
  insight,
  description,
  metaLabel,
  footer,
  metrics,
  data,
  series,
  emptyTitle,
  emptyDescription,
  format = 'number',
  metricFormat = format,
}: {
  title: string;
  insight?: ReactNode;
  description?: string;
  metaLabel?: ReactNode;
  footer?: ReactNode;
  metrics: AnalyticsDataPoint[];
  data: AnalyticsTrendPoint[];
  series: ChartSeries[];
  emptyTitle: string;
  emptyDescription: string;
  format?: AnalyticsValueFormat;
  metricFormat?: AnalyticsValueFormat;
}) => (
  <ChartCardShell
    description={description}
    footer={footer}
    insight={insight}
    metaLabel={metaLabel}
    title={title}
  >
    <MetricCardGrid format={metricFormat} items={metrics} />
    <TrendBarChart
      data={data}
      emptyDescription={emptyDescription}
      emptyTitle={emptyTitle}
      format={format}
      series={series}
    />
  </ChartCardShell>
);

export const MiniReportTableCard = ({
  title,
  insight,
  description,
  metaLabel,
  footer,
  rows,
  format = 'number',
  emptyTitle = 'No report rows',
  emptyDescription = 'Report values will appear when the selected filters return activity.',
}: {
  title: string;
  insight?: ReactNode;
  description?: string;
  metaLabel?: ReactNode;
  footer?: ReactNode;
  rows: Array<{
    key: string;
    label: string;
    value: number;
    detail?: ReactNode;
    tone?: ChartTone;
  }>;
  format?: AnalyticsValueFormat;
  emptyTitle?: string;
  emptyDescription?: string;
}) => {
  const visibleRows = rows;

  return (
    <ChartCardShell
      description={description}
      footer={footer}
      insight={insight}
      metaLabel={metaLabel}
      title={title}
    >
      {visibleRows.length === 0 ? (
        <AnalyticsEmptyState
          description={emptyDescription}
          title={emptyTitle}
        />
      ) : (
        <TableShell>
          <table className="min-w-full text-sm">
            <tbody>
              {visibleRows.map((row, index) => {
                const tone =
                  row.tone ?? inferChartTone(row.key, row.label, index);
                const style = getToneStyle(tone);

                return (
                  <tr
                    className="border-b border-border last:border-b-0"
                    key={row.key}
                  >
                    <td className="min-w-0 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'h-2.5 w-2.5 shrink-0 rounded-full',
                            style.bar,
                          )}
                        />
                        <div className="min-w-0">
                          <p
                            className="truncate font-semibold text-foreground"
                            title={buildLabel(row.label)}
                          >
                            {buildLabel(row.label)}
                          </p>
                          {row.detail ? (
                            <div className="mt-1 text-xs leading-5 text-muted-foreground">
                              {row.detail}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-foreground">
                      {formatAnalyticsFullValue(row.value, format)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}
    </ChartCardShell>
  );
};

export const SampleScopeNote = ({
  sample,
  noun,
}: {
  sample: AnalyticsSampleMeta;
  noun: string;
}) => (
  <span>
    {sample.isTruncated
      ? `Trend uses latest ${sample.sampleSize} of ${sample.total} ${noun} returned by existing list APIs.`
      : `Trend uses ${sample.sampleSize} ${noun} returned by existing list APIs.`}
  </span>
);
