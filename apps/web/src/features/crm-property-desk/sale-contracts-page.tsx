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
import type { SaleContractRecord } from '../../lib/api/types';
import { formatAccountingAmount, formatDate, formatDateTime } from '../../lib/format';
import {
  SaleContractCreatePanel,
  SaleContractEditPanel,
  type SaleContractCreateFormValues,
  type SaleContractEditFormValues,
} from './forms';
import {
  useBookings,
  useCrmProjects,
  useCrmUnits,
  useCustomers,
  useSaleContract,
  useSaleContracts,
  useSaveSaleContract,
} from './hooks';
import {
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

export const SaleContractsPage = () => {
  const { canAccessCrmPropertyDesk, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessCrmPropertyDesk && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<SaleContractRecord | null>(null);
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
  const bookingOptionsQuery = useBookings(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'bookingDate',
      sortOrder: 'desc',
      status: 'ACTIVE',
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
      sortBy: 'contractDate',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(customerFilter !== 'all' ? { customerId: customerFilter } : {}),
      ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
      ...(unitFilter !== 'all' ? { unitId: unitFilter } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [customerFilter, dateFrom, dateTo, deferredSearch, page, projectFilter, unitFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [customerFilter, dateFrom, dateTo, deferredSearch, projectFilter, unitFilter]);

  const saleContractsQuery = useSaleContracts(companyId, query, isEnabled);
  const saleContractDetailQuery = useSaleContract(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveSaleContractMutation = useSaveSaleContract(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessCrmPropertyDesk) {
    return <CrmPropertyDeskAccessRequiredState />;
  }

  const customers = customersQuery.data?.items ?? [];
  const projects = projectsQuery.data?.items ?? [];
  const eligibleBookings =
    bookingOptionsQuery.data?.items.filter((booking) => !booking.saleContractId) ?? [];
  const saleContractForEdit = saleContractDetailQuery.data ?? editor;

  const buildCreatePayload = (values: SaleContractCreateFormValues) => ({
    bookingId: values.bookingId,
    contractDate: values.contractDate,
    contractAmount: values.contractAmount,
    reference: normalizeOptionalTextToNull(values.reference),
    notes: normalizeOptionalTextToNull(values.notes),
  });

  const buildUpdatePayload = (values: SaleContractEditFormValues) => ({
    reference: normalizeOptionalTextToNull(values.reference),
    notes: normalizeOptionalTextToNull(values.notes),
  });

  return (
    <div className="space-y-6">
      <CrmPropertyDeskPageHeader
        title="Sale Contracts"
        description="Create sale contracts from valid bookings, surface the linked customer and unit context, and keep the edit scope limited to safe metadata."
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
            New contract
          </Button>
        }
      />

      {actionError ? <CrmPropertyDeskQueryErrorBanner message={actionError} /> : null}

      <CrmPropertyDeskSection
        title="Contract operations"
        description="Contracts must be created from existing eligible bookings. Use the filters to inspect the contract register or open the side panel for creation and safe metadata edits."
      >
        <CrmPropertyDeskFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="sale-contract-search">Search</Label>
            <Input
              id="sale-contract-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer, unit, reference, or notes"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale-contract-customer-filter">Customer</Label>
            <Select
              id="sale-contract-customer-filter"
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
            <Label htmlFor="sale-contract-project-filter">Project</Label>
            <Select
              id="sale-contract-project-filter"
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
            <Label htmlFor="sale-contract-unit-filter">Unit</Label>
            <Select
              disabled={projectFilter === 'all'}
              id="sale-contract-unit-filter"
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
            <Label htmlFor="sale-contract-date-from">Date from</Label>
            <Input
              id="sale-contract-date-from"
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale-contract-date-to">Date to</Label>
            <Input
              id="sale-contract-date-to"
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </div>
        </CrmPropertyDeskFilterCard>

        {saleContractsQuery.isError && isApiError(saleContractsQuery.error) ? (
          <CrmPropertyDeskQueryErrorBanner
            message={saleContractsQuery.error.apiError.message}
          />
        ) : null}

        {saleContractsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading sale contracts.
          </div>
        ) : saleContractsQuery.data && saleContractsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Project / Unit</TableHead>
                  <TableHead>Amounts</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleContractsQuery.data.items.map((saleContract) => (
                  <TableRow key={saleContract.id}>
                    <TableCell>
                      <p className="font-semibold text-foreground">
                        {saleContract.customerName}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {saleContract.projectName}
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {saleContract.projectCode} / {saleContract.unitCode}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {saleContract.unitName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>Booking {formatAccountingAmount(saleContract.bookingAmount)}</p>
                        <p className="text-muted-foreground">
                          Contract {formatAccountingAmount(saleContract.contractAmount)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{formatDate(saleContract.bookingDate)}</p>
                        <p className="text-muted-foreground">
                          {formatDate(saleContract.contractDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{saleContract.reference || 'No reference'}</p>
                        <p className="text-muted-foreground">
                          {saleContract.notes || 'No notes'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(saleContract.updatedAt)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setActionError(null);
                          setEditor(saleContract);
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
            <PaginationControls meta={saleContractsQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No sale contracts found"
            description="Create the first contract from an eligible booking or adjust the current filters."
          />
        )}
      </CrmPropertyDeskSection>

      <SidePanel
        description={
          editor
            ? 'Review linked booking detail and edit only the safe contract metadata exposed in this phase.'
            : 'Create a contract from an existing booking with clear customer, project, unit, and amount context.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Sale contract detail' : 'Create sale contract'}
      >
        {editor && saleContractForEdit ? (
          <SaleContractEditPanel
            isPending={saveSaleContractMutation.isPending}
            onClose={() => {
              setPanelOpen(false);
              setEditor(null);
            }}
            onSubmit={(values) =>
              saveSaleContractMutation
                .mutateAsync({
                  saleContractId: editor.id,
                  payload: buildUpdatePayload(values),
                })
                .then(() => {
                  setActionError(null);
                  setPanelOpen(false);
                  setEditor(null);
                })
            }
            saleContract={saleContractForEdit}
          />
        ) : (
          <SaleContractCreatePanel
            bookings={eligibleBookings}
            isPending={saveSaleContractMutation.isPending}
            onClose={() => {
              setPanelOpen(false);
              setEditor(null);
            }}
            onSubmit={(values) =>
              saveSaleContractMutation
                .mutateAsync({
                  payload: buildCreatePayload(values),
                })
                .then(() => {
                  setActionError(null);
                  setPanelOpen(false);
                })
            }
          />
        )}
      </SidePanel>
    </div>
  );
};
