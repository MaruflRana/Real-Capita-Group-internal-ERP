'use client';

import { useEffect, useState, type ReactNode } from 'react';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@real-capita/ui';

import {
  AnalyticsGrid as ErpAnalyticsGrid,
  ChartCardShell,
  EmptyStateBlock,
  MetricCard,
} from '../../components/ui/erp-primitives';
import { formatAccountingAmount } from '../../lib/format';
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

type ChartSeriesType = 'bar' | 'line';

type ChartSeries = {
  key: string;
  label: string;
  tone?: ChartTone;
  type?: ChartSeriesType;
};

type ChartLegendItem = {
  key: string;
  label: string;
  value?: number | string | ReactNode;
  tone?: ChartTone;
  marker?: string;
};

export type ChartTone =
  | 'revenue'
  | 'expense'
  | 'balance'
  | 'warning'
  | 'sales'
  | 'collection'
  | 'info'
  | 'neutral';

const CHART_TONE_STYLES: Record<
  ChartTone,
  {
    color: string;
    bar: string;
    border: string;
    soft: string;
    text: string;
    marker: string;
    primitiveTone: 'default' | 'info' | 'success' | 'warning' | 'danger';
  }
> = {
  revenue: {
    color: '#11AA38',
    bar: 'bg-chart-revenue',
    border: 'border-chart-revenue/25',
    soft: 'bg-status-successSoft',
    text: 'text-status-success',
    marker: 'Rev',
    primitiveTone: 'success',
  },
  expense: {
    color: '#D64047',
    bar: 'bg-chart-expense',
    border: 'border-chart-expense/25',
    soft: 'bg-status-dangerSoft',
    text: 'text-status-danger',
    marker: 'Cost',
    primitiveTone: 'danger',
  },
  balance: {
    color: '#006FB7',
    bar: 'bg-chart-balance',
    border: 'border-chart-balance/25',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
    marker: 'Bal',
    primitiveTone: 'info',
  },
  warning: {
    color: '#D97706',
    bar: 'bg-chart-warning',
    border: 'border-chart-warning/30',
    soft: 'bg-status-warningSoft',
    text: 'text-status-warning',
    marker: 'Due',
    primitiveTone: 'warning',
  },
  sales: {
    color: '#2888C8',
    bar: 'bg-chart-sales',
    border: 'border-chart-sales/25',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
    marker: 'Sales',
    primitiveTone: 'info',
  },
  collection: {
    color: '#304898',
    bar: 'bg-chart-collection',
    border: 'border-chart-collection/25',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
    marker: 'Coll',
    primitiveTone: 'info',
  },
  info: {
    color: '#006FB7',
    bar: 'bg-chart-balance',
    border: 'border-chart-balance/25',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
    marker: 'Info',
    primitiveTone: 'info',
  },
  neutral: {
    color: '#475569',
    bar: 'bg-chart-slate',
    border: 'border-chart-slate/25',
    soft: 'bg-surface-muted',
    text: 'text-muted-foreground',
    marker: 'Other',
    primitiveTone: 'default',
  },
};

const DEFAULT_TONES: ChartTone[] = [
  'balance',
  'revenue',
  'expense',
  'sales',
  'collection',
  'warning',
  'info',
  'neutral',
];

const numberFormatter = new Intl.NumberFormat('en-IN');
const compactNumberFormatter = new Intl.NumberFormat('en-IN', {
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
    value.includes('cancelled') ||
    value.includes('canceled') ||
    value.includes('rejected') ||
    value.includes('overdue') ||
    value.includes('loss')
  ) {
    return 'expense';
  }

  if (
    value.includes('draft') ||
    value.includes('pending') ||
    value.includes('submitted') ||
    value.includes('awaiting') ||
    value.includes('due') ||
    value.includes('needs attention')
  ) {
    return 'warning';
  }

  if (
    value.includes('posted') ||
    value.includes('approved') ||
    value.includes('available') ||
    value.includes('finalized')
  ) {
    return 'revenue';
  }

  if (
    value.includes('collection') ||
    value.includes('collected')
  ) {
    return 'collection';
  }

  if (
    value.includes('expense') ||
    value.includes('deduction')
  ) {
    return 'expense';
  }

  if (
    value.includes('revenue') ||
    value.includes('profit')
  ) {
    return 'revenue';
  }

  if (
    value.includes('contract') ||
    value.includes('sale') ||
    value.includes('booking') ||
    value.includes('lead')
  ) {
    return 'sales';
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

export const formatCount = (value: number | string | null | undefined) =>
  numberFormatter.format(toFiniteNumber(value));

export const formatCompactCurrency = (
  value: number | string | null | undefined,
) => {
  const amount = toFiniteNumber(value);

  if (amount >= 10_000_000) {
    return `৳${(amount / 10_000_000).toFixed(1)}C`;
  }

  if (amount >= 100_000) {
    return `৳${(amount / 100_000).toFixed(1)}L`;
  }

  if (amount >= 1_000) {
    return `৳${(amount / 1_000).toFixed(1)}K`;
  }

  return `৳${amount.toFixed(0)}`;
};

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
    ? `${description} Presentation data indicators appear when seeded data is available.`
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
                'inline-flex h-5 min-w-8 shrink-0 items-center justify-center rounded px-1.5 text-[10px] font-bold leading-none text-white shadow-sm ring-1 ring-inset ring-black/10',
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
            <span className="pl-10 font-mono text-xs tabular-nums text-muted-foreground">
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

export const SampleScopeNote = ({
  sample,
  noun,
}: {
  sample: AnalyticsSampleMeta;
  noun: string;
}) => (
  <span>
    {sample.isTruncated
      ? `Trend reflects the latest ${sample.sampleSize} of ${sample.total} available ${noun}.`
      : `Trend reflects ${sample.sampleSize} available ${noun}.`}
  </span>
);

export const ExecutiveTrendChart = ({
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const decoratedSeries = decorateSeries(series);
  const barSeries = decoratedSeries.filter(
    (item) => (item.type ?? 'bar') === 'bar',
  );
  const lineSeries = decoratedSeries.filter((item) => item.type === 'line');

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

  if (chartData.length === 0) {
    return (
      <AnalyticsEmptyState description={emptyDescription} title={emptyTitle} />
    );
  }

  const hasAnyValue = chartData.some((point) =>
    decoratedSeries.some(
      (item) => Math.abs(toFiniteNumber(point.values[item.key])) > 0,
    ),
  );

  if (!hasAnyValue) {
    return (
      <AnalyticsEmptyState description={emptyDescription} title={emptyTitle} />
    );
  }

  const totals = decoratedSeries.map((item) =>
    data.reduce(
      (sum, point) => sum + toFiniteNumber(point.values[item.key]),
      0,
    ),
  );

  const rechartsData = chartData.map((point) => {
    const entry: Record<string, number | string> = {
      label: formatDateBucketLabel(point.label),
    };

    decoratedSeries.forEach((item) => {
      entry[item.key] = toFiniteNumber(point.values[item.key]);
    });

    return entry;
  });

  const tickFormat: AnalyticsValueFormat =
    format === 'currency'
      ? 'compactCurrency'
      : format === 'compactCurrency'
        ? 'compactCurrency'
        : format;

  const formatTick = (value: number) =>
    formatAnalyticsValue(value, tickFormat);

  if (!mounted) {
    return (
      <div className="min-w-0 max-w-full space-y-4" role="img">
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="h-[280px] px-2 py-2 sm:h-[320px] flex items-center justify-center">
            <div className="animate-pulse rounded-lg bg-border/30 h-48 w-3/4" />
          </div>
        </div>
        <ChartLegend
          format={format}
          items={decoratedSeries.map((item, index) => ({
            key: item.key,
            label: item.label,
            marker: item.style.marker,
            tone: item.tone,
            value: totals[index] ?? 0,
          }))}
        />
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-4" role="img">
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="h-[280px] px-2 py-2 sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rechartsData}
              margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={formatTick}
                tickLine={false}
                axisLine={false}
                width={tickFormat === 'compactCurrency' ? 60 : 40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value: unknown, name: unknown) => {
                  const numValue = typeof value === 'number' ? value : 0;
                  const strName = typeof name === 'string' ? name : '';

                  const seriesItem = decoratedSeries.find(
                    (item) => item.key === strName,
                  );

                  return [
                    formatAnalyticsFullValue(numValue, format),
                    seriesItem?.label ?? strName,
                  ];
                }}
                labelStyle={{
                  fontWeight: 600,
                  color: 'var(--foreground)',
                }}
              />
              {barSeries.map((item) => (
                <Bar
                  dataKey={item.key}
                  fill={item.style.color}
                  key={item.key}
                  name={item.key}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
              ))}
              {lineSeries.map((item) => (
                <Line
                  dataKey={item.key}
                  key={item.key}
                  name={item.key}
                  stroke={item.style.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: item.style.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: item.style.color, strokeWidth: 2, stroke: 'var(--card)' }}
                  type="monotone"
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ChartLegend
        format={format}
        items={decoratedSeries.map((item, index) => ({
          key: item.key,
          label: item.label,
          marker: item.style.marker,
          tone: item.tone,
          value: totals[index] ?? 0,
        }))}
      />
    </div>
  );
};

export const ExecutiveTrendChartCard = ({
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
    <ExecutiveTrendChart
      data={data}
      emptyDescription={emptyDescription}
      emptyTitle={emptyTitle}
      format={format}
      series={series}
    />
  </ChartCardShell>
);
