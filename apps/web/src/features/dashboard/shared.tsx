'use client';

import type { ComponentType, ReactNode } from 'react';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  buttonVariants,
  cn,
} from '@real-capita/ui';

import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { formatDateTime } from '../../lib/format';

import type { DashboardIssue } from '../../lib/api/dashboard';

export const DashboardSection = ({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-col gap-4 border-b border-border/70 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6">
            {description}
          </CardDescription>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </CardHeader>
    <CardContent className="space-y-5 pt-6">{children}</CardContent>
  </Card>
);

export const DashboardIssueBanner = ({
  issues,
}: {
  issues: DashboardIssue[];
}) => {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-2">
          <p className="font-semibold">Some dashboard data could not load.</p>
          <div className="space-y-1">
            {issues.map((issue) => (
              <p key={issue.id}>
                <span className="font-medium">{issue.title}</span> {issue.message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardSummaryPanel = ({
  title,
  description,
  href,
  items,
}: {
  title: string;
  description: string;
  href: string;
  items: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
}) => (
  <Card className="h-full">
    <CardHeader className="border-b border-border/70">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </div>
        <Link
          className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}
          href={href}
        >
          Open
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </CardHeader>
    <CardContent className="grid gap-3 pt-6 md:grid-cols-2">
      {items.map((item) => (
        <div
          className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
          key={`${title}-${item.label}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {item.value}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {item.hint}
          </p>
        </div>
      ))}
    </CardContent>
  </Card>
);

export const DashboardTimelinePanel = ({
  title,
  description,
  href,
  items,
  emptyTitle,
  emptyDescription,
}: {
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
}) => (
  <Card className="h-full">
    <CardHeader className="border-b border-border/70">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </div>
        <Link
          className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}
          href={href}
        >
          Open
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </CardHeader>
    <CardContent className="pt-6">
      {items.length === 0 ? (
        <EmptyState
          description={emptyDescription}
          title={emptyTitle}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const body = (
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 transition hover:border-primary/30 hover:bg-accent/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="outline">{item.typeLabel}</Badge>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {formatDateTime(item.occurredAt)}
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.details.map((detail) => (
                    <span
                      className="rounded-full border border-border/70 bg-background px-2 py-1"
                      key={`${item.id}-${detail}`}
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            );

            if (!item.href) {
              return <div key={item.id}>{body}</div>;
            }

            return (
              <Link href={item.href} key={item.id}>
                {body}
              </Link>
            );
          })}
        </div>
      )}
    </CardContent>
  </Card>
);

export const DashboardAttentionCard = ({
  title,
  count,
  description,
  href,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
}) => (
  <Link href={href}>
    <Card className="h-full transition hover:border-primary/30 hover:shadow-sm">
      <CardContent className="flex h-full flex-col justify-between gap-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <Badge variant={count > 0 ? 'warning' : 'outline'}>
            {count > 0 ? 'Active' : 'Clear'}
          </Badge>
        </div>
        <div className="flex items-end justify-between gap-4">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {count}
          </p>
          <span className="text-sm font-medium text-primary">Open</span>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export const DashboardQuickActionTile = ({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{
    className?: string;
  }>;
}) => (
  <Link href={href}>
    <div className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 transition hover:border-primary/30 hover:bg-accent/40">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-border/70 bg-background p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  </Link>
);

export const DashboardLoadingGrid = ({
  count,
}: {
  count: number;
}) => (
  <div className="grid gap-4 lg:grid-cols-2">
    {Array.from({ length: count }).map((_, index) => (
      <div
        className="h-48 animate-pulse rounded-3xl border border-border/70 bg-muted/30"
        key={`dashboard-loading-${index}`}
      />
    ))}
  </div>
);
