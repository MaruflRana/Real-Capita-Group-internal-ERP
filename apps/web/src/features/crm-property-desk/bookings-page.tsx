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
import {
  PROPERTY_DESK_BOOKING_STATUSES,
  type BookingRecord,
} from '../../lib/api/types';
import { formatAccountingAmount, formatDate, formatDateTime } from '../../lib/format';
import {
  BookingCreatePanel,
  BookingEditPanel,
  type BookingCreateFormValues,
  type BookingEditFormValues,
} from './forms';
import {
  useBooking,
  useBookings,
  useCrmProjects,
  useCrmUnits,
  useCustomers,
  useSaveBooking,
} from './hooks';
import {
  BookingStatusBadge,
  CrmPropertyDeskAccessRequiredState,
  CrmPropertyDeskFilterCard,
  CrmPropertyDeskPageHeader,
  CrmPropertyDeskQueryErrorBanner,
  CrmPropertyDeskSection,
} from './shared';
import {
  getProjectLabel,
  getUnitLabel,
  normalizeOptionalTextToNull,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const BookingsPage = () => {
  const { canAccessCrmPropertyDesk, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessCrmPropertyDesk && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<BookingRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
  const projectsQuery = useCrmProjects(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const unitsQuery = useCrmUnits(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      isActive: true,
    },
    isEnabled,
  );

  const availableUnitFilters = (unitsQuery.data?.items ?? []).filter((unit) =>
    projectFilter === 'all' ? true : unit.projectId === projectFilter,
  );

  useEffect(() => {
    if (
      unitFilter !== 'all' &&
      !availableUnitFilters.some((unit) => unit.id === unitFilter)
    ) {
      setUnitFilter('all');
    }
  }, [availableUnitFilters, unitFilter]);

  const query = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'bookingDate',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(customerFilter !== 'all' ? { customerId: customerFilter } : {}),
      ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
      ...(unitFilter !== 'all' ? { unitId: unitFilter } : {}),
      ...(bookingStatusFilter !== 'all'
        ? {
            status:
              bookingStatusFilter as (typeof PROPERTY_DESK_BOOKING_STATUSES)[number],
          }
        : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [
      bookingStatusFilter,
      customerFilter,
      dateFrom,
      dateTo,
      deferredSearch,
      page,
      projectFilter,
      unitFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [
    bookingStatusFilter,
    customerFilter,
    dateFrom,
    dateTo,
    deferredSearch,
    projectFilter,
    unitFilter,
  ]);

  const bookingsQuery = useBookings(companyId, query, isEnabled);
  const bookingDetailQuery = useBooking(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveBookingMutation = useSaveBooking(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessCrmPropertyDesk) {
    return <CrmPropertyDeskAccessRequiredState />;
  }

  const customers = customersQuery.data?.items ?? [];
  const projects = projectsQuery.data?.items ?? [];
  const units = unitsQuery.data?.items ?? [];
  const bookingForEdit = bookingDetailQuery.data ?? editor;

  const buildCreatePayload = (values: BookingCreateFormValues) => ({
    customerId: values.customerId,
    unitId: values.unitId,
    bookingDate: values.bookingDate,
    bookingAmount: values.bookingAmount,
    notes: normalizeOptionalTextToNull(values.notes),
  });

  const buildUpdatePayload = (values: BookingEditFormValues) => ({
    notes: normalizeOptionalTextToNull(values.notes),
  });

  return (
    <div className="space-y-6">
      <CrmPropertyDeskPageHeader
        title="Bookings"
        description="Operate the core booking workflow with company-scoped customer and unit linkage, visible project context, and safe metadata edits only."
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
            New booking
          </Button>
        }
      />

      {actionError ? <CrmPropertyDeskQueryErrorBanner message={actionError} /> : null}

      <CrmPropertyDeskSection
        title="Booking operations"
        description="Use the filters to narrow the working set, then create bookings from active customers and allocatable units. Existing bookings allow only safe notes updates in this phase."
      >
        <CrmPropertyDeskFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="booking-search">Search</Label>
            <Input
              id="booking-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer, project, unit, or notes"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-customer-filter">Customer</Label>
            <Select
              id="booking-customer-filter"
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
            <Label htmlFor="booking-project-filter">Project</Label>
            <Select
              id="booking-project-filter"
              onChange={(event) => setProjectFilter(event.target.value)}
              value={projectFilter}
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {getProjectLabel(project)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-unit-filter">Unit</Label>
            <Select
              disabled={projectFilter === 'all'}
              id="booking-unit-filter"
              onChange={(event) => setUnitFilter(event.target.value)}
              value={unitFilter}
            >
              <option value="all">All units</option>
              {availableUnitFilters.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {getUnitLabel(unit)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-status-filter">Booking status</Label>
            <Select
              id="booking-status-filter"
              onChange={(event) => setBookingStatusFilter(event.target.value)}
              value={bookingStatusFilter}
            >
              <option value="all">All statuses</option>
              {PROPERTY_DESK_BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-date-from-filter">Date from</Label>
            <Input
              id="booking-date-from-filter"
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-date-to-filter">Date to</Label>
            <Input
              id="booking-date-to-filter"
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </div>
        </CrmPropertyDeskFilterCard>

        {bookingsQuery.isError && isApiError(bookingsQuery.error) ? (
          <CrmPropertyDeskQueryErrorBanner
            message={bookingsQuery.error.apiError.message}
          />
        ) : null}

        {bookingsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading bookings.
          </div>
        ) : bookingsQuery.data && bookingsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Project / Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsQuery.data.items.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {booking.customerName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {booking.customerEmail || booking.customerPhone || 'No contact detail'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {booking.projectName}
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {booking.projectCode} / {booking.unitCode}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {booking.unitName} - {booking.unitStatusName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{formatAccountingAmount(booking.bookingAmount)}</p>
                        <p className="text-muted-foreground">
                          {formatDate(booking.bookingDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.saleContractId ? (
                        <span className="text-sm text-foreground">Contract created</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Awaiting contract
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(booking.updatedAt)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setActionError(null);
                          setEditor(booking);
                          setPanelOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        View / Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={bookingsQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No bookings found"
            description="Create the first booking or adjust the current filters to inspect booking activity."
          />
        )}
      </CrmPropertyDeskSection>

      <SidePanel
        description={
          editor
            ? 'Review booking detail and update only the safe notes field exposed by the backend in this phase.'
            : 'Create a booking by selecting an active customer, project, and allocatable unit.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Booking detail' : 'Create booking'}
      >
        {editor && bookingForEdit ? (
          <BookingEditPanel
            booking={bookingForEdit}
            isPending={saveBookingMutation.isPending}
            onClose={() => {
              setPanelOpen(false);
              setEditor(null);
            }}
            onSubmit={(values) =>
              saveBookingMutation
                .mutateAsync({
                  bookingId: editor.id,
                  payload: buildUpdatePayload(values),
                })
                .then(() => {
                  setActionError(null);
                  setPanelOpen(false);
                  setEditor(null);
                })
            }
          />
        ) : (
          <BookingCreatePanel
            customers={customers}
            isPending={saveBookingMutation.isPending}
            onClose={() => {
              setPanelOpen(false);
              setEditor(null);
            }}
            onSubmit={(values) =>
              saveBookingMutation
                .mutateAsync({
                  payload: buildCreatePayload(values),
                })
                .then(() => {
                  setActionError(null);
                  setPanelOpen(false);
                })
            }
            projects={projects}
            units={units}
          />
        )}
      </SidePanel>
    </div>
  );
};
