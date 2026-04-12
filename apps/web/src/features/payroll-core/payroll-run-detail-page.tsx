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
import { APP_ROUTES, getVoucherDetailRoute } from '../../lib/routes';
import type { PayrollRunLineRecord } from '../../lib/api/types';
import {
  buildPayrollAmountPayload,
  PayrollPostingFormPanel,
  PayrollRunDetailSummary,
  PayrollRunFormPanel,
  PayrollRunLineFormPanel,
  type PayrollPostingFormValues,
  type PayrollRunFormValues,
  type PayrollRunLineFormValues,
} from './forms';
import {
  usePayrollCostCenters,
  usePayrollEmployees,
  usePayrollParticularAccounts,
  usePayrollProjects,
  usePayrollRun,
  usePayrollRunLifecycle,
  usePayrollRunLines,
  usePostPayrollRun,
  useRemovePayrollRunLine,
  useSavePayrollRun,
  useSavePayrollRunLine,
} from './hooks';
import {
  KeyValueList,
  PayrollCoreAccessRequiredState,
  PayrollCoreFilterCard,
  PayrollCorePageHeader,
  PayrollCoreQueryErrorBanner,
  PayrollCoreReadOnlyNotice,
  PayrollCoreSection,
  PayrollRunStatusBadge,
} from './shared';
import {
  formatPayrollPeriodLabel,
  getEmployeeLabel,
  normalizeNullableId,
  normalizeOptionalTextToNull,
  OPTION_PAGE_SIZE,
  RUN_LINE_PAGE_SIZE,
} from './utils';

export const PayrollRunDetailPage = ({
  payrollRunId,
}: {
  payrollRunId: string;
}) => {
  const { canAccessAccounting, canAccessPayroll, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessPayroll && Boolean(companyId);

  const [linePage, setLinePage] = useState(1);
  const [lineSearch, setLineSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [linePanelOpen, setLinePanelOpen] = useState(false);
  const [editRunPanelOpen, setEditRunPanelOpen] = useState(false);
  const [postingPanelOpen, setPostingPanelOpen] = useState(false);
  const [lineEditor, setLineEditor] = useState<PayrollRunLineRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredLineSearch = useDeferredValue(lineSearch);

  const lineQuery = useMemo(
    () => ({
      page: linePage,
      pageSize: RUN_LINE_PAGE_SIZE,
      sortBy: 'employeeCode',
      sortOrder: 'asc' as const,
      ...(deferredLineSearch ? { search: deferredLineSearch } : {}),
      ...(employeeFilter ? { employeeId: employeeFilter } : {}),
    }),
    [deferredLineSearch, employeeFilter, linePage],
  );

  useEffect(() => {
    setLinePage(1);
  }, [deferredLineSearch, employeeFilter]);

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
  const employeeReferenceQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'employeeCode',
      sortOrder: 'asc' as const,
    }),
    [],
  );
  const accountReferenceQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'code',
      sortOrder: 'asc' as const,
      isActive: true,
    }),
    [],
  );

  const payrollRunQuery = usePayrollRun(companyId, payrollRunId, isEnabled);
  const payrollRunLinesQuery = usePayrollRunLines(
    companyId,
    payrollRunId,
    lineQuery,
    isEnabled,
  );
  const employeesQuery = usePayrollEmployees(
    companyId,
    employeeReferenceQuery,
    isEnabled,
  );
  const projectsQuery = usePayrollProjects(companyId, referenceQuery, isEnabled);
  const costCentersQuery = usePayrollCostCenters(companyId, referenceQuery, isEnabled);
  const particularAccountsQuery = usePayrollParticularAccounts(
    companyId,
    accountReferenceQuery,
    isEnabled && postingPanelOpen,
  );
  const savePayrollRunMutation = useSavePayrollRun(companyId);
  const payrollRunLifecycleMutation = usePayrollRunLifecycle(companyId);
  const postPayrollRunMutation = usePostPayrollRun(companyId);
  const savePayrollRunLineMutation = useSavePayrollRunLine(companyId);
  const removePayrollRunLineMutation = useRemovePayrollRunLine(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessPayroll) {
    return <PayrollCoreAccessRequiredState />;
  }

  const payrollRun = payrollRunQuery.data;
  const isDraft = payrollRun?.status === 'DRAFT';
  const isFinalized = payrollRun?.status === 'FINALIZED';
  const isPosted = payrollRun?.status === 'POSTED';

  const buildRunPayload = (values: PayrollRunFormValues) => ({
    payrollYear: values.payrollYear,
    payrollMonth: values.payrollMonth,
    projectId: normalizeNullableId(values.projectId),
    costCenterId: normalizeNullableId(values.costCenterId),
    description: normalizeOptionalTextToNull(values.description),
  });

  const handleActionError = (error: unknown, fallbackMessage: string) => {
    if (isApiError(error)) {
      setActionError(error.apiError.message);
      return;
    }

    if (error instanceof Error) {
      setActionError(error.message);
      return;
    }

    setActionError(fallbackMessage);
  };

  const handleRunAction = async (action: 'finalize' | 'cancel') => {
    if (!payrollRun) {
      return;
    }

    await payrollRunLifecycleMutation.mutateAsync({
      payrollRunId: payrollRun.id,
      action,
    });
    setActionError(null);
  };

  const handleLineSubmit = async (values: PayrollRunLineFormValues) => {
    if (!payrollRun) {
      return;
    }

    const amountPayload = buildPayrollAmountPayload(values);

    await savePayrollRunLineMutation.mutateAsync(
      lineEditor
        ? {
            payrollRunId: payrollRun.id,
            payrollRunLineId: lineEditor.id,
            payload: amountPayload,
          }
        : {
            payrollRunId: payrollRun.id,
            payload: {
              employeeId: values.employeeId,
              ...amountPayload,
            },
          },
    );

    setActionError(null);
    setLinePanelOpen(false);
    setLineEditor(null);
  };

  const handlePostingSubmit = async (values: PayrollPostingFormValues) => {
    if (!payrollRun) {
      return;
    }

    await postPayrollRunMutation.mutateAsync({
      payrollRunId: payrollRun.id,
      payload: {
        voucherDate: values.voucherDate,
        expenseParticularAccountId: values.expenseParticularAccountId,
        payableParticularAccountId: values.payableParticularAccountId,
        deductionParticularAccountId:
          normalizeNullableId(values.deductionParticularAccountId),
      },
    });

    setActionError(null);
    setPostingPanelOpen(false);
  };

  return (
    <div className="space-y-6">
      <PayrollCorePageHeader
        title="Payroll Run Detail"
        description="Review payroll run scope, keep draft lines safe, finalize only when the run is ready, and post to accounting explicitly against the backend voucher contract."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={APP_ROUTES.payrollRuns}
          >
            Back to payroll runs
          </Link>
        }
      />

      {actionError ? <PayrollCoreQueryErrorBanner message={actionError} /> : null}

      {payrollRunQuery.isPending ? (
        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
          Loading payroll run detail.
        </div>
      ) : payrollRunQuery.isError && isApiError(payrollRunQuery.error) ? (
        <PayrollCoreQueryErrorBanner message={payrollRunQuery.error.apiError.message} />
      ) : payrollRun ? (
        <>
          <PayrollCoreSection
            title={formatPayrollPeriodLabel(
              payrollRun.payrollYear,
              payrollRun.payrollMonth,
            )}
            description="Draft payroll runs stay editable until finalized. Finalized runs can be cancelled or posted. Posted and cancelled runs are strongly protected in the UI."
            actions={
              <div className="flex flex-wrap gap-2">
                {isDraft ? (
                  <>
                    <Button
                      onClick={() => {
                        setActionError(null);
                        setEditRunPanelOpen(true);
                      }}
                      variant="outline"
                    >
                      Edit run
                    </Button>
                    <Button
                      disabled={
                        payrollRunLifecycleMutation.isPending ||
                        payrollRun.lineCount === 0
                      }
                      onClick={() => {
                        if (!window.confirm('Finalize this payroll run now?')) {
                          return;
                        }

                        void handleRunAction('finalize').catch((error) =>
                          handleActionError(error, 'Unable to finalize the payroll run.'),
                        );
                      }}
                    >
                      {payrollRunLifecycleMutation.isPending
                        ? 'Saving...'
                        : 'Finalize run'}
                    </Button>
                    <Button
                      disabled={payrollRunLifecycleMutation.isPending}
                      onClick={() => {
                        if (!window.confirm('Cancel this payroll run?')) {
                          return;
                        }

                        void handleRunAction('cancel').catch((error) =>
                          handleActionError(error, 'Unable to cancel the payroll run.'),
                        );
                      }}
                      variant="ghost"
                    >
                      Cancel run
                    </Button>
                  </>
                ) : null}
                {isFinalized ? (
                  <>
                    <Button
                      disabled={postPayrollRunMutation.isPending}
                      onClick={() => {
                        setActionError(null);
                        setPostingPanelOpen(true);
                      }}
                    >
                      Post to accounting
                    </Button>
                    <Button
                      disabled={payrollRunLifecycleMutation.isPending}
                      onClick={() => {
                        if (!window.confirm('Cancel this finalized payroll run?')) {
                          return;
                        }

                        void handleRunAction('cancel').catch((error) =>
                          handleActionError(error, 'Unable to cancel the payroll run.'),
                        );
                      }}
                      variant="ghost"
                    >
                      Cancel run
                    </Button>
                  </>
                ) : null}
                {isPosted && payrollRun.postedVoucherId && canAccessAccounting ? (
                  <Link
                    className={cn(buttonVariants({ variant: 'outline' }))}
                    href={getVoucherDetailRoute(payrollRun.postedVoucherId)}
                  >
                    Open voucher
                  </Link>
                ) : null}
              </div>
            }
          >
            <div className="flex flex-wrap gap-2">
              <PayrollRunStatusBadge status={payrollRun.status} />
            </div>

            {isPosted ? (
              <PayrollCoreReadOnlyNotice
                title="Posted payroll run"
                description="This payroll run is already linked to accounting. Scope edits and payroll line mutations are protected in the UI."
              />
            ) : payrollRun.status === 'CANCELLED' ? (
              <PayrollCoreReadOnlyNotice
                title="Cancelled payroll run"
                description="Cancelled payroll runs are preserved for visibility only in this phase."
              />
            ) : payrollRun.status === 'FINALIZED' ? (
              <PayrollCoreReadOnlyNotice
                title="Finalized for posting"
                description="Payroll lines and scope are now locked. Review totals and post explicitly to accounting when ready."
              />
            ) : null}

            <PayrollRunDetailSummary payrollRun={payrollRun} />

            <KeyValueList
              items={[
                {
                  label: 'Line count',
                  value: String(payrollRun.lineCount),
                },
                {
                  label: 'Total basic',
                  value: formatAccountingAmount(payrollRun.totalBasicAmount),
                },
                {
                  label: 'Total allowance',
                  value: formatAccountingAmount(payrollRun.totalAllowanceAmount),
                },
                {
                  label: 'Total deduction',
                  value: formatAccountingAmount(payrollRun.totalDeductionAmount),
                },
                {
                  label: 'Total net',
                  value: formatAccountingAmount(payrollRun.totalNetAmount),
                },
                {
                  label: 'Last updated',
                  value: formatDateTime(payrollRun.updatedAt),
                },
              ]}
            />
          </PayrollCoreSection>

          <PayrollCoreSection
            title="Payroll run lines"
            description="Manage employee payroll lines while the run stays in draft. Net amount remains visible and derived from gross less deductions."
            actions={
              isDraft ? (
                <Button
                  onClick={() => {
                    setActionError(null);
                    setLineEditor(null);
                    setLinePanelOpen(true);
                  }}
                >
                  Add payroll line
                </Button>
              ) : null
            }
          >
            {!isDraft ? (
              <PayrollCoreReadOnlyNotice
                title="Line editing locked"
                description="Payroll run lines can only be created, updated, or removed while the payroll run stays in draft."
              />
            ) : null}

            <PayrollCoreFilterCard>
              <div className="space-y-2 xl:col-span-3">
                <Label htmlFor="payroll-run-line-search">Search</Label>
                <Input
                  id="payroll-run-line-search"
                  onChange={(event) => setLineSearch(event.target.value)}
                  placeholder="Search lines by employee, department, or location"
                  value={lineSearch}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payroll-run-line-employee-filter">Employee</Label>
                <Select
                  id="payroll-run-line-employee-filter"
                  onChange={(event) => setEmployeeFilter(event.target.value)}
                  value={employeeFilter}
                >
                  <option value="">All employees</option>
                  {employeesQuery.data?.items.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {getEmployeeLabel(employee)}
                    </option>
                  ))}
                </Select>
              </div>
            </PayrollCoreFilterCard>

            {payrollRunLinesQuery.isError && isApiError(payrollRunLinesQuery.error) ? (
              <PayrollCoreQueryErrorBanner
                message={payrollRunLinesQuery.error.apiError.message}
              />
            ) : null}

            {payrollRunLinesQuery.isPending ? (
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
                Loading payroll run lines.
              </div>
            ) : payrollRunLinesQuery.data &&
              payrollRunLinesQuery.data.items.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department / Location</TableHead>
                      <TableHead>Basic</TableHead>
                      <TableHead>Allowance</TableHead>
                      <TableHead>Deduction</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRunLinesQuery.data.items.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground">
                              {line.employeeCode}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {line.employeeFullName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>{line.departmentName || 'No department'}</p>
                            <p className="text-muted-foreground">
                              {line.locationName || 'No location'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatAccountingAmount(line.basicAmount)}</TableCell>
                        <TableCell>
                          {formatAccountingAmount(line.allowanceAmount)}
                        </TableCell>
                        <TableCell>
                          {formatAccountingAmount(line.deductionAmount)}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-foreground">
                            {formatAccountingAmount(line.netAmount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isDraft ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() => {
                                  setActionError(null);
                                  setLineEditor(line);
                                  setLinePanelOpen(true);
                                }}
                                size="sm"
                                variant="outline"
                              >
                                Edit
                              </Button>
                              <Button
                                disabled={removePayrollRunLineMutation.isPending}
                                onClick={() => {
                                  if (!window.confirm('Remove this payroll line?')) {
                                    return;
                                  }

                                  void removePayrollRunLineMutation
                                    .mutateAsync({
                                      payrollRunId: payrollRun.id,
                                      payrollRunLineId: line.id,
                                    })
                                    .then(() => setActionError(null))
                                    .catch((error) =>
                                      handleActionError(
                                        error,
                                        'Unable to remove the payroll line.',
                                      ),
                                    );
                                }}
                                size="sm"
                                variant="ghost"
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Read-only
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControls
                  meta={payrollRunLinesQuery.data.meta}
                  onPageChange={setLinePage}
                />
              </>
            ) : (
              <EmptyState
                title="No payroll lines found"
                description="Add the first payroll line for this run or adjust the current filters to review existing employee entries."
              />
            )}
          </PayrollCoreSection>
        </>
      ) : null}

      <SidePanel
        description="Update the payroll run period, project, cost center, or description while the run remains in draft."
        onClose={() => setEditRunPanelOpen(false)}
        open={editRunPanelOpen}
        title="Edit payroll run"
      >
        {payrollRun ? (
          <PayrollRunFormPanel
            costCenters={costCentersQuery.data?.items ?? []}
            isPending={savePayrollRunMutation.isPending}
            onClose={() => setEditRunPanelOpen(false)}
            onSubmit={(values) =>
              savePayrollRunMutation
                .mutateAsync({
                  payrollRunId: payrollRun.id,
                  payload: buildRunPayload(values),
                })
                .then(() => {
                  setActionError(null);
                  setEditRunPanelOpen(false);
                })
            }
            payrollRun={payrollRun}
            projects={projectsQuery.data?.items ?? []}
          />
        ) : null}
      </SidePanel>

      <SidePanel
        description="Create or update a payroll line for a single employee. The employee stays fixed after creation."
        onClose={() => {
          setLinePanelOpen(false);
          setLineEditor(null);
        }}
        open={linePanelOpen}
        title={lineEditor ? 'Edit payroll line' : 'Add payroll line'}
      >
        <PayrollRunLineFormPanel
          employees={employeesQuery.data?.items ?? []}
          isPending={savePayrollRunLineMutation.isPending}
          onClose={() => {
            setLinePanelOpen(false);
            setLineEditor(null);
          }}
          onSubmit={handleLineSubmit}
          payrollRunLine={lineEditor}
        />
      </SidePanel>

      <SidePanel
        description="Select the posting accounts required by the current backend payroll posting contract."
        onClose={() => setPostingPanelOpen(false)}
        open={postingPanelOpen}
        title="Post payroll to accounting"
      >
        {payrollRun ? (
          <PayrollPostingFormPanel
            isPending={postPayrollRunMutation.isPending}
            onClose={() => setPostingPanelOpen(false)}
            onSubmit={handlePostingSubmit}
            particularAccounts={particularAccountsQuery.data?.items ?? []}
            payrollRun={payrollRun}
          />
        ) : null}
        {particularAccountsQuery.isError && isApiError(particularAccountsQuery.error) ? (
          <div className="mt-5">
            <PayrollCoreQueryErrorBanner
              message={particularAccountsQuery.error.apiError.message}
            />
          </div>
        ) : null}
      </SidePanel>
    </div>
  );
};
