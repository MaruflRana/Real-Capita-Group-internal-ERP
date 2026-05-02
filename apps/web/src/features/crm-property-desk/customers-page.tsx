'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { AppPage } from '../../components/ui/erp-primitives';
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
import { listCustomers } from '../../lib/api/crm-property-desk';
import type { CustomerRecord } from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  buildExportFileName,
  exportPaginatedCsv,
  getExportDateStamp,
} from '../../lib/output';
import { CustomerFormPanel, type CustomerFormValues } from './forms';
import {
  useCustomer,
  useCustomers,
  useSaveCustomer,
  useToggleCustomer,
} from './hooks';
import {
  CrmPropertyDeskAccessRequiredState,
  CrmPropertyDeskFilterCard,
  CrmPropertyDeskPageHeader,
  CrmPropertyDeskQueryErrorBanner,
  CrmPropertyDeskSection,
  EntityStatusBadge,
} from './shared';
import {
  getStatusQueryValue,
  normalizeOptionalTextToNull,
  PAGE_SIZE,
} from './utils';

export const CustomersPage = () => {
  const { canAccessCrmPropertyDesk, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessCrmPropertyDesk && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<CustomerRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const query = useMemo(
    () => {
      const isActive = getStatusQueryValue(statusFilter);

      return {
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'fullName',
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

  const customersQuery = useCustomers(companyId, query, isEnabled);
  const customerDetailQuery = useCustomer(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveCustomerMutation = useSaveCustomer(companyId);
  const toggleCustomerMutation = useToggleCustomer(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessCrmPropertyDesk) {
    return <CrmPropertyDeskAccessRequiredState />;
  }

  const customerForForm = customerDetailQuery.data ?? editor;

  const buildPayload = (values: CustomerFormValues) => ({
    fullName: values.fullName,
    email: normalizeOptionalTextToNull(values.email),
    phone: normalizeOptionalTextToNull(values.phone),
    address: normalizeOptionalTextToNull(values.address),
    notes: normalizeOptionalTextToNull(values.notes),
  });

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
            header: 'Customer ID',
            value: (customer) => customer.id,
          },
          {
            header: 'Full Name',
            value: (customer) => customer.fullName,
          },
          {
            header: 'Email',
            value: (customer) => customer.email ?? '',
          },
          {
            header: 'Phone',
            value: (customer) => customer.phone ?? '',
          },
          {
            header: 'Address',
            value: (customer) => customer.address ?? '',
          },
          {
            header: 'Notes',
            value: (customer) => customer.notes ?? '',
          },
          {
            header: 'Active',
            value: (customer) => (customer.isActive ? 'Yes' : 'No'),
          },
          {
            header: 'Updated At',
            value: (customer) => customer.updatedAt,
          },
        ],
        companyId,
        fileName: buildExportFileName([
          user.currentCompany.slug,
          'customers',
          'export',
          getExportDateStamp(),
        ]),
        listFn: listCustomers,
        query,
      });
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the customer list.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppPage>
      <CrmPropertyDeskPageHeader
        title="Customers"
        description="Operate the company-scoped customer directory used by bookings, contracts, installment schedules, and collections."
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
              New customer
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
      />

      <CrmPropertyDeskSection
        title="Customer master list"
        description="Search by name, contact detail, address, or notes. Keep records clean here so downstream booking and collection linkage stays unambiguous."
      >
        <CrmPropertyDeskFilterCard>
          <div className="space-y-2 xl:col-span-3">
            <Label htmlFor="customer-search">Search</Label>
            <Input
              id="customer-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers by name, email, phone, address, or notes"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-status-filter">Status</Label>
            <Select
              id="customer-status-filter"
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
        </CrmPropertyDeskFilterCard>

        {customersQuery.isError && isApiError(customersQuery.error) ? (
          <CrmPropertyDeskQueryErrorBanner
            message={customersQuery.error.apiError.message}
          />
        ) : null}

        {customersQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading customers.
          </div>
        ) : customersQuery.data && customersQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersQuery.data.items.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{customer.fullName}</p>
                        {customer.address ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {customer.address}
                          </p>
                        ) : null}
                        {customer.notes ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {customer.notes}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{customer.email || 'No email'}</p>
                        <p className="text-muted-foreground">
                          {customer.phone || 'No phone'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <EntityStatusBadge isActive={customer.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(customer.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(customer);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleCustomerMutation.isPending}
                          onClick={() =>
                            void toggleCustomerMutation
                              .mutateAsync({
                                customerId: customer.id,
                                isActive: customer.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the customer status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {customer.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={customersQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No customers found"
            description="Create the first customer or adjust the current filters to review existing contact records."
          />
        )}
      </CrmPropertyDeskSection>

      <SidePanel
        description={
          editor
            ? 'Update customer contact information and active state used across the CRM/property desk workflows.'
            : 'Create a customer that can be linked to leads, bookings, sale contracts, schedules, and collections.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit customer' : 'Create customer'}
      >
        <CustomerFormPanel
          customer={customerForForm}
          isPending={saveCustomerMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveCustomerMutation
              .mutateAsync(
                editor
                  ? { customerId: editor.id, payload: buildPayload(values) }
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
    </AppPage>
  );
};
