'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { Select } from '../../components/ui/select';
import { SidePanel } from '../../components/ui/side-panel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import type { LeaveTypeRecord } from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { LeaveTypeFormPanel, type LeaveTypeFormValues } from './forms';
import {
  useLeaveType,
  useLeaveTypes,
  useSaveLeaveType,
  useToggleLeaveType,
} from './hooks';
import {
  HrCoreAccessRequiredState,
  HrCoreFilterCard,
  HrCorePageHeader,
  HrCoreQueryErrorBanner,
  HrCoreSection,
  HrEntityStatusBadge,
} from './shared';
import {
  getStatusQueryValue,
  normalizeOptionalTextToNull,
  PAGE_SIZE,
} from './utils';

export const LeaveTypesPage = () => {
  const { canAccessHr, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessHr && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<LeaveTypeRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => {
      const isActive = getStatusQueryValue(statusFilter);

      return {
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'code',
        sortOrder: 'asc' as const,
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      };
    },
    [deferredSearch, page, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const leaveTypesQuery = useLeaveTypes(companyId, listQuery, isEnabled);
  const leaveTypeDetailQuery = useLeaveType(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveLeaveTypeMutation = useSaveLeaveType(companyId);
  const toggleLeaveTypeMutation = useToggleLeaveType(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessHr) {
    return <HrCoreAccessRequiredState />;
  }

  const leaveTypeForForm = leaveTypeDetailQuery.data ?? editor;
  const buildPayload = (values: LeaveTypeFormValues) => ({
    code: values.code.trim(),
    name: values.name.trim(),
    description: normalizeOptionalTextToNull(values.description),
  });

  return (
    <div className="space-y-6">
      <HrCorePageHeader
        title="Leave Types"
        description="Operate the company-scoped leave type catalog used for leave request drafting and lifecycle actions."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <Button
            onClick={() => {
              setActionError(null);
              setEditor(null);
              setPanelOpen(true);
            }}
          >
            New leave type
          </Button>
        }
      />

      {actionError ? <HrCoreQueryErrorBanner message={actionError} /> : null}

      <HrCoreSection
        title="Leave type list"
        description="Search by leave type code, name, or description. Keep type naming and activation state clean before managers act on leave requests."
      >
        <HrCoreFilterCard>
          <div className="space-y-2 xl:col-span-3">
            <Label htmlFor="leave-type-search">Search</Label>
            <Input
              id="leave-type-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leave types by code, name, or description"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-type-status-filter">Status</Label>
            <Select
              id="leave-type-status-filter"
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
              }
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
          </div>
        </HrCoreFilterCard>

        {leaveTypesQuery.isError && isApiError(leaveTypesQuery.error) ? (
          <HrCoreQueryErrorBanner message={leaveTypesQuery.error.apiError.message} />
        ) : null}

        {leaveTypesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading leave types.
          </div>
        ) : leaveTypesQuery.data && leaveTypesQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypesQuery.data.items.map((leaveType) => (
                  <TableRow key={leaveType.id}>
                    <TableCell className="font-semibold text-foreground">
                      {leaveType.code}
                    </TableCell>
                    <TableCell>{leaveType.name}</TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm text-muted-foreground">
                        {leaveType.description || 'No description'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <HrEntityStatusBadge isActive={leaveType.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(leaveType.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(leaveType);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleLeaveTypeMutation.isPending}
                          onClick={() =>
                            void toggleLeaveTypeMutation
                              .mutateAsync({
                                leaveTypeId: leaveType.id,
                                isActive: leaveType.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the leave type status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {leaveType.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={leaveTypesQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No leave types found"
            description="Create the first leave type or adjust the current filters to review existing leave categories."
          />
        )}
      </HrCoreSection>

      <SidePanel
        description={
          editor
            ? 'Update leave type metadata and activation state used by leave requests.'
            : 'Create a leave type that can be assigned to employee leave requests.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit leave type' : 'Create leave type'}
      >
        <LeaveTypeFormPanel
          isPending={saveLeaveTypeMutation.isPending}
          leaveType={leaveTypeForForm}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveLeaveTypeMutation
              .mutateAsync(
                editor
                  ? { leaveTypeId: editor.id, payload: buildPayload(values) }
                  : { payload: buildPayload(values) },
              )
              .then(() => {
                setActionError(null);
                setPanelOpen(false);
                setEditor(null);
              })
          }
        />
      </SidePanel>
    </div>
  );
};
