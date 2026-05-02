'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { SidePanel } from '../../components/ui/side-panel';
import { ProjectPropertyAnalyticsPanel } from '../analytics/module-panels';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import type {
  CreateUnitTypePayload,
  UnitTypeRecord,
  UpdateUnitTypePayload,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { UnitTypeFormPanel, type UnitTypeFormValues } from './forms';
import {
  useSaveUnitType,
  useToggleUnitType,
  useUnitType,
  useUnitTypes,
} from './hooks';
import {
  MasterFilterCard,
  MasterStatusBadge,
  ProjectPropertyAccessRequiredState,
  ProjectPropertyPageHeader,
  ProjectPropertyQueryErrorBanner,
  ProjectPropertySection,
} from './shared';
import {
  normalizeOptionalText,
  PAGE_SIZE,
} from './utils';

export const UnitTypesPage = () => {
  const { canAccessProjectProperty, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessProjectProperty && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<UnitTypeRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
    }),
    [deferredSearch, page, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const unitTypesQuery = useUnitTypes(companyId, listQuery, isEnabled);
  const unitTypeDetailQuery = useUnitType(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveUnitTypeMutation = useSaveUnitType(companyId);
  const toggleUnitTypeMutation = useToggleUnitType(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessProjectProperty) {
    return <ProjectPropertyAccessRequiredState />;
  }

  const unitTypeForForm = unitTypeDetailQuery.data ?? editor;

  const buildCreatePayload = (
    values: UnitTypeFormValues,
  ): CreateUnitTypePayload => {
    const description = normalizeOptionalText(values.description);

    return {
      code: values.code,
      name: values.name,
      ...(description ? { description } : {}),
    };
  };

  const buildUpdatePayload = (
    values: UnitTypeFormValues,
  ): UpdateUnitTypePayload => {
    const description = normalizeOptionalText(values.description);

    return {
      code: values.code,
      name: values.name,
      ...(description ? { description } : { description: null }),
    };
  };

  return (
    <div className="space-y-6">
      <ProjectPropertyPageHeader
        title="Unit Types"
        description="Maintain company-scoped unit-type masters used by unit creation and editing. Keep codes stable because downstream workflows depend on these master records."
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
            New unit type
          </Button>
        }
      />

      {actionError ? <ProjectPropertyQueryErrorBanner message={actionError} /> : null}

      <ProjectPropertyAnalyticsPanel
        companyId={companyId}
        companySlug={user.currentCompany.slug}
        enabled={isEnabled}
      />

      <ProjectPropertySection
        title="Unit type master list"
        description="Unit types remain flat company-scoped master data in this phase. Manage active state carefully because unit create/edit forms consume only the current master set."
      >
        <MasterFilterCard
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          searchPlaceholder="Search unit types by code, name, or description"
          searchValue={search}
          statusFilter={statusFilter}
        />

        {unitTypesQuery.isError && isApiError(unitTypesQuery.error) ? (
          <ProjectPropertyQueryErrorBanner
            message={unitTypesQuery.error.apiError.message}
          />
        ) : null}

        {unitTypesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading unit types.
          </div>
        ) : unitTypesQuery.data && unitTypesQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitTypesQuery.data.items.map((unitType) => (
                  <TableRow key={unitType.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{unitType.name}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {unitType.code}
                        </p>
                        {unitType.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {unitType.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <MasterStatusBadge isActive={unitType.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(unitType.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(unitType);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleUnitTypeMutation.isPending}
                          onClick={() =>
                            void toggleUnitTypeMutation
                              .mutateAsync({
                                unitTypeId: unitType.id,
                                isActive: unitType.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the unit type status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {unitType.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={unitTypesQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No unit types found"
            description="Create a unit type before maintaining units in this company scope."
          />
        )}
      </ProjectPropertySection>

      <SidePanel
        description={
          editor
            ? 'Update unit-type metadata without leaving the master-data workspace.'
            : 'Create a unit type that units can reference during creation and editing.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit unit type' : 'Create unit type'}
      >
        <UnitTypeFormPanel
          isPending={saveUnitTypeMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveUnitTypeMutation
              .mutateAsync(
                editor
                  ? {
                      unitTypeId: editor.id,
                      payload: buildUpdatePayload(values),
                    }
                  : {
                      payload: buildCreatePayload(values),
                    },
              )
              .then(() => {
                setActionError(null);
                setPanelOpen(false);
                setEditor(null);
              })
          }
          unitType={
            unitTypeForForm
              ? {
                  code: unitTypeForForm.code,
                  name: unitTypeForForm.name,
                  description: unitTypeForForm.description,
                }
              : null
          }
        />
      </SidePanel>
    </div>
  );
};
