'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
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
import type {
  BlockRecord,
  CreateBlockPayload,
  UpdateBlockPayload,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { BlockFormPanel, type BlockFormValues } from './forms';
import {
  useBlock,
  useBlocks,
  useProjectPhases,
  useProjects,
  useSaveBlock,
  useToggleBlock,
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

export const BlocksPage = () => {
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<BlockRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const phaseOptionsQuery = useProjectPhases(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
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

  const phaseOptions = phaseOptionsQuery.data?.items ?? [];
  const filteredPhaseOptions = phaseOptions.filter((phase) =>
    projectFilter === 'all' ? false : phase.projectId === projectFilter,
  );

  useEffect(() => {
    if (projectFilter === 'all' && phaseFilter !== 'all') {
      setPhaseFilter('all');
      return;
    }

    if (
      phaseFilter !== 'all' &&
      !filteredPhaseOptions.some((phase) => phase.id === phaseFilter)
    ) {
      setPhaseFilter('all');
    }
  }, [filteredPhaseOptions, phaseFilter, projectFilter]);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
      ...(phaseFilter !== 'all' ? { phaseId: phaseFilter } : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
    }),
    [deferredSearch, page, phaseFilter, projectFilter, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, phaseFilter, projectFilter, statusFilter]);

  const blocksQuery = useBlocks(companyId, listQuery, isEnabled);
  const blockDetailQuery = useBlock(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveBlockMutation = useSaveBlock(companyId);
  const toggleBlockMutation = useToggleBlock(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessProjectProperty) {
    return <ProjectPropertyAccessRequiredState />;
  }

  const projects = projectsQuery.data?.items ?? [];
  const blockForForm = blockDetailQuery.data ?? editor;

  const buildCreatePayload = (values: BlockFormValues): CreateBlockPayload => {
    const description = normalizeOptionalText(values.description);
    const phaseId = normalizeNullableId(values.phaseId);

    return {
      projectId: values.projectId,
      phaseId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : {}),
    };
  };

  const buildUpdatePayload = (values: BlockFormValues): UpdateBlockPayload => {
    const description = normalizeOptionalText(values.description);
    const phaseId = normalizeNullableId(values.phaseId);

    return {
      phaseId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : { description: null }),
    };
  };

  return (
    <div className="space-y-6">
      <ProjectPropertyPageHeader
        title="Blocks"
        description="Manage block masters under a project, optionally linked to a phase. The UI keeps project filtering and parent selection explicit so blocks do not drift into orphan workflows."
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
            New block
          </Button>
        }
      />

      {actionError ? <ProjectPropertyQueryErrorBanner message={actionError} /> : null}

      <ProjectPropertySection
        title="Block hierarchy"
        description="Use project and phase filters together when reviewing parent-child relationships. Blocks keep their project anchor fixed after creation while allowing optional phase reassignment."
      >
        <MasterFilterCard
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          searchPlaceholder="Search blocks by code, name, or description"
          searchValue={search}
          statusFilter={statusFilter}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="block-project-filter">Project</Label>
              <Select
                id="block-project-filter"
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
              <Label htmlFor="block-phase-filter">Phase</Label>
              <Select
                disabled={projectFilter === 'all'}
                id="block-phase-filter"
                onChange={(event) => setPhaseFilter(event.target.value)}
                value={phaseFilter}
              >
                <option value="all">All phases</option>
                {filteredPhaseOptions.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.code} - {phase.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </MasterFilterCard>

        {blocksQuery.isError && isApiError(blocksQuery.error) ? (
          <ProjectPropertyQueryErrorBanner
            message={blocksQuery.error.apiError.message}
          />
        ) : null}

        {blocksQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading blocks.
          </div>
        ) : blocksQuery.data && blocksQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block</TableHead>
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocksQuery.data.items.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{block.name}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {block.code}
                        </p>
                        {block.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {block.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <HierarchyBadgeRow
                        items={[
                          `${block.projectCode} - ${block.projectName}`,
                          block.phaseCode && block.phaseName
                            ? `${block.phaseCode} - ${block.phaseName}`
                            : null,
                        ]}
                      />
                    </TableCell>
                    <TableCell>
                      <MasterStatusBadge isActive={block.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(block.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(block);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleBlockMutation.isPending}
                          onClick={() =>
                            void toggleBlockMutation
                              .mutateAsync({
                                blockId: block.id,
                                isActive: block.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the block status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {block.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={blocksQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No blocks found"
            description="Create a block or focus the filters on a specific project and phase branch."
          />
        )}
      </ProjectPropertySection>

      <SidePanel
        description={
          editor
            ? 'Update block metadata and optional phase linkage while keeping the original project anchor fixed.'
            : 'Create a block under a selected project and optionally anchor it to a phase.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit block' : 'Create block'}
      >
        <BlockFormPanel
          block={
            blockForForm
              ? {
                  projectId: blockForForm.projectId,
                  phaseId: blockForForm.phaseId,
                  code: blockForForm.code,
                  name: blockForForm.name,
                  description: blockForForm.description,
                }
              : null
          }
          isPending={saveBlockMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveBlockMutation
              .mutateAsync(
                editor
                  ? {
                      blockId: editor.id,
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
          phases={phaseOptions}
          projects={projects}
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
