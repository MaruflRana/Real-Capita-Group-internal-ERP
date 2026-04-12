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
  ProjectRecord,
  UpdateProjectPayload,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { ProjectFormPanel, type ProjectFormValues } from './forms';
import {
  useCompanyLocations,
  useProject,
  useProjects,
  useSaveProject,
  useToggleProject,
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

export const ProjectsPage = () => {
  const { canAccessProjectProperty, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessProjectProperty && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [locationFilter, setLocationFilter] = useState('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<ProjectRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const projectQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(locationFilter !== 'all' ? { locationId: locationFilter } : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
    }),
    [deferredSearch, locationFilter, page, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, locationFilter, statusFilter]);

  const projectsQuery = useProjects(companyId, projectQuery, isEnabled);
  const locationsQuery = useCompanyLocations(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    isEnabled,
  );
  const projectDetailQuery = useProject(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveProjectMutation = useSaveProject(companyId);
  const toggleProjectMutation = useToggleProject(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessProjectProperty) {
    return <ProjectPropertyAccessRequiredState />;
  }

  const projectForForm = projectDetailQuery.data ?? editor;
  const locations = locationsQuery.data?.items ?? [];

  const buildPayload = (values: ProjectFormValues): UpdateProjectPayload => {
    const description = normalizeOptionalText(values.description);
    const locationId = normalizeNullableId(values.locationId);

    return {
      locationId,
      code: values.code,
      name: values.name,
      ...(description ? { description } : { description: null }),
    };
  };

  return (
    <div className="space-y-6">
      <ProjectPropertyPageHeader
        title="Projects"
        description="Manage the company-scoped project master list, including optional location visibility, active state, and the core metadata used by downstream hierarchy masters."
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
            New project
          </Button>
        }
      />

      {actionError ? <ProjectPropertyQueryErrorBanner message={actionError} /> : null}

      <ProjectPropertySection
        title="Project master list"
        description="Projects are the top-level anchor for cost centers, phases, blocks, zones, and units. Keep codes stable and use the optional location link only when the backend company setup supports it."
      >
        <MasterFilterCard
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          searchPlaceholder="Search projects by code, name, or description"
          searchValue={search}
          statusFilter={statusFilter}
        >
          <Label htmlFor="project-location-filter">Location</Label>
          <Select
            id="project-location-filter"
            onChange={(event) => setLocationFilter(event.target.value)}
            value={locationFilter}
          >
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.code} - {location.name}
              </option>
            ))}
          </Select>
        </MasterFilterCard>

        {projectsQuery.isError && isApiError(projectsQuery.error) ? (
          <ProjectPropertyQueryErrorBanner
            message={projectsQuery.error.apiError.message}
          />
        ) : null}

        {projectsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading projects.
          </div>
        ) : projectsQuery.data && projectsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsQuery.data.items.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{project.name}</p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {project.code}
                        </p>
                        {project.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {project.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.locationCode && project.locationName ? (
                        <div>
                          <p className="font-medium text-foreground">
                            {project.locationName}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {project.locationCode}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No location scope
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <MasterStatusBadge isActive={project.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(project.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(project);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleProjectMutation.isPending}
                          onClick={() =>
                            void toggleProjectMutation
                              .mutateAsync({
                                projectId: project.id,
                                isActive: project.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the project status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {project.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={projectsQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No projects found"
            description="Create the first project or adjust the current filters to review project master data."
          />
        )}
      </ProjectPropertySection>

      <SidePanel
        description={
          editor
            ? 'Update project metadata, active state context, and optional location scope for the active company.'
            : 'Create a project that can later anchor phases, blocks, zones, units, and optional cost center linkage.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit project' : 'Create project'}
      >
        <ProjectFormPanel
          isPending={saveProjectMutation.isPending}
          locations={locations}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveProjectMutation
              .mutateAsync(
                editor
                  ? {
                      projectId: editor.id,
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
          project={projectForForm}
        />
      </SidePanel>
    </div>
  );
};
