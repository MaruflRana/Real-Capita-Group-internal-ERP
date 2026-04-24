'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { Label } from '../../components/ui/label';
import { OutputActionGroup } from '../../components/ui/output-actions';
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
import { listUnits } from '../../lib/api/project-property';
import type {
  CreateUnitPayload,
  UnitRecord,
  UpdateUnitPayload,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  buildExportFileName,
  exportPaginatedCsv,
  getExportDateStamp,
} from '../../lib/output';
import { ProjectPathPreview, UnitFormPanel, type UnitFormValues } from './forms';
import {
  useBlocks,
  useProjectPhases,
  useProjects,
  useSaveUnit,
  useToggleUnit,
  useUnit,
  useUnits,
  useUnitStatuses,
  useUnitTypes,
  useZones,
} from './hooks';
import {
  MasterStatusBadge,
  ProjectPropertyAccessRequiredState,
  ProjectPropertyPageHeader,
  ProjectPropertyQueryErrorBanner,
  ProjectPropertySection,
} from './shared';
import {
  getProjectLabel,
  normalizeNullableId,
  normalizeOptionalText,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const UnitsPage = () => {
  const { canAccessProjectProperty, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessProjectProperty && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [projectFilter, setProjectFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [unitTypeFilter, setUnitTypeFilter] = useState('all');
  const [unitStatusFilter, setUnitStatusFilter] = useState('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<UnitRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const projectsQuery = useProjects(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const phasesQuery = useProjectPhases(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const blocksQuery = useBlocks(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const zonesQuery = useZones(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const unitTypesQuery = useUnitTypes(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const unitStatusesQuery = useUnitStatuses(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    },
    isEnabled,
  );

  const projects = projectsQuery.data?.items ?? [];
  const phases = phasesQuery.data?.items ?? [];
  const blocks = blocksQuery.data?.items ?? [];
  const zones = zonesQuery.data?.items ?? [];
  const unitTypes = unitTypesQuery.data?.items ?? [];
  const unitStatuses = unitStatusesQuery.data?.items ?? [];

  const availablePhaseFilters = phases.filter((phase) =>
    projectFilter === 'all' ? false : phase.projectId === projectFilter,
  );
  const availableBlockFilters = blocks.filter(
    (block) =>
      projectFilter !== 'all' &&
      block.projectId === projectFilter &&
      (phaseFilter === 'all' || block.phaseId === phaseFilter),
  );
  const availableZoneFilters = zones.filter(
    (zone) =>
      projectFilter !== 'all' &&
      zone.projectId === projectFilter &&
      (blockFilter === 'all' || zone.blockId === blockFilter),
  );

  useEffect(() => {
    if (projectFilter === 'all') {
      if (phaseFilter !== 'all') {
        setPhaseFilter('all');
      }
      if (blockFilter !== 'all') {
        setBlockFilter('all');
      }
      if (zoneFilter !== 'all') {
        setZoneFilter('all');
      }
      return;
    }

    if (
      phaseFilter !== 'all' &&
      !availablePhaseFilters.some((phase) => phase.id === phaseFilter)
    ) {
      setPhaseFilter('all');
    }

    if (
      blockFilter !== 'all' &&
      !availableBlockFilters.some((block) => block.id === blockFilter)
    ) {
      setBlockFilter('all');
    }

    if (
      zoneFilter !== 'all' &&
      !availableZoneFilters.some((zone) => zone.id === zoneFilter)
    ) {
      setZoneFilter('all');
    }
  }, [
    availableBlockFilters,
    availablePhaseFilters,
    availableZoneFilters,
    blockFilter,
    phaseFilter,
    projectFilter,
    zoneFilter,
  ]);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
      ...(phaseFilter !== 'all' ? { phaseId: phaseFilter } : {}),
      ...(blockFilter !== 'all' ? { blockId: blockFilter } : {}),
      ...(zoneFilter !== 'all' ? { zoneId: zoneFilter } : {}),
      ...(unitTypeFilter !== 'all' ? { unitTypeId: unitTypeFilter } : {}),
      ...(unitStatusFilter !== 'all'
        ? { unitStatusId: unitStatusFilter }
        : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
    }),
    [
      blockFilter,
      deferredSearch,
      page,
      phaseFilter,
      projectFilter,
      statusFilter,
      unitStatusFilter,
      unitTypeFilter,
      zoneFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [
    blockFilter,
    deferredSearch,
    phaseFilter,
    projectFilter,
    statusFilter,
    unitStatusFilter,
    unitTypeFilter,
    zoneFilter,
  ]);

  const unitsQuery = useUnits(companyId, listQuery, isEnabled);
  const unitDetailQuery = useUnit(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveUnitMutation = useSaveUnit(companyId);
  const toggleUnitMutation = useToggleUnit(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessProjectProperty) {
    return <ProjectPropertyAccessRequiredState />;
  }

  const unitForForm = unitDetailQuery.data ?? editor;

  const buildCreatePayload = (values: UnitFormValues): CreateUnitPayload => {
    const description = normalizeOptionalText(values.description);
    const phaseId = normalizeNullableId(values.phaseId);
    const blockId = normalizeNullableId(values.blockId);
    const zoneId = normalizeNullableId(values.zoneId);

    return {
      projectId: values.projectId,
      phaseId,
      blockId,
      zoneId,
      unitTypeId: values.unitTypeId,
      unitStatusId: values.unitStatusId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : {}),
    };
  };

  const buildUpdatePayload = (values: UnitFormValues): UpdateUnitPayload => {
    const description = normalizeOptionalText(values.description);
    const phaseId = normalizeNullableId(values.phaseId);
    const blockId = normalizeNullableId(values.blockId);
    const zoneId = normalizeNullableId(values.zoneId);

    return {
      phaseId,
      blockId,
      zoneId,
      unitTypeId: values.unitTypeId,
      unitStatusId: values.unitStatusId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : { description: null }),
    };
  };

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
            header: 'Unit Code',
            value: (unit) => unit.code,
          },
          {
            header: 'Unit Name',
            value: (unit) => unit.name,
          },
          {
            header: 'Project Code',
            value: (unit) => unit.projectCode,
          },
          {
            header: 'Project Name',
            value: (unit) => unit.projectName,
          },
          {
            header: 'Phase Code',
            value: (unit) => unit.phaseCode ?? '',
          },
          {
            header: 'Phase Name',
            value: (unit) => unit.phaseName ?? '',
          },
          {
            header: 'Block Code',
            value: (unit) => unit.blockCode ?? '',
          },
          {
            header: 'Block Name',
            value: (unit) => unit.blockName ?? '',
          },
          {
            header: 'Zone Code',
            value: (unit) => unit.zoneCode ?? '',
          },
          {
            header: 'Zone Name',
            value: (unit) => unit.zoneName ?? '',
          },
          {
            header: 'Unit Type',
            value: (unit) => unit.unitTypeName,
          },
          {
            header: 'Unit Status',
            value: (unit) => unit.unitStatusName,
          },
          {
            header: 'Active',
            value: (unit) => (unit.isActive ? 'Yes' : 'No'),
          },
          {
            header: 'Description',
            value: (unit) => unit.description ?? '',
          },
          {
            header: 'Updated At',
            value: (unit) => unit.updatedAt,
          },
        ],
        companyId,
        fileName: buildExportFileName([
          user.currentCompany.slug,
          'units',
          'export',
          getExportDateStamp(),
        ]),
        listFn: listUnits,
        query: listQuery,
      });
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the unit list.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProjectPropertyPageHeader
        title="Units"
        description="Operate the core unit master with full hierarchy visibility, company-scoped filtering, and safe parent-child selection across project, phase, block, zone, unit type, and unit status."
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
              New unit
            </Button>
          </div>
        }
      />

      {actionError ? <ProjectPropertyQueryErrorBanner message={actionError} /> : null}
      {exportError ? <ProjectPropertyQueryErrorBanner message={exportError} /> : null}

      <ProjectPropertySection
        title="Unit management"
        description="Use the hierarchy filters to narrow the working set, then open the side panel for create or edit. Editing a unit loads its detail from the backend and keeps the project anchor visible."
      >
        <div className="grid gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="unit-search">Search</Label>
            <input
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background"
              id="unit-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search unit code, name, or description"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-active-filter">Active state</Label>
            <Select
              id="unit-active-filter"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as 'all' | 'active' | 'inactive',
                )
              }
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-project-filter">Project</Label>
            <Select
              id="unit-project-filter"
              onChange={(event) => setProjectFilter(event.target.value)}
              value={projectFilter}
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-phase-filter">Phase</Label>
            <Select
              disabled={projectFilter === 'all'}
              id="unit-phase-filter"
              onChange={(event) => setPhaseFilter(event.target.value)}
              value={phaseFilter}
            >
              <option value="all">All phases</option>
              {availablePhaseFilters.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.code} - {phase.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-block-filter">Block</Label>
            <Select
              disabled={projectFilter === 'all'}
              id="unit-block-filter"
              onChange={(event) => setBlockFilter(event.target.value)}
              value={blockFilter}
            >
              <option value="all">All blocks</option>
              {availableBlockFilters.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.code} - {block.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-zone-filter">Zone</Label>
            <Select
              disabled={projectFilter === 'all'}
              id="unit-zone-filter"
              onChange={(event) => setZoneFilter(event.target.value)}
              value={zoneFilter}
            >
              <option value="all">All zones</option>
              {availableZoneFilters.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.code} - {zone.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-type-filter">Unit type</Label>
            <Select
              id="unit-type-filter"
              onChange={(event) => setUnitTypeFilter(event.target.value)}
              value={unitTypeFilter}
            >
              <option value="all">All unit types</option>
              {unitTypes.map((unitType) => (
                <option key={unitType.id} value={unitType.id}>
                  {unitType.code} - {unitType.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-status-filter">Unit status</Label>
            <Select
              id="unit-status-filter"
              onChange={(event) => setUnitStatusFilter(event.target.value)}
              value={unitStatusFilter}
            >
              <option value="all">All unit statuses</option>
              {unitStatuses.map((unitStatus) => (
                <option key={unitStatus.id} value={unitStatus.id}>
                  {unitStatus.code} - {unitStatus.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {unitsQuery.isError && isApiError(unitsQuery.error) ? (
          <ProjectPropertyQueryErrorBanner
            message={unitsQuery.error.apiError.message}
          />
        ) : null}

        {unitsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading units.
          </div>
        ) : unitsQuery.data && unitsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Type / Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsQuery.data.items.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{unit.name}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {unit.code}
                        </p>
                        {unit.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {unit.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ProjectPathPreview
                        block={
                          unit.blockId
                            ? {
                                id: unit.blockId,
                                companyId: unit.companyId,
                                projectId: unit.projectId,
                                projectCode: unit.projectCode,
                                projectName: unit.projectName,
                                phaseId: unit.phaseId,
                                phaseCode: unit.phaseCode,
                                phaseName: unit.phaseName,
                                code: unit.blockCode ?? '',
                                name: unit.blockName ?? '',
                                description: null,
                                isActive: unit.isActive,
                                createdAt: unit.createdAt,
                                updatedAt: unit.updatedAt,
                              }
                            : null
                        }
                        phase={
                          unit.phaseId
                            ? {
                                id: unit.phaseId,
                                companyId: unit.companyId,
                                projectId: unit.projectId,
                                projectCode: unit.projectCode,
                                projectName: unit.projectName,
                                code: unit.phaseCode ?? '',
                                name: unit.phaseName ?? '',
                                description: null,
                                isActive: unit.isActive,
                                createdAt: unit.createdAt,
                                updatedAt: unit.updatedAt,
                              }
                            : null
                        }
                        project={{
                          id: unit.projectId,
                          companyId: unit.companyId,
                          locationId: null,
                          locationCode: null,
                          locationName: null,
                          code: unit.projectCode,
                          name: unit.projectName,
                          description: null,
                          isActive: unit.isActive,
                          createdAt: unit.createdAt,
                          updatedAt: unit.updatedAt,
                        }}
                        zone={
                          unit.zoneId
                            ? {
                                id: unit.zoneId,
                                companyId: unit.companyId,
                                projectId: unit.projectId,
                                projectCode: unit.projectCode,
                                projectName: unit.projectName,
                                blockId: unit.blockId,
                                blockCode: unit.blockCode,
                                blockName: unit.blockName,
                                code: unit.zoneCode ?? '',
                                name: unit.zoneName ?? '',
                                description: null,
                                isActive: unit.isActive,
                                createdAt: unit.createdAt,
                                updatedAt: unit.updatedAt,
                              }
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {unit.unitTypeName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {unit.unitStatusName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MasterStatusBadge isActive={unit.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(unit.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(unit);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleUnitMutation.isPending}
                          onClick={() =>
                            void toggleUnitMutation
                              .mutateAsync({
                                unitId: unit.id,
                                isActive: unit.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the unit status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {unit.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={unitsQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No units found"
            description="Create the first unit or narrow the current hierarchy filters to inspect an existing branch."
          />
        )}
      </ProjectPropertySection>

      <SidePanel
        description={
          editor
            ? 'Edit unit detail loaded directly from the backend while keeping the original project anchor visible.'
            : 'Create a unit with guided hierarchy selection across project, phase, block, zone, unit type, and unit status.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit unit' : 'Create unit'}
      >
        <UnitFormPanel
          blocks={blocks}
          isPending={saveUnitMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveUnitMutation
              .mutateAsync(
                editor
                  ? {
                      unitId: editor.id,
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
          phases={phases}
          projects={projects}
          unit={unitForForm}
          unitStatuses={unitStatuses}
          unitTypes={unitTypes}
          zones={zones}
          {...(editor
            ? {
                lockedProjectLabel: getProjectLabel({
                  code: editor.projectCode,
                  name: editor.projectName,
                }),
              }
            : {})}
        />
      </SidePanel>
    </div>
  );
};
