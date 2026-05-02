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
  CreateZonePayload,
  UpdateZonePayload,
  ZoneRecord,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { ZoneFormPanel, type ZoneFormValues } from './forms';
import {
  useBlocks,
  useProjects,
  useSaveZone,
  useToggleZone,
  useZone,
  useZones,
} from './hooks';
import {
  HierarchyBadgeRow,
  MasterFilterCard,
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

export const ZonesPage = () => {
  const { canAccessProjectProperty, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessProjectProperty && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [projectFilter, setProjectFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<ZoneRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
  const blockOptionsQuery = useBlocks(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );

  const blockOptions = blockOptionsQuery.data?.items ?? [];
  const filteredBlockOptions = blockOptions.filter((block) =>
    projectFilter === 'all' ? false : block.projectId === projectFilter,
  );

  useEffect(() => {
    if (projectFilter === 'all' && blockFilter !== 'all') {
      setBlockFilter('all');
      return;
    }

    if (
      blockFilter !== 'all' &&
      !filteredBlockOptions.some((block) => block.id === blockFilter)
    ) {
      setBlockFilter('all');
    }
  }, [blockFilter, filteredBlockOptions, projectFilter]);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
      ...(blockFilter !== 'all' ? { blockId: blockFilter } : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
    }),
    [blockFilter, deferredSearch, page, projectFilter, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [blockFilter, deferredSearch, projectFilter, statusFilter]);

  const zonesQuery = useZones(companyId, listQuery, isEnabled);
  const zoneDetailQuery = useZone(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveZoneMutation = useSaveZone(companyId);
  const toggleZoneMutation = useToggleZone(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessProjectProperty) {
    return <ProjectPropertyAccessRequiredState />;
  }

  const projects = projectsQuery.data?.items ?? [];
  const zoneForForm = zoneDetailQuery.data ?? editor;

  const buildCreatePayload = (values: ZoneFormValues): CreateZonePayload => {
    const description = normalizeOptionalText(values.description);
    const blockId = normalizeNullableId(values.blockId);

    return {
      projectId: values.projectId,
      blockId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : {}),
    };
  };

  const buildUpdatePayload = (values: ZoneFormValues): UpdateZonePayload => {
    const description = normalizeOptionalText(values.description);
    const blockId = normalizeNullableId(values.blockId);

    return {
      blockId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : { description: null }),
    };
  };

  return (
    <div className="space-y-6">
      <ProjectPropertyPageHeader
        title="Zones"
        description="Manage zones under a project, optionally anchored to a block. Filtering by project and block keeps the hierarchy understandable as the unit master grows."
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
            New zone
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
        title="Zone hierarchy"
        description="Zones can sit directly under a project or under a specific block. The UI makes that parent relationship visible both in filters and in row-level hierarchy context."
      >
        <MasterFilterCard
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          searchPlaceholder="Search zones by code, name, or description"
          searchValue={search}
          statusFilter={statusFilter}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zone-project-filter">Project</Label>
              <Select
                id="zone-project-filter"
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
              <Label htmlFor="zone-block-filter">Block</Label>
              <Select
                disabled={projectFilter === 'all'}
                id="zone-block-filter"
                onChange={(event) => setBlockFilter(event.target.value)}
                value={blockFilter}
              >
                <option value="all">All blocks</option>
                {filteredBlockOptions.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.code} - {block.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </MasterFilterCard>

        {zonesQuery.isError && isApiError(zonesQuery.error) ? (
          <ProjectPropertyQueryErrorBanner
            message={zonesQuery.error.apiError.message}
          />
        ) : null}

        {zonesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading zones.
          </div>
        ) : zonesQuery.data && zonesQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zonesQuery.data.items.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{zone.name}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {zone.code}
                        </p>
                        {zone.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {zone.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <HierarchyBadgeRow
                        items={[
                          `${zone.projectCode} - ${zone.projectName}`,
                          zone.blockCode && zone.blockName
                            ? `${zone.blockCode} - ${zone.blockName}`
                            : null,
                        ]}
                      />
                    </TableCell>
                    <TableCell>
                      <MasterStatusBadge isActive={zone.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(zone.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(zone);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleZoneMutation.isPending}
                          onClick={() =>
                            void toggleZoneMutation
                              .mutateAsync({
                                zoneId: zone.id,
                                isActive: zone.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the zone status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {zone.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={zonesQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No zones found"
            description="Create a zone or focus the filters on a project and block branch."
          />
        )}
      </ProjectPropertySection>

      <SidePanel
        description={
          editor
            ? 'Update zone metadata and optional block linkage while keeping the original project anchor fixed.'
            : 'Create a zone under a selected project and optionally attach it to a block.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit zone' : 'Create zone'}
      >
        <ZoneFormPanel
          blocks={blockOptions}
          isPending={saveZoneMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveZoneMutation
              .mutateAsync(
                editor
                  ? {
                      zoneId: editor.id,
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
          projects={projects}
          zone={
            zoneForForm
              ? {
                  projectId: zoneForForm.projectId,
                  blockId: zoneForForm.blockId,
                  code: zoneForForm.code,
                  name: zoneForForm.name,
                  description: zoneForForm.description,
                }
              : null
          }
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
