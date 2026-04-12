'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { PaginationControls } from '../../components/ui/pagination-controls';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import { formatDateTime } from '../../lib/format';
import { useUnitStatuses } from './hooks';
import {
  MasterFilterCard,
  MasterStatusBadge,
  ProjectPropertyAccessRequiredState,
  ProjectPropertyPageHeader,
  ProjectPropertyQueryErrorBanner,
  ProjectPropertyReadOnlyNotice,
  ProjectPropertySection,
} from './shared';
import {
  PAGE_SIZE,
} from './utils';

export const UnitStatusesPage = () => {
  const { canAccessProjectProperty, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessProjectProperty && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'sortOrder',
      sortOrder: 'asc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
    }),
    [deferredSearch, page, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const unitStatusesQuery = useUnitStatuses(companyId, listQuery, isEnabled);

  if (!user) {
    return null;
  }

  if (!canAccessProjectProperty) {
    return <ProjectPropertyAccessRequiredState />;
  }

  return (
    <div className="space-y-6">
      <ProjectPropertyPageHeader
        title="Unit Statuses"
        description="Review the fixed backend unit-status master data used by units. This page is intentionally read-only because the backend controls the canonical status set."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
      />

      <ProjectPropertySection
        title="Fixed status catalog"
        description="Statuses are surfaced here for visibility and filter context only. Unit create/edit flows can reference them, but this phase does not permit editing the canonical status list."
      >
        <ProjectPropertyReadOnlyNotice
          title="Controlled master data"
          description="Unit statuses are fixed and backend-controlled in this phase. The frontend lists them for operational clarity and does not expose create, edit, activate, or deactivate actions."
        />

        <MasterFilterCard
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          searchPlaceholder="Search unit statuses by code or name"
          searchValue={search}
          statusFilter={statusFilter}
        />

        {unitStatusesQuery.isError && isApiError(unitStatusesQuery.error) ? (
          <ProjectPropertyQueryErrorBanner
            message={unitStatusesQuery.error.apiError.message}
          />
        ) : null}

        {unitStatusesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading unit statuses.
          </div>
        ) : unitStatusesQuery.data && unitStatusesQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Sort order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitStatusesQuery.data.items.map((unitStatus) => (
                  <TableRow key={unitStatus.id}>
                    <TableCell className="font-semibold text-foreground">
                      {unitStatus.name}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                        {unitStatus.code}
                      </span>
                    </TableCell>
                    <TableCell>{unitStatus.sortOrder}</TableCell>
                    <TableCell>
                      <MasterStatusBadge isActive={unitStatus.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(unitStatus.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={unitStatusesQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No unit statuses found"
            description="The backend did not return any fixed unit statuses for the active company scope."
          />
        )}
      </ProjectPropertySection>
    </div>
  );
};
