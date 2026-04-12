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
  CreateProjectPhasePayload,
  ProjectPhaseRecord,
  UpdateProjectPhasePayload,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  ProjectPhaseFormPanel,
  type ProjectPhaseFormValues,
} from './forms';
import {
  useProjectPhase,
  useProjectPhases,
  useProjects,
  useSaveProjectPhase,
  useToggleProjectPhase,
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
  getProjectLabel,
  normalizeOptionalText,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const ProjectPhasesPage = () => {
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
  const [editor, setEditor] = useState<ProjectPhaseRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
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

  const phasesQuery = useProjectPhases(companyId, listQuery, isEnabled);
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
  const projectPhaseDetailQuery = useProjectPhase(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveProjectPhaseMutation = useSaveProjectPhase(companyId);
  const toggleProjectPhaseMutation = useToggleProjectPhase(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessProjectProperty) {
    return <ProjectPropertyAccessRequiredState />;
  }

  const projects = projectOptionsQuery.data?.items ?? [];
  const phaseForForm = projectPhaseDetailQuery.data ?? editor;

  const buildCreatePayload = (
    values: ProjectPhaseFormValues,
  ): CreateProjectPhasePayload => {
    const description = normalizeOptionalText(values.description);

    return {
      projectId: values.projectId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : {}),
    };
  };

  const buildUpdatePayload = (
    values: ProjectPhaseFormValues,
  ): UpdateProjectPhasePayload => {
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
        title="Phases"
        description="Manage project phases as the first operational hierarchy layer beneath a project. Parent project selection stays explicit and immutable once a phase exists."
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
            New phase
          </Button>
        }
      />

      {actionError ? <ProjectPropertyQueryErrorBanner message={actionError} /> : null}

      <ProjectPropertySection
        title="Project phase hierarchy"
        description="Filter by project to keep parent-child relationships clear. Editing a phase keeps its project anchor visible while allowing code, name, and active-state maintenance."
      >
        <MasterFilterCard
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          searchPlaceholder="Search phases by code, name, or description"
          searchValue={search}
          statusFilter={statusFilter}
        >
          <Label htmlFor="phase-project-filter">Project</Label>
          <Select
            id="phase-project-filter"
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
        </MasterFilterCard>

        {phasesQuery.isError && isApiError(phasesQuery.error) ? (
          <ProjectPropertyQueryErrorBanner
            message={phasesQuery.error.apiError.message}
          />
        ) : null}

        {phasesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading phases.
          </div>
        ) : phasesQuery.data && phasesQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phase</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phasesQuery.data.items.map((phase) => (
                  <TableRow key={phase.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{phase.name}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {phase.code}
                        </p>
                        {phase.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {phase.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{phase.projectName}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {phase.projectCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MasterStatusBadge isActive={phase.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(phase.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(phase);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleProjectPhaseMutation.isPending}
                          onClick={() =>
                            void toggleProjectPhaseMutation
                              .mutateAsync({
                                projectPhaseId: phase.id,
                                isActive: phase.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the phase status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {phase.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={phasesQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No phases found"
            description="Create the first project phase or narrow the project filter to inspect an existing hierarchy branch."
          />
        )}
      </ProjectPropertySection>

      <SidePanel
        description={
          editor
            ? 'Update phase metadata while keeping the original parent project visible and fixed.'
            : 'Create a phase under a selected project to open the next hierarchy level.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit phase' : 'Create phase'}
      >
        <ProjectPhaseFormPanel
          isPending={saveProjectPhaseMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveProjectPhaseMutation
              .mutateAsync(
                editor
                  ? {
                      projectPhaseId: editor.id,
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
          projectPhase={
            phaseForForm
              ? {
                  projectId: phaseForForm.projectId,
                  code: phaseForForm.code,
                  name: phaseForForm.name,
                  description: phaseForForm.description,
                }
              : null
          }
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
