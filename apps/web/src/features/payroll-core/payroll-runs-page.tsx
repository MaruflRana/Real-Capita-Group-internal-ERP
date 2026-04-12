'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button, buttonVariants, cn } from '@real-capita/ui';

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
import { formatAccountingAmount, formatDateTime } from '../../lib/format';
import { getPayrollRunDetailRoute } from '../../lib/routes';
import type { PayrollRunRecord, PayrollRunStatus } from '../../lib/api/types';
import { PayrollRunFormPanel, type PayrollRunFormValues } from './forms';
import {
  usePayrollCostCenters,
  usePayrollProjects,
  usePayrollRuns,
  useSavePayrollRun,
} from './hooks';
import {
  PayrollCoreAccessRequiredState,
  PayrollCoreFilterCard,
  PayrollCorePageHeader,
  PayrollCoreQueryErrorBanner,
  PayrollCoreSection,
  PayrollRunStatusBadge,
} from './shared';
import {
  formatPayrollPeriodLabel,
  getCostCenterLabel,
  getPayrollRunScopeLabel,
  getPayrollVoucherReference,
  getProjectLabel,
  normalizeNullableId,
  normalizeOptionalTextToNull,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const PayrollRunsPage = () => {
  const { canAccessPayroll, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessPayroll && Boolean(companyId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [costCenterFilter, setCostCenterFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<PayrollRunRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(yearFilter ? { payrollYear: Number(yearFilter) } : {}),
      ...(monthFilter ? { payrollMonth: Number(monthFilter) } : {}),
      ...(statusFilter ? { status: statusFilter as PayrollRunStatus } : {}),
      ...(projectFilter ? { projectId: projectFilter } : {}),
      ...(costCenterFilter ? { costCenterId: costCenterFilter } : {}),
    }),
    [
      costCenterFilter,
      deferredSearch,
      monthFilter,
      page,
      projectFilter,
      statusFilter,
      yearFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [costCenterFilter, deferredSearch, monthFilter, projectFilter, statusFilter, yearFilter]);

  const referenceQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      isActive: true,
    }),
    [],
  );

  const projectsQuery = usePayrollProjects(companyId, referenceQuery, isEnabled);
  const costCentersQuery = usePayrollCostCenters(
    companyId,
    {
      ...referenceQuery,
      ...(projectFilter ? { projectId: projectFilter } : {}),
    },
    isEnabled,
  );
  const allCostCentersQuery = usePayrollCostCenters(companyId, referenceQuery, isEnabled);
  const payrollRunsQuery = usePayrollRuns(companyId, listQuery, isEnabled);
  const savePayrollRunMutation = useSavePayrollRun(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessPayroll) {
    return <PayrollCoreAccessRequiredState />;
  }

  const buildPayload = (values: PayrollRunFormValues) => ({
    payrollYear: values.payrollYear,
    payrollMonth: values.payrollMonth,
    projectId: normalizeNullableId(values.projectId),
    costCenterId: normalizeNullableId(values.costCenterId),
    description: normalizeOptionalTextToNull(values.description),
  });

  return (
    <div className="space-y-6">
      <PayrollCorePageHeader
        title="Payroll Runs"
        description="Create payroll periods, keep draft scope clean, and move payroll runs toward finalized and posted states without bypassing backend lifecycle rules."
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
            New payroll run
          </Button>
        }
      />

      {actionError ? <PayrollCoreQueryErrorBanner message={actionError} /> : null}

      <PayrollCoreSection
        title="Payroll run list"
        description="Filter payroll runs by period, project, cost center, and state. Open a run to edit its safe draft fields, manage lines, finalize it, or post it explicitly."
      >
        <PayrollCoreFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="payroll-run-search">Search</Label>
            <Input
              id="payroll-run-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search payroll runs by description, project, cost center, or voucher reference"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payroll-run-year-filter">Year</Label>
            <Input
              id="payroll-run-year-filter"
              inputMode="numeric"
              onChange={(event) => setYearFilter(event.target.value)}
              placeholder="YYYY"
              value={yearFilter}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payroll-run-month-filter">Month</Label>
            <Select
              id="payroll-run-month-filter"
              onChange={(event) => setMonthFilter(event.target.value)}
              value={monthFilter}
            >
              <option value="">All months</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payroll-run-status-filter">Status</Label>
            <Select
              id="payroll-run-status-filter"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="FINALIZED">Finalized</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="POSTED">Posted</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payroll-run-project-filter">Project</Label>
            <Select
              id="payroll-run-project-filter"
              onChange={(event) => {
                setProjectFilter(event.target.value);
                setCostCenterFilter('');
              }}
              value={projectFilter}
            >
              <option value="">All projects</option>
              {projectsQuery.data?.items.map((project) => (
                <option key={project.id} value={project.id}>
                  {getProjectLabel(project)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payroll-run-cost-center-filter">Cost center</Label>
            <Select
              id="payroll-run-cost-center-filter"
              onChange={(event) => setCostCenterFilter(event.target.value)}
              value={costCenterFilter}
            >
              <option value="">All cost centers</option>
              {costCentersQuery.data?.items.map((costCenter) => (
                <option key={costCenter.id} value={costCenter.id}>
                  {getCostCenterLabel(costCenter)}
                </option>
              ))}
            </Select>
          </div>
        </PayrollCoreFilterCard>

        {payrollRunsQuery.isError && isApiError(payrollRunsQuery.error) ? (
          <PayrollCoreQueryErrorBanner
            message={payrollRunsQuery.error.apiError.message}
          />
        ) : null}

        {payrollRunsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading payroll runs.
          </div>
        ) : payrollRunsQuery.data && payrollRunsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Totals</TableHead>
                  <TableHead>Posting</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRunsQuery.data.items.map((payrollRun) => (
                  <TableRow key={payrollRun.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatPayrollPeriodLabel(
                            payrollRun.payrollYear,
                            payrollRun.payrollMonth,
                          )}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {payrollRun.description || 'No description'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getPayrollRunScopeLabel(payrollRun)}</TableCell>
                    <TableCell>
                      <PayrollRunStatusBadge status={payrollRun.status} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>Lines {payrollRun.lineCount}</p>
                        <p>
                          Gross{' '}
                          {formatAccountingAmount(
                            Number(payrollRun.totalBasicAmount) +
                              Number(payrollRun.totalAllowanceAmount),
                          )}
                        </p>
                        <p className="text-muted-foreground">
                          Net {formatAccountingAmount(payrollRun.totalNetAmount)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getPayrollVoucherReference(payrollRun)}</TableCell>
                    <TableCell>{formatDateTime(payrollRun.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                          href={getPayrollRunDetailRoute(payrollRun.id)}
                        >
                          Open
                        </Link>
                        {payrollRun.status === 'DRAFT' ? (
                          <Button
                            onClick={() => {
                              setActionError(null);
                              setEditor(payrollRun);
                              setPanelOpen(true);
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={payrollRunsQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No payroll runs found"
            description="Create the first payroll run or adjust the current filters to review company payroll periods."
          />
        )}
      </PayrollCoreSection>

      <SidePanel
        description={
          editor
            ? 'Update payroll period scope while the run is still safe to edit. Draft-only restrictions still come from the backend.'
            : 'Create a new company payroll run for a selected year, month, project, and cost center scope.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit payroll run' : 'Create payroll run'}
      >
        <PayrollRunFormPanel
          costCenters={allCostCentersQuery.data?.items ?? []}
          isPending={savePayrollRunMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            savePayrollRunMutation
              .mutateAsync(
                editor
                  ? {
                      payrollRunId: editor.id,
                      payload: buildPayload(values),
                    }
                  : {
                      payload: buildPayload(values),
                    },
              )
              .then(() => {
                setActionError(null);
                setPanelOpen(false);
                setEditor(null);
              })
          }
          payrollRun={editor}
          projects={projectsQuery.data?.items ?? []}
        />
      </SidePanel>
    </div>
  );
};
