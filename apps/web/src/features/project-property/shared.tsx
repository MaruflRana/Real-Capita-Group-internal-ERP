'use client';

import type { ReactNode } from 'react';

import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import {
  FilterCardShell,
  ModulePageHeader,
  ModuleSection,
} from '../../components/ui/erp-primitives';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';

export const ProjectPropertyPageHeader = ({
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
    eyebrow="Project & Property Master"
    scopeName={scopeName}
    scopeSlug={scopeSlug}
    title={title}
  />
);

export const ProjectPropertySection = ({
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

export const ProjectPropertyQueryErrorBanner = ({
  message,
}: {
  message: string;
}) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
    {message}
  </div>
);

export const MasterStatusBadge = ({
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}: {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) => (
  <Badge variant={isActive ? 'success' : 'warning'}>
    {isActive ? activeLabel : inactiveLabel}
  </Badge>
);

export const ProjectPropertyAccessRequiredState = () => (
  <EmptyState
    title="Project & Property access required"
    description="The active session does not currently include company_admin access in this company scope."
  />
);

export const ProjectPropertyReadOnlyNotice = ({
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

export const MasterFilterCard = ({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  searchPlaceholder = 'Search by code, name, or description',
  children,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}) => (
  <FilterCardShell>
    <div className="space-y-2 xl:col-span-2">
      <Label htmlFor="master-search">Search</Label>
      <Input
        id="master-search"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        value={searchValue}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="master-status-filter">Status</Label>
      <Select
        id="master-status-filter"
        onChange={(event) =>
          onStatusFilterChange(
            event.target.value as 'all' | 'active' | 'inactive',
          )
        }
        value={statusFilter}
      >
        <option value="all">All statuses</option>
        <option value="active">Active only</option>
        <option value="inactive">Inactive only</option>
      </Select>
    </div>
    {children ? <div className="space-y-2">{children}</div> : <div />}
  </FilterCardShell>
);

export const FormErrorText = ({
  message,
}: {
  message: string | undefined;
}) =>
  message ? <p className="text-sm text-rose-700">{message}</p> : null;

export const HierarchyBadgeRow = ({
  items,
}: {
  items: Array<string | null | undefined>;
}) => {
  const values = items.filter((item): item is string => Boolean(item));

  if (values.length === 0) {
    return <span className="text-sm text-muted-foreground">No hierarchy set</span>;
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
