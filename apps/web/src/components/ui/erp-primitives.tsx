import type { HTMLAttributes, ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from '@real-capita/ui';
import { Badge } from './badge';

type Tone = 'default' | 'info' | 'success' | 'warning' | 'danger';

const toneStyles: Record<
  Tone,
  {
    border: string;
    indicator: string;
    soft: string;
    text: string;
  }
> = {
  default: {
    border: 'border-border',
    indicator: 'bg-chart-slate',
    soft: 'bg-surface-muted',
    text: 'text-foreground',
  },
  info: {
    border: 'border-status-info/25',
    indicator: 'bg-status-info',
    soft: 'bg-status-infoSoft',
    text: 'text-status-info',
  },
  success: {
    border: 'border-status-success/25',
    indicator: 'bg-status-success',
    soft: 'bg-status-successSoft',
    text: 'text-status-success',
  },
  warning: {
    border: 'border-status-warning/30',
    indicator: 'bg-status-warning',
    soft: 'bg-status-warningSoft',
    text: 'text-status-warning',
  },
  danger: {
    border: 'border-status-danger/25',
    indicator: 'bg-status-danger',
    soft: 'bg-status-dangerSoft',
    text: 'text-status-danger',
  },
};

const actionWrapClass =
  'flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto lg:shrink-0 lg:justify-end';

export const AppPage = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('min-w-0 space-y-5 xl:space-y-6', className)}
    {...props}
  />
);

export const ModulePageHeader = ({
  eyebrow,
  title,
  description,
  scopeName,
  scopeSlug,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  scopeName?: string | undefined;
  scopeSlug?: string | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
}) => (
  <Card className={cn('min-w-0 overflow-hidden', className)}>
    <CardHeader className="flex flex-col gap-4 border-b border-border bg-surface-raised px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <CardTitle className="text-2xl leading-8">{title}</CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6">
            {description}
          </CardDescription>
        </div>
        {scopeName ? (
          <div className="flex min-w-0 flex-wrap gap-2">
            <Badge className="max-w-full" variant="outline">
              <span className="truncate">{scopeName}</span>
            </Badge>
            {scopeSlug ? (
              <Badge className="max-w-full font-mono" variant="outline">
                <span className="truncate">{scopeSlug}</span>
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      {actions ? <div className={actionWrapClass}>{actions}</div> : null}
    </CardHeader>
  </Card>
);

export const ModuleSection = ({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description: string;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  contentClassName?: string | undefined;
}) => (
  <Card className={cn('min-w-0 overflow-hidden', className)}>
    <CardHeader className="flex flex-col gap-4 border-b border-border bg-surface-raised/80 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        <CardTitle className="text-lg leading-7">{title}</CardTitle>
        <CardDescription className="max-w-4xl leading-6">
          {description}
        </CardDescription>
      </div>
      {actions ? <div className={actionWrapClass}>{actions}</div> : null}
    </CardHeader>
    <CardContent className={cn('space-y-4 pt-5 sm:pt-5', contentClassName)}>
      {children}
    </CardContent>
  </Card>
);

export const FilterCardShell = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) => (
  <Card className="min-w-0">
    <CardContent
      className={cn(
        'grid gap-3 pt-5 sm:pt-5 md:grid-cols-2 xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </CardContent>
  </Card>
);

export const PageSection = ({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  contentClassName?: string | undefined;
}) => (
  <section className={cn('space-y-4 xl:space-y-5', className)}>
    <div className="flex flex-col gap-4 border-b border-border pb-3.5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold leading-7 tracking-normal text-foreground sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={actionWrapClass}>{action}</div> : null}
    </div>
    <div className={cn('space-y-4 xl:space-y-5', contentClassName)}>
      {children}
    </div>
  </section>
);

export const ReportSection = ({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string | undefined;
  children: ReactNode;
  action?: ReactNode | undefined;
  className?: string | undefined;
}) => (
  <PageSection
    action={action}
    className={className}
    description={description}
    title={title}
  >
    {children}
  </PageSection>
);

export const AnalyticsGrid = ({
  children,
  className,
  density = 'standard',
}: {
  children: ReactNode;
  className?: string | undefined;
  density?: 'standard' | 'compact';
}) => (
  <div
    className={cn(
      'grid min-w-0 gap-4 xl:gap-5',
      density === 'compact'
        ? '[grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]'
        : '[grid-template-columns:repeat(auto-fit,minmax(min(100%,30rem),1fr))]',
      className,
    )}
  >
    {children}
  </div>
);

export const ReportGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) => (
  <div
    className={cn(
      'grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))] xl:gap-5',
      className,
    )}
  >
    {children}
  </div>
);

export const KpiCard = ({
  label,
  value,
  helper,
  tone = 'default',
  className,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode | undefined;
  tone?: Tone;
  className?: string | undefined;
}) => {
  const style = toneStyles[tone];

  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border bg-card px-4 py-4 shadow-sm',
        style.border,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', style.indicator)}
        />
        <div className="min-w-0">
          <p className="erp-label">{label}</p>
          <div className="erp-kpi-value mt-2">{value}</div>
          {helper ? (
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {helper}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const MetricCard = ({
  label,
  value,
  helper,
  tone = 'default',
  className,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode | undefined;
  tone?: Tone;
  className?: string | undefined;
}) => {
  const style = toneStyles[tone];

  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border px-4 py-3.5',
        style.border,
        style.soft,
        className,
      )}
    >
      <p className="erp-label">{label}</p>
      <div
        className={cn(
          'mt-2 break-words font-semibold leading-7 text-foreground [overflow-wrap:anywhere]',
          style.text,
        )}
      >
        {value}
      </div>
      {helper ? (
        <div className="mt-2 text-sm leading-6 text-muted-foreground">
          {helper}
        </div>
      ) : null}
    </div>
  );
};

export const StatusChip = ({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string | undefined;
}) => {
  const style = toneStyles[tone];

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold leading-4',
        style.border,
        style.soft,
        style.text,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.indicator)}
      />
      <span className="truncate">{children}</span>
    </span>
  );
};

export const ChartCardShell = ({
  title,
  description,
  insight,
  metaLabel,
  action,
  footer,
  children,
  className,
}: {
  title: string;
  description?: string | undefined;
  insight?: ReactNode | undefined;
  metaLabel?: ReactNode | undefined;
  action?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
}) => (
  <Card className={cn('h-full min-w-0 overflow-hidden', className)}>
    <CardHeader className="flex flex-col gap-3 border-b border-border bg-surface-raised lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <CardTitle className="text-base leading-6 sm:text-lg">
            {title}
          </CardTitle>
          {metaLabel ? (
            <span className="inline-flex max-w-full items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold leading-4 text-muted-foreground">
              <span className="truncate">{metaLabel}</span>
            </span>
          ) : null}
        </div>
        {insight ? (
          <p className="max-w-3xl text-sm font-medium leading-6 text-foreground">
            {insight}
          </p>
        ) : null}
        {description ? (
          <CardDescription className="max-w-3xl">{description}</CardDescription>
        ) : null}
      </div>
      {action ? <div className={actionWrapClass}>{action}</div> : null}
    </CardHeader>
    <CardContent className="space-y-5 pt-5">
      {children}
      {footer ? (
        <DataSourceNote className="border-t border-border pt-3">
          {footer}
        </DataSourceNote>
      ) : null}
    </CardContent>
  </Card>
);

export const EmptyStateBlock = ({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode | undefined;
  className?: string | undefined;
}) => (
  <div
    className={cn(
      'min-w-0 rounded-lg border border-dashed border-border bg-surface-muted px-4 py-5',
      className,
    )}
  >
    <p className="break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
      {title}
    </p>
    <div className="mt-2 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
      {description}
    </div>
    {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
  </div>
);

export const DataSourceNote = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) => (
  <div
    className={cn(
      'break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]',
      className,
    )}
  >
    {children}
  </div>
);

export const TableShell = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'table-shell max-w-full overflow-x-auto overscroll-x-contain rounded-lg border border-border bg-card shadow-sm',
      className,
    )}
    {...props}
  />
);
