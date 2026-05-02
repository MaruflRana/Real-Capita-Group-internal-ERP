'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { Label } from '../../components/ui/label';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { Select } from '../../components/ui/select';
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
  CostCenterRecord,
  UpdateCostCenterPayload,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { CostCenterFormPanel, type CostCenterFormValues } from './forms';
import {
  useCostCenter,
  useCostCenters,
  useProjects,
  useSaveCostCenter,
  useToggleCostCenter,
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
  normalizeNullableId,
  normalizeOptionalText,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const CostCentersPage = () => {
  const { canAccessProjectProperty, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessProjectProperty && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [projectFilter, setProjectFilter] = useState('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<CostCenterRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const costCenterQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
    }),
    [deferredSearch, page, projectFilter, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, projectFilter, statusFilter]);

  const costCentersQuery = useCostCenters(companyId, costCenterQuery, isEnabled);
  const projectOptionsQuery = useProjects(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const costCenterDetailQuery = useCostCenter(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveCostCenterMutation = useSaveCostCenter(companyId);
  const toggleCostCenterMutation = useToggleCostCenter(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessProjectProperty) {
    return <ProjectPropertyAccessRequiredState />;
  }

  const projects = projectOptionsQuery.data?.items ?? [];
  const costCenterForForm = costCenterDetailQuery.data ?? editor;

  const buildPayload = (values: CostCenterFormValues): UpdateCostCenterPayload => {
    const description = normalizeOptionalText(values.description);
    const projectId = normalizeNullableId(values.projectId);

    return {
      projectId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : { description: null }),
    };
  };

  return (
    <div className="space-y-6">
      <ProjectPropertyPageHeader
        title="Cost Centers"
        description="Maintain company-level or project-linked cost centers without drifting into accounting posting or reporting. Keep cost-center usage limited to master-data administration in this phase."
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
            New cost center
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
        title="Cost center master list"
        description="Cost centers can remain company-level or link to a specific project. Use the project filter when reconciling project-aligned master data."
      >
        <MasterFilterCard
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          searchPlaceholder="Search cost centers by code, name, or description"
          searchValue={search}
          statusFilter={statusFilter}
        >
          <Label htmlFor="cost-center-project-filter">Project</Label>
          <Select
            id="cost-center-project-filter"
            onChange={(event) => setProjectFilter(event.target.value)}
            value={projectFilter}
          >
            <option value="all">All project scopes</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </Select>
        </MasterFilterCard>

        {costCentersQuery.isError && isApiError(costCentersQuery.error) ? (
          <ProjectPropertyQueryErrorBanner
            message={costCentersQuery.error.apiError.message}
          />
        ) : null}

        {costCentersQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading cost centers.
          </div>
        ) : costCentersQuery.data && costCentersQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost center</TableHead>
                  <TableHead>Project scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCentersQuery.data.items.map((costCenter) => (
                  <TableRow key={costCenter.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{costCenter.name}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {costCenter.code}
                        </p>
                        {costCenter.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {costCenter.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {costCenter.projectCode && costCenter.projectName ? (
                        <div>
                          <p className="font-medium text-foreground">
                            {costCenter.projectName}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {costCenter.projectCode}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Company-level master
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <MasterStatusBadge isActive={costCenter.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(costCenter.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(costCenter);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleCostCenterMutation.isPending}
                          onClick={() =>
                            void toggleCostCenterMutation
                              .mutateAsync({
                                costCenterId: costCenter.id,
                                isActive: costCenter.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the cost center status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {costCenter.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={costCentersQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No cost centers found"
            description="Create the first cost center or change the current project/status filters."
          />
        )}
      </ProjectPropertySection>

      <SidePanel
        description={
          editor
            ? 'Update cost center metadata and its optional project linkage inside the active company scope.'
            : 'Create a new company-level or project-linked cost center for downstream operational use.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit cost center' : 'Create cost center'}
      >
        <CostCenterFormPanel
          costCenter={costCenterForForm}
          isPending={saveCostCenterMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveCostCenterMutation
              .mutateAsync(
                editor
                  ? {
                      costCenterId: editor.id,
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
          projects={projects}
        />
      </SidePanel>
    </div>
  );
};
