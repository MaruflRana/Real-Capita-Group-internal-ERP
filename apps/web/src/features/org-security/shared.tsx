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
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';

export const OrgPageHeader = ({
  eyebrow,
  title,
  description,
  scopeName,
  scopeSlug,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  scopeName?: string;
  scopeSlug?: string;
  actions?: ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-col gap-4 border-b border-border/70 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6">
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
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </CardHeader>
  </Card>
);

export const ListToolbar = ({
  searchValue,
  onSearchChange,
  isActiveFilter,
  onIsActiveFilterChange,
  searchPlaceholder = 'Search',
  extraFilters,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  isActiveFilter: 'all' | 'active' | 'inactive';
  onIsActiveFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  searchPlaceholder?: string;
  extraFilters?: ReactNode;
}) => (
  <Card>
    <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1fr_220px_auto]">
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          value={searchValue}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="isActive">Status</Label>
        <Select
          id="isActive"
          onChange={(event) =>
            onIsActiveFilterChange(
              event.target.value as 'all' | 'active' | 'inactive',
            )
          }
          value={isActiveFilter}
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </Select>
      </div>
      {extraFilters ? (
        <div className="space-y-2">{extraFilters}</div>
      ) : (
        <div />
      )}
    </CardContent>
  </Card>
);

export const StatusBadge = ({
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

export const QueryErrorBanner = ({
  message,
}: {
  message: string;
}) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
    {message}
  </div>
);
