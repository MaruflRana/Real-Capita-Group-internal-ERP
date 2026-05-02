'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { OutputActionGroup } from '../../components/ui/output-actions';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { Select } from '../../components/ui/select';
import { SidePanel } from '../../components/ui/side-panel';
import { CrmAnalyticsPanel } from '../analytics/module-panels';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import { listCollections } from '../../lib/api/crm-property-desk';
import type { CollectionRecord } from '../../lib/api/types';
import { formatAccountingAmount, formatDate, formatDateTime } from '../../lib/format';
import {
  buildExportFileName,
  exportPaginatedCsv,
  getExportDateStamp,
} from '../../lib/output';
import {
  CollectionCreatePanel,
  CollectionDetailPanel,
  type CollectionCreateFormValues,
} from './forms';
import {
  useCollection,
  useCollections,
  useCrmPostedVouchers,
  useCustomers,
  useInstallmentSchedules,
  useBookings,
  useSaleContracts,
  useSaveCollection,
} from './hooks';
import {
  CrmPropertyDeskAccessRequiredState,
  CrmPropertyDeskFilterCard,
  CrmPropertyDeskPageHeader,
  CrmPropertyDeskQueryErrorBanner,
  CrmPropertyDeskSection,
} from './shared';
import {
  normalizeNullableId,
  normalizeOptionalTextToNull,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const CollectionsPage = () => {
  const { canAccessCrmPropertyDesk, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessCrmPropertyDesk && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [saleContractFilter, setSaleContractFilter] = useState('all');
  const [installmentFilter, setInstallmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<CollectionRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const customersQuery = useCustomers(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'fullName',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const bookingsQuery = useBookings(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'bookingDate',
      sortOrder: 'desc',
    },
    isEnabled,
  );
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
  const schedulesQuery = useInstallmentSchedules(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'dueDate',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const vouchersQuery = useCrmPostedVouchers(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'voucherDate',
      sortOrder: 'desc',
    },
    isEnabled,
  );

  const query = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'collectionDate',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(customerFilter !== 'all' ? { customerId: customerFilter } : {}),
      ...(bookingFilter !== 'all' ? { bookingId: bookingFilter } : {}),
      ...(saleContractFilter !== 'all' ? { saleContractId: saleContractFilter } : {}),
      ...(installmentFilter !== 'all' ? { installmentScheduleId: installmentFilter } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [
      bookingFilter,
      customerFilter,
      dateFrom,
      dateTo,
      deferredSearch,
      installmentFilter,
      page,
      saleContractFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [
    bookingFilter,
    customerFilter,
    dateFrom,
    dateTo,
    deferredSearch,
    installmentFilter,
    saleContractFilter,
  ]);

  const collectionsQuery = useCollections(companyId, query, isEnabled);
  const collectionDetailQuery = useCollection(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveCollectionMutation = useSaveCollection(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessCrmPropertyDesk) {
    return <CrmPropertyDeskAccessRequiredState />;
  }

  const customers = customersQuery.data?.items ?? [];
  const bookings = bookingsQuery.data?.items ?? [];
  const saleContracts = saleContractsQuery.data?.items ?? [];
  const schedules = schedulesQuery.data?.items ?? [];
  const vouchers = vouchersQuery.data?.items ?? [];
  const collectionForDetail = collectionDetailQuery.data ?? editor;

  const buildPayload = (values: CollectionCreateFormValues) => ({
    customerId: values.customerId,
    voucherId: values.voucherId,
    bookingId: normalizeNullableId(values.bookingId),
    saleContractId: normalizeNullableId(values.saleContractId),
    installmentScheduleId: normalizeNullableId(values.installmentScheduleId),
    collectionDate: values.collectionDate,
    amount: values.amount,
    reference: normalizeOptionalTextToNull(values.reference),
    notes: normalizeOptionalTextToNull(values.notes),
  });

  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));
  const saleContractMap = new Map(
    saleContracts.map((saleContract) => [saleContract.id, saleContract]),
  );
  const scheduleMap = new Map(schedules.map((schedule) => [schedule.id, schedule]));
  const voucherMap = new Map(vouchers.map((voucher) => [voucher.id, voucher]));

  const handleExport = async () => {
    if (!companyId) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      await exportPaginatedCsv({
        columns: [
          {
            header: 'Collection ID',
            value: (collection) => collection.id,
          },
          {
            header: 'Customer Name',
            value: (collection) => collection.customerName,
          },
          {
            header: 'Booking ID',
            value: (collection) => collection.bookingId ?? '',
          },
          {
            header: 'Sale Contract ID',
            value: (collection) => collection.saleContractId ?? '',
          },
          {
            header: 'Installment Schedule ID',
            value: (collection) => collection.installmentScheduleId ?? '',
          },
          {
            header: 'Voucher ID',
            value: (collection) => collection.voucherId,
          },
          {
            header: 'Voucher Reference',
            value: (collection) => collection.voucherReference ?? '',
          },
          {
            header: 'Voucher Status',
            value: (collection) => collection.voucherStatus,
          },
          {
            header: 'Voucher Date',
            value: (collection) => collection.voucherDate,
          },
          {
            header: 'Amount',
            value: (collection) => collection.amount,
          },
          {
            header: 'Collection Date',
            value: (collection) => collection.collectionDate,
          },
          {
            header: 'Reference',
            value: (collection) => collection.reference ?? '',
          },
          {
            header: 'Updated At',
            value: (collection) => collection.updatedAt,
          },
        ],
        companyId,
        fileName: buildExportFileName([
          user.currentCompany.slug,
          'collections',
          'export',
          getExportDateStamp(),
        ]),
        listFn: listCollections,
        query,
      });
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the collection register.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <CrmPropertyDeskPageHeader
        title="Collections"
        description="Create collections against real posted vouchers and keep booking, contract, and installment linkage visible and explicit."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <div className="flex flex-wrap gap-2">
            <OutputActionGroup
              isExporting={isExporting}
              onExport={() => void handleExport()}
            />
            <Button
              onClick={() => {
                setActionError(null);
                setEditor(null);
                setPanelOpen(true);
              }}
            >
              New collection
            </Button>
          </div>
        }
      />

      {actionError ? <CrmPropertyDeskQueryErrorBanner message={actionError} /> : null}
      {exportError ? <CrmPropertyDeskQueryErrorBanner message={exportError} /> : null}

      <CrmAnalyticsPanel
        companyId={companyId}
        companySlug={user.currentCompany.slug}
        enabled={isEnabled}
        period={
          dateFrom && dateTo
            ? {
                dateFrom,
                dateTo,
              }
            : undefined
        }
      />

      <CrmPropertyDeskSection
        title="Collection register"
        description="Filter the collection register by customer and linked commercial documents. Voucher linkage is surfaced directly in the table and detail panel."
      >
        <CrmPropertyDeskFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="collection-search">Search</Label>
            <Input
              id="collection-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer, voucher reference, collection reference, or notes"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-customer-filter">Customer</Label>
            <Select
              id="collection-customer-filter"
              onChange={(event) => setCustomerFilter(event.target.value)}
              value={customerFilter}
            >
              <option value="all">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-booking-filter">Booking</Label>
            <Select
              id="collection-booking-filter"
              onChange={(event) => setBookingFilter(event.target.value)}
              value={bookingFilter}
            >
              <option value="all">All bookings</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.unitCode} - {booking.customerName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-contract-filter">Sale contract</Label>
            <Select
              id="collection-contract-filter"
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
            <Label htmlFor="collection-installment-filter">Installment</Label>
            <Select
              id="collection-installment-filter"
              onChange={(event) => setInstallmentFilter(event.target.value)}
              value={installmentFilter}
            >
              <option value="all">All installments</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  #{schedule.sequenceNumber} - {schedule.unitCode}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-date-from">Date from</Label>
            <Input
              id="collection-date-from"
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-date-to">Date to</Label>
            <Input
              id="collection-date-to"
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </div>
        </CrmPropertyDeskFilterCard>

        {collectionsQuery.isError && isApiError(collectionsQuery.error) ? (
          <CrmPropertyDeskQueryErrorBanner
            message={collectionsQuery.error.apiError.message}
          />
        ) : null}

        {collectionsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading collections.
          </div>
        ) : collectionsQuery.data && collectionsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Linked context</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionsQuery.data.items.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      <p className="font-semibold text-foreground">
                        {collection.customerName}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>
                          {collection.bookingId
                            ? bookingMap.get(collection.bookingId)?.unitCode || collection.bookingId
                            : 'No booking'}
                        </p>
                        <p className="text-muted-foreground">
                          {collection.saleContractId
                            ? saleContractMap.get(collection.saleContractId)?.unitCode || collection.saleContractId
                            : 'No contract'}
                        </p>
                        <p className="text-muted-foreground">
                          {collection.installmentScheduleId
                            ? `#${scheduleMap.get(collection.installmentScheduleId)?.sequenceNumber ?? collection.installmentScheduleId}`
                            : 'No installment'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{collection.voucherReference || collection.voucherId}</p>
                        <p className="text-muted-foreground">
                          {collection.voucherStatus} - {formatDate(collection.voucherDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{formatAccountingAmount(collection.amount)}</p>
                        <p className="text-muted-foreground">
                          {formatDate(collection.collectionDate)}
                        </p>
                        <p className="text-muted-foreground">
                          {collection.reference || 'No reference'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(collection.updatedAt)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setActionError(null);
                          setEditor(collection);
                          setPanelOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={collectionsQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No collections found"
            description="Create the first collection or adjust the current filters to inspect linked receipts."
          />
        )}
      </CrmPropertyDeskSection>

      <SidePanel
        description={
          editor
            ? 'Review linked booking, contract, installment, and voucher context for the selected collection.'
            : 'Create a collection using a posted voucher and optional booking, contract, and installment linkage.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Collection detail' : 'Create collection'}
      >
        {editor && collectionForDetail ? (
          <CollectionDetailPanel
            booking={
              collectionForDetail.bookingId
                ? bookingMap.get(collectionForDetail.bookingId) ?? null
                : null
            }
            collection={collectionForDetail}
            onClose={() => {
              setPanelOpen(false);
              setEditor(null);
            }}
            saleContract={
              collectionForDetail.saleContractId
                ? saleContractMap.get(collectionForDetail.saleContractId) ?? null
                : null
            }
            schedule={
              collectionForDetail.installmentScheduleId
                ? scheduleMap.get(collectionForDetail.installmentScheduleId) ?? null
                : null
            }
            voucher={voucherMap.get(collectionForDetail.voucherId) ?? null}
          />
        ) : (
          <CollectionCreatePanel
            bookings={bookings}
            customers={customers}
            isPending={saveCollectionMutation.isPending}
            onClose={() => {
              setPanelOpen(false);
              setEditor(null);
            }}
            onSubmit={(values) =>
              saveCollectionMutation
                .mutateAsync(buildPayload(values))
                .then(() => {
                  setActionError(null);
                  setPanelOpen(false);
                })
            }
            saleContracts={saleContracts}
            schedules={schedules}
            vouchers={vouchers}
          />
        )}
      </SidePanel>
    </div>
  );
};
