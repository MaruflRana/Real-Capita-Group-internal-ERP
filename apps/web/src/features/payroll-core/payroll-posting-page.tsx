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
import { PayrollAnalyticsPanel } from '../analytics/module-panels';
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
import { getPayrollRunDetailRoute, getVoucherDetailRoute } from '../../lib/routes';
import type {
  PayrollRunStatus,
} from '../../lib/api/types';
import {
  PayrollPostingFormPanel,
  type PayrollPostingFormValues,
} from './forms';
import {
  usePayrollParticularAccounts,
  usePayrollRuns,
  usePostPayrollRun,
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
  getPayrollRunScopeLabel,
  getPayrollVoucherReference,
  normalizeNullableId,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const PayrollPostingPage = () => {
  const { canAccessAccounting, canAccessPayroll, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessPayroll && Boolean(companyId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | ''>('FINALIZED');
  const [postingRunId, setPostingRunId] = useState('');
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
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [deferredSearch, monthFilter, page, statusFilter, yearFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, monthFilter, statusFilter, yearFilter]);

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

  const payrollRunsQuery = usePayrollRuns(companyId, listQuery, isEnabled);
  const particularAccountsQuery = usePayrollParticularAccounts(
    companyId,
    accountReferenceQuery,
    isEnabled && postingRunId.length > 0,
  );
  const postPayrollRunMutation = usePostPayrollRun(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessPayroll) {
    return <PayrollCoreAccessRequiredState />;
  }

  const selectedPayrollRun =
    payrollRunsQuery.data?.items.find((payrollRun) => payrollRun.id === postingRunId) ??
    null;

  const handlePostingSubmit = async (values: PayrollPostingFormValues) => {
    if (!selectedPayrollRun) {
      return;
    }

    await postPayrollRunMutation.mutateAsync({
      payrollRunId: selectedPayrollRun.id,
      payload: {
        voucherDate: values.voucherDate,
        expenseParticularAccountId: values.expenseParticularAccountId,
        payableParticularAccountId: values.payableParticularAccountId,
        deductionParticularAccountId:
          normalizeNullableId(values.deductionParticularAccountId),
      },
    });

    setActionError(null);
    setPostingRunId('');
  };

  return (
    <div className="space-y-6">
      <PayrollCorePageHeader
        title="Payroll Posting"
        description="Review finalized payroll runs, choose the required posting accounts, and create the accounting voucher explicitly when the payroll totals are ready."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
      />

      {actionError ? <PayrollCoreQueryErrorBanner message={actionError} /> : null}

      <PayrollAnalyticsPanel
        companyId={companyId}
        companySlug={user.currentCompany.slug}
        enabled={isEnabled}
      />

      <PayrollCoreSection
        title="Posting workspace"
        description="This workspace keeps payroll-to-accounting linkage understandable: finalized runs can be posted, posted runs show voucher linkage, and reposting stays blocked."
      >
        <PayrollCoreFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="payroll-posting-search">Search</Label>
            <Input
              id="payroll-posting-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by payroll description, scope, or voucher reference"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payroll-posting-year-filter">Year</Label>
            <Input
              id="payroll-posting-year-filter"
              inputMode="numeric"
              onChange={(event) => setYearFilter(event.target.value)}
              placeholder="YYYY"
              value={yearFilter}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payroll-posting-month-filter">Month</Label>
            <Select
              id="payroll-posting-month-filter"
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
            <Label htmlFor="payroll-posting-status-filter">Status</Label>
            <Select
              id="payroll-posting-status-filter"
              onChange={(event) =>
                setStatusFilter(event.target.value as PayrollRunStatus | '')
              }
              value={statusFilter}
            >
              <option value="">All statuses</option>
              <option value="FINALIZED">Finalized</option>
              <option value="POSTED">Posted</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
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
            Loading payroll posting workspace.
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
                  <TableHead>Voucher linkage</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
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
                          Net {formatAccountingAmount(payrollRun.totalNetAmount)}
                        </p>
                        <p className="text-muted-foreground">
                          Deduction{' '}
                          {formatAccountingAmount(payrollRun.totalDeductionAmount)}
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
                          Open run
                        </Link>
                        {payrollRun.status === 'FINALIZED' ? (
                          <Button
                            onClick={() => {
                              setActionError(null);
                              setPostingRunId(payrollRun.id);
                            }}
                            size="sm"
                          >
                            Post
                          </Button>
                        ) : null}
                        {payrollRun.status === 'POSTED' &&
                        payrollRun.postedVoucherId &&
                        canAccessAccounting ? (
                          <Link
                            className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}
                            href={getVoucherDetailRoute(payrollRun.postedVoucherId)}
                          >
                            Voucher
                          </Link>
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
            title="No payroll runs available for posting"
            description="Finalize a payroll run first or adjust the current filters to review already-posted payroll periods."
          />
        )}
      </PayrollCoreSection>

      <SidePanel
        description="Choose the posting accounts required by the backend and confirm the voucher date before posting."
        onClose={() => setPostingRunId('')}
        open={postingRunId.length > 0}
        title="Post payroll run"
      >
        {selectedPayrollRun ? (
          <PayrollPostingFormPanel
            isPending={postPayrollRunMutation.isPending}
            onClose={() => setPostingRunId('')}
            onSubmit={handlePostingSubmit}
            particularAccounts={particularAccountsQuery.data?.items ?? []}
            payrollRun={selectedPayrollRun}
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
