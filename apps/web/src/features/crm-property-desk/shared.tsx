'use client';

import type { ReactNode } from 'react';

import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import {
  FilterCardShell,
  ModulePageHeader,
  ModuleSection,
} from '../../components/ui/erp-primitives';
import type {
  PropertyDeskBookingStatus,
  PropertyDeskDueState,
  PropertyDeskLeadStatus,
} from '../../lib/api/types';

const getLeadBadgeVariant = (status: PropertyDeskLeadStatus) => {
  switch (status) {
    case 'NEW':
      return 'outline';
    case 'CONTACTED':
      return 'default';
    case 'QUALIFIED':
      return 'success';
    case 'CLOSED':
      return 'warning';
  }
};

const getBookingBadgeVariant = (status: PropertyDeskBookingStatus) =>
  status === 'CONTRACTED' ? 'default' : 'success';

const getDueBadgeVariant = (dueState: PropertyDeskDueState) =>
  dueState === 'overdue' ? 'warning' : 'outline';

export const CrmPropertyDeskPageHeader = ({
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
    eyebrow="CRM & Property Desk"
    scopeName={scopeName}
    scopeSlug={scopeSlug}
    title={title}
  />
);

export const CrmPropertyDeskSection = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <ModuleSection actions={actions} description={description} title={title}>
    {children}
  </ModuleSection>
);

export const CrmPropertyDeskQueryErrorBanner = ({
  message,
}: {
  message: string;
}) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
    {message}
  </div>
);

export const CrmPropertyDeskAccessRequiredState = () => (
  <EmptyState
    title="CRM & Property Desk access required"
    description="The active session does not currently include company_admin or company_sales access in this company scope."
  />
);

export const CrmPropertyDeskFilterCard = ({
  children,
}: {
  children: ReactNode;
}) => (
  <FilterCardShell>{children}</FilterCardShell>
);

export const EntityStatusBadge = ({
  isActive,
}: {
  isActive: boolean;
}) => (
  <Badge variant={isActive ? 'success' : 'warning'}>
    {isActive ? 'Active' : 'Inactive'}
  </Badge>
);

export const LeadStatusBadge = ({
  status,
}: {
  status: PropertyDeskLeadStatus;
}) => <Badge variant={getLeadBadgeVariant(status)}>{status}</Badge>;

export const BookingStatusBadge = ({
  status,
}: {
  status: PropertyDeskBookingStatus;
}) => <Badge variant={getBookingBadgeVariant(status)}>{status}</Badge>;

export const DueStateBadge = ({
  dueState,
}: {
  dueState: PropertyDeskDueState;
}) => <Badge variant={getDueBadgeVariant(dueState)}>{dueState}</Badge>;

export const RelationBadgeRow = ({
  items,
}: {
  items: Array<string | null | undefined>;
}) => {
  const values = items.filter((item): item is string => Boolean(item));

  if (values.length === 0) {
    return <span className="text-sm text-muted-foreground">No linked records</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <Badge key={item} variant="outline">
          {item}
        </Badge>
      ))}
    </div>
  );
};

export const KeyValueList = ({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
}) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

export const CrmPropertyDeskReadOnlyNotice = ({
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

export const FormErrorText = ({
  message,
}: {
  message: string | undefined;
}) =>
  message ? <p className="text-sm text-rose-700">{message}</p> : null;
