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
import type { InstallmentScheduleRecord } from '../../lib/api/types';
import { formatAccountingAmount, formatDate, formatDateTime } from '../../lib/format';
import {
  InstallmentScheduleEditPanel,
  InstallmentSchedulesCreatePanel,
  type InstallmentScheduleEditFormValues,
  type InstallmentSchedulesCreateFormValues,
} from './forms';
import {
  useCreateInstallmentSchedules,
  useInstallmentSchedule,
  useInstallmentSchedules,
  useRemoveInstallmentSchedule,
  useSaleContracts,
  useUpdateInstallmentSchedule,
} from './hooks';
import {
  CrmPropertyDeskAccessRequiredState,
  CrmPropertyDeskFilterCard,
  CrmPropertyDeskPageHeader,
  CrmPropertyDeskQueryErrorBanner,
  CrmPropertyDeskSection,
  DueStateBadge,
} from './shared';
import {
  normalizeOptionalTextToNull,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

const getDueState = (dueDate: string): 'upcoming' | 'due' | 'overdue' => {
  const todayKey = new Date().toISOString().slice(0, 10);

  if (dueDate < todayKey) {
    return 'overdue';
  }

  if (dueDate === todayKey) {
    return 'due';
  }

  return 'upcoming';
};

export const InstallmentSchedulesPage = () => {
  const { canAccessCrmPropertyDesk, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessCrmPropertyDesk && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [saleContractFilter, setSaleContractFilter] = useState('all');
  const [dueStateFilter, setDueStateFilter] = useState('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<InstallmentScheduleRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const saleContractsQuery = useSaleContracts(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'contractDate',
      sortOrder: 'desc',
    },
    isEnabled,
  );

  const query = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'sequenceNumber',
      sortOrder: 'asc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(saleContractFilter !== 'all' ? { saleContractId: saleContractFilter } : {}),
      ...(dueStateFilter !== 'all'
        ? { dueState: dueStateFilter as 'due' | 'overdue' }
        : {}),
    }),
    [deferredSearch, dueStateFilter, page, saleContractFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, dueStateFilter, saleContractFilter]);

  const schedulesQuery = useInstallmentSchedules(companyId, query, isEnabled);
  const scheduleDetailQuery = useInstallmentSchedule(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const createSchedulesMutation = useCreateInstallmentSchedules(companyId);
  const updateScheduleMutation = useUpdateInstallmentSchedule(companyId);
  const removeScheduleMutation = useRemoveInstallmentSchedule(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessCrmPropertyDesk) {
    return <CrmPropertyDeskAccessRequiredState />;
  }

  const saleContracts = saleContractsQuery.data?.items ?? [];
  const scheduleForEdit = scheduleDetailQuery.data ?? editor;

  const buildCreatePayload = (values: InstallmentSchedulesCreateFormValues) => ({
    saleContractId: values.saleContractId,
    rows: values.rows.map((row) => ({
      sequenceNumber: row.sequenceNumber,
      dueDate: row.dueDate,
      amount: row.amount,
      description: normalizeOptionalTextToNull(row.description),
    })),
  });

  const buildUpdatePayload = (values: InstallmentScheduleEditFormValues) => ({
    sequenceNumber: values.sequenceNumber,
    dueDate: values.dueDate,
    amount: values.amount,
    description: normalizeOptionalTextToNull(values.description),
  });

  return (
    <div className="space-y-6">
      <CrmPropertyDeskPageHeader
        title="Installment Schedules"
        description="Manage contract-linked installment rows with clear sequence, due date, amount, balance, and safe edit/delete behavior."
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
            New schedules
          </Button>
        }
      />

      {actionError ? <CrmPropertyDeskQueryErrorBanner message={actionError} /> : null}

      <CrmPropertyDeskSection
        title="Schedule register"
        description="Use contract and due-state filters to inspect the payment plan. Updating or deleting a row remains blocked once collections are linked."
      >
        <CrmPropertyDeskFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="schedule-search">Search</Label>
            <Input
              id="schedule-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer, unit, contract reference, or description"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-contract-filter">Sale contract</Label>
            <Select
              id="schedule-contract-filter"
              onChange={(event) => setSaleContractFilter(event.target.value)}
              value={saleContractFilter}
            >
              <option value="all">All contracts</option>
              {saleContracts.map((saleContract) => (
                <option key={saleContract.id} value={saleContract.id}>
                  {saleContract.unitCode} - {saleContract.customerName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-due-state-filter">Due state</Label>
            <Select
              id="schedule-due-state-filter"
              onChange={(event) => setDueStateFilter(event.target.value)}
              value={dueStateFilter}
            >
              <option value="all">All due states</option>
              <option value="due">Due today</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
        </CrmPropertyDeskFilterCard>

        {schedulesQuery.isError && isApiError(schedulesQuery.error) ? (
          <CrmPropertyDeskQueryErrorBanner
            message={schedulesQuery.error.apiError.message}
          />
        ) : null}

        {schedulesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading installment schedules.
          </div>
        ) : schedulesQuery.data && schedulesQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer / Unit</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Amounts</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulesQuery.data.items.map((schedule) => {
                  const dueState = getDueState(schedule.dueDate);

                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">
                            {schedule.customerName}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {schedule.projectCode} / {schedule.unitCode}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {schedule.unitName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>#{schedule.sequenceNumber}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <p className="text-sm text-foreground">
                            {formatDate(schedule.dueDate)}
                          </p>
                          {dueState === 'due' || dueState === 'overdue' ? (
                            <DueStateBadge dueState={dueState} />
                          ) : (
                            <span className="text-sm text-muted-foreground">Upcoming</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p>Plan {formatAccountingAmount(schedule.amount)}</p>
                          <p className="text-muted-foreground">
                            Collected {formatAccountingAmount(schedule.collectedAmount)}
                          </p>
                          <p className="text-muted-foreground">
                            Balance {formatAccountingAmount(schedule.balanceAmount)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p>{schedule.description || 'No description'}</p>
                          <p className="text-muted-foreground">
                            Updated {formatDateTime(schedule.updatedAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => {
                              setActionError(null);
                              setEditor(schedule);
                              setPanelOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                          <Button
                            disabled={removeScheduleMutation.isPending}
                            onClick={() =>
                              void removeScheduleMutation
                                .mutateAsync(schedule.id)
                                .then(() => setActionError(null))
                                .catch((error) =>
                                  setActionError(
                                    isApiError(error)
                                      ? error.apiError.message
                                      : 'Unable to remove the installment schedule.',
                                  ),
                                )
                            }
                            size="sm"
                            variant="ghost"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <PaginationControls meta={schedulesQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No installment schedules found"
            description="Create the first schedule rows for a sale contract or adjust the current filters."
          />
        )}
      </CrmPropertyDeskSection>

      <SidePanel
        description={
          editor
            ? 'Review the contract-linked schedule row and update only the safe fields while the backend still allows changes.'
            : 'Create one or more schedule rows for an existing sale contract.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit installment schedule' : 'Create installment schedules'}
      >
        {editor && scheduleForEdit ? (
          <InstallmentScheduleEditPanel
            isPending={updateScheduleMutation.isPending}
            onClose={() => {
              setPanelOpen(false);
              setEditor(null);
            }}
            onSubmit={(values) =>
              updateScheduleMutation
                .mutateAsync({
                  installmentScheduleId: editor.id,
                  payload: buildUpdatePayload(values),
                })
                .then(() => {
                  setActionError(null);
                  setPanelOpen(false);
                  setEditor(null);
                })
            }
            schedule={scheduleForEdit}
          />
        ) : (
          <InstallmentSchedulesCreatePanel
            isPending={createSchedulesMutation.isPending}
            onClose={() => {
              setPanelOpen(false);
              setEditor(null);
            }}
            onSubmit={(values) =>
              createSchedulesMutation
                .mutateAsync(buildCreatePayload(values))
                .then(() => {
                  setActionError(null);
                  setPanelOpen(false);
                })
            }
            saleContracts={saleContracts}
          />
        )}
      </SidePanel>
    </div>
  );
};
