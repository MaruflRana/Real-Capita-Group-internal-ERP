'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { buttonVariants, cn } from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { Select } from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import {
  ACCOUNTING_VOUCHER_STATUSES,
  ACCOUNTING_VOUCHER_TYPES,
} from '../../lib/api/types';
import {
  formatAccountingAmount,
  formatDate,
  formatDateTime,
} from '../../lib/format';
import {
  APP_ROUTES,
  getVoucherDetailRoute,
} from '../../lib/routes';
import { useVouchers } from './hooks';
import {
  AccountingAccessRequiredState,
  AccountingPageHeader,
  AccountingQueryErrorBanner,
  VoucherStatusBadge,
} from './shared';
import { formatVoucherTypeLabel } from './utils';

const PAGE_SIZE = 10;

export const VouchersPage = () => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const accountingEnabled = canAccessAccounting && Boolean(companyId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [voucherType, setVoucherType] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const deferredSearch = useDeferredValue(search);

  const query = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'voucherDate',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(voucherType !== 'all'
        ? { voucherType: voucherType as (typeof ACCOUNTING_VOUCHER_TYPES)[number] }
        : {}),
      ...(status !== 'all'
        ? { status: status as (typeof ACCOUNTING_VOUCHER_STATUSES)[number] }
        : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [dateFrom, dateTo, deferredSearch, page, status, voucherType],
  );

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, deferredSearch, status, voucherType]);

  const vouchersQuery = useVouchers(companyId, query, accountingEnabled);

  if (!user) {
    return null;
  }

  if (!canAccessAccounting) {
    return <AccountingAccessRequiredState />;
  }

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="Vouchers"
        description="Review draft and posted vouchers, filter by date and status, and enter the draft workflow for voucher creation or explicit posting."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <Link
            className={cn(buttonVariants())}
            href={APP_ROUTES.accountingVoucherCreate}
          >
            Create voucher
          </Link>
        }
      />

      <div className="grid gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 lg:grid-cols-[1fr_180px_180px_180px_180px]">
        <div className="space-y-2">
          <Label htmlFor="voucher-search">Search</Label>
          <Input
            id="voucher-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search description or reference"
            value={search}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucher-type-filter">Voucher type</Label>
          <Select
            id="voucher-type-filter"
            onChange={(event) => setVoucherType(event.target.value)}
            value={voucherType}
          >
            <option value="all">All types</option>
            {ACCOUNTING_VOUCHER_TYPES.map((item) => (
              <option key={item} value={item}>
                {formatVoucherTypeLabel(item)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucher-status-filter">Status</Label>
          <Select
            id="voucher-status-filter"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">All statuses</option>
            {ACCOUNTING_VOUCHER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucher-date-from">Date from</Label>
          <Input
            id="voucher-date-from"
            onChange={(event) => setDateFrom(event.target.value)}
            type="date"
            value={dateFrom}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucher-date-to">Date to</Label>
          <Input
            id="voucher-date-to"
            onChange={(event) => setDateTo(event.target.value)}
            type="date"
            value={dateTo}
          />
        </div>
      </div>

      {vouchersQuery.isError && isApiError(vouchersQuery.error) ? (
        <AccountingQueryErrorBanner
          message={vouchersQuery.error.apiError.message}
        />
      ) : null}

      {vouchersQuery.isPending ? (
        <div className="rounded-3xl border border-border/70 bg-card/80 px-6 py-8 text-sm text-muted-foreground">
          Loading vouchers.
        </div>
      ) : vouchersQuery.data && vouchersQuery.data.items.length > 0 ? (
        <div className="rounded-3xl border border-border/70 bg-card/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference / Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Totals</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[140px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchersQuery.data.items.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell>{formatDate(voucher.voucherDate)}</TableCell>
                  <TableCell>{formatVoucherTypeLabel(voucher.voucherType)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-foreground">
                        {voucher.reference || 'No reference'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {voucher.description || 'No description'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <VoucherStatusBadge status={voucher.status} />
                  </TableCell>
                  <TableCell>{voucher.lineCount}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <p>Dr {formatAccountingAmount(voucher.totalDebit)}</p>
                      <p>Cr {formatAccountingAmount(voucher.totalCredit)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(voucher.updatedAt)}</TableCell>
                  <TableCell>
                    <Link
                      className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                      href={getVoucherDetailRoute(voucher.id)}
                    >
                      {voucher.status === 'DRAFT' ? 'Open draft' : 'View'}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            meta={vouchersQuery.data.meta}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title="No vouchers found"
          description="Create a draft voucher or adjust the current filters to review accounting activity in this company scope."
          action={
            <Link
              className={cn(buttonVariants())}
              href={APP_ROUTES.accountingVoucherCreate}
            >
              Create voucher
            </Link>
          }
        />
      )}
    </div>
  );
};
