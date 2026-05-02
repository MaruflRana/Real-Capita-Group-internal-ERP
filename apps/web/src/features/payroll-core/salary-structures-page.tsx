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
import type { SalaryStructureRecord } from '../../lib/api/types';
import {
  buildPayrollAmountPayload,
  SalaryStructureFormPanel,
  type SalaryStructureFormValues,
} from './forms';
import {
  useSalaryStructure,
  useSalaryStructures,
  useSaveSalaryStructure,
  useToggleSalaryStructure,
} from './hooks';
import {
  PayrollCoreAccessRequiredState,
  PayrollCoreFilterCard,
  PayrollCorePageHeader,
  PayrollCoreQueryErrorBanner,
  PayrollCoreSection,
  PayrollEntityStatusBadge,
} from './shared';
import {
  getStatusQueryValue,
  normalizeOptionalTextToNull,
  PAGE_SIZE,
} from './utils';

export const SalaryStructuresPage = () => {
  const { canAccessPayroll, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessPayroll && Boolean(companyId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<SalaryStructureRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(() => {
    const isActive = getStatusQueryValue(statusFilter);

    return {
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };
  }, [deferredSearch, page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const salaryStructuresQuery = useSalaryStructures(companyId, listQuery, isEnabled);
  const salaryStructureDetailQuery = useSalaryStructure(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveSalaryStructureMutation = useSaveSalaryStructure(companyId);
  const toggleSalaryStructureMutation = useToggleSalaryStructure(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessPayroll) {
    return <PayrollCoreAccessRequiredState />;
  }

  const salaryStructureForForm = salaryStructureDetailQuery.data ?? editor;

  const buildPayload = (values: SalaryStructureFormValues) => ({
    code: values.code.trim(),
    name: values.name.trim(),
    description: normalizeOptionalTextToNull(values.description),
    ...buildPayrollAmountPayload(values),
  });

  return (
    <div className="space-y-6">
      <PayrollCorePageHeader
        title="Salary Structures"
        description="Maintain the company-scoped payroll amount templates that payroll admins can use as a clear reference when preparing run lines."
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
            New salary structure
          </Button>
        }
      />

      {actionError ? <PayrollCoreQueryErrorBanner message={actionError} /> : null}

      <PayrollAnalyticsPanel
        companyId={companyId}
        companySlug={user.currentCompany.slug}
        enabled={isEnabled}
      />

      <PayrollCoreSection
        title="Salary structure list"
        description="Search by structure code, name, or description. Net amount stays derived from basic, allowance, and deduction amounts."
      >
        <PayrollCoreFilterCard>
          <div className="space-y-2 xl:col-span-3">
            <Label htmlFor="salary-structure-search">Search</Label>
            <Input
              id="salary-structure-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search salary structures by code, name, or description"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary-structure-status-filter">Status</Label>
            <Select
              id="salary-structure-status-filter"
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
        </PayrollCoreFilterCard>

        {salaryStructuresQuery.isError && isApiError(salaryStructuresQuery.error) ? (
          <PayrollCoreQueryErrorBanner
            message={salaryStructuresQuery.error.apiError.message}
          />
        ) : null}

        {salaryStructuresQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading salary structures.
          </div>
        ) : salaryStructuresQuery.data &&
          salaryStructuresQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Structure</TableHead>
                  <TableHead>Amount mix</TableHead>
                  <TableHead>Net amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryStructuresQuery.data.items.map((salaryStructure) => (
                  <TableRow key={salaryStructure.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {salaryStructure.code}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {salaryStructure.name}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {salaryStructure.description || 'No description'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>
                          Basic {formatAccountingAmount(salaryStructure.basicAmount)}
                        </p>
                        <p>
                          Allowance{' '}
                          {formatAccountingAmount(salaryStructure.allowanceAmount)}
                        </p>
                        <p className="text-muted-foreground">
                          Deduction{' '}
                          {formatAccountingAmount(salaryStructure.deductionAmount)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">
                        {formatAccountingAmount(salaryStructure.netAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PayrollEntityStatusBadge isActive={salaryStructure.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(salaryStructure.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(salaryStructure);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleSalaryStructureMutation.isPending}
                          onClick={() =>
                            void toggleSalaryStructureMutation
                              .mutateAsync({
                                salaryStructureId: salaryStructure.id,
                                isActive: salaryStructure.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the salary structure status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {salaryStructure.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={salaryStructuresQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No salary structures found"
            description="Create the first salary structure or adjust the current filters to review existing payroll amount templates."
          />
        )}
      </PayrollCoreSection>

      <SidePanel
        description={
          editor
            ? 'Update the salary structure code, description, and amount mix used as a payroll preparation reference.'
            : 'Create a reusable payroll amount template with explicit basic, allowance, deduction, and derived net values.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit salary structure' : 'Create salary structure'}
      >
        <SalaryStructureFormPanel
          isPending={saveSalaryStructureMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveSalaryStructureMutation
              .mutateAsync(
                editor
                  ? {
                      salaryStructureId: editor.id,
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
          salaryStructure={salaryStructureForForm}
        />
      </SidePanel>
    </div>
  );
};
