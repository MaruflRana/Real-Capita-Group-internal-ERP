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
import {
  PROPERTY_DESK_LEAD_STATUSES,
  type LeadRecord,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { LeadFormPanel, type LeadFormValues } from './forms';
import { useCrmProjects, useLead, useLeads, useSaveLead, useToggleLead } from './hooks';
import {
  CrmPropertyDeskAccessRequiredState,
  CrmPropertyDeskFilterCard,
  CrmPropertyDeskPageHeader,
  CrmPropertyDeskQueryErrorBanner,
  CrmPropertyDeskSection,
  EntityStatusBadge,
  LeadStatusBadge,
} from './shared';
import {
  getProjectLabel,
  getStatusQueryValue,
  normalizeNullableId,
  normalizeOptionalTextToNull,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const LeadsPage = () => {
  const { canAccessCrmPropertyDesk, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessCrmPropertyDesk && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<LeadRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

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

  const query = useMemo(
    () => {
      const isActive = getStatusQueryValue(statusFilter);

      return {
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'updatedAt',
        sortOrder: 'desc' as const,
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
        ...(leadStatusFilter !== 'all'
          ? {
              status:
                leadStatusFilter as (typeof PROPERTY_DESK_LEAD_STATUSES)[number],
            }
          : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      };
    },
    [deferredSearch, leadStatusFilter, page, projectFilter, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, leadStatusFilter, projectFilter, statusFilter]);

  const leadsQuery = useLeads(companyId, query, isEnabled);
  const leadDetailQuery = useLead(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveLeadMutation = useSaveLead(companyId);
  const toggleLeadMutation = useToggleLead(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessCrmPropertyDesk) {
    return <CrmPropertyDeskAccessRequiredState />;
  }

  const projects = projectsQuery.data?.items ?? [];
  const leadForForm = leadDetailQuery.data ?? editor;

  const buildPayload = (values: LeadFormValues) => ({
    projectId: normalizeNullableId(values.projectId),
    fullName: values.fullName,
    email: normalizeOptionalTextToNull(values.email),
    phone: normalizeOptionalTextToNull(values.phone),
    source: normalizeOptionalTextToNull(values.source),
    status: values.status,
    notes: normalizeOptionalTextToNull(values.notes),
  });

  return (
    <div className="space-y-6">
      <CrmPropertyDeskPageHeader
        title="Leads"
        description="Track internal sales leads with project linkage where relevant, simple status handling, and clean contact data for downstream conversion."
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
            New lead
          </Button>
        }
      />

      {actionError ? <CrmPropertyDeskQueryErrorBanner message={actionError} /> : null}

      <CrmPropertyDeskSection
        title="Lead pipeline"
        description="Keep lead tracking operational and lightweight. This phase is list and form based, not a stage board."
      >
        <CrmPropertyDeskFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="lead-search">Search</Label>
            <Input
              id="lead-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leads by name, contact, source, or notes"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-project-filter">Project</Label>
            <Select
              id="lead-project-filter"
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
            <Label htmlFor="lead-crm-status-filter">Lead status</Label>
            <Select
              id="lead-crm-status-filter"
              onChange={(event) => setLeadStatusFilter(event.target.value)}
              value={leadStatusFilter}
            >
              <option value="all">All lead statuses</option>
              {PROPERTY_DESK_LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-status-filter">Record status</Label>
            <Select
              id="lead-status-filter"
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
              }
              value={statusFilter}
            >
              <option value="all">All records</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
          </div>
        </CrmPropertyDeskFilterCard>

        {leadsQuery.isError && isApiError(leadsQuery.error) ? (
          <CrmPropertyDeskQueryErrorBanner message={leadsQuery.error.apiError.message} />
        ) : null}

        {leadsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading leads.
          </div>
        ) : leadsQuery.data && leadsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Lead status</TableHead>
                  <TableHead>Record status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsQuery.data.items.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{lead.fullName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {lead.email || lead.phone || 'No contact detail'}
                        </p>
                        {lead.source ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Source: {lead.source}
                          </p>
                        ) : null}
                        {lead.notes ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {lead.notes}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.projectCode && lead.projectName ? (
                        <div>
                          <p className="font-medium text-foreground">{lead.projectName}</p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {lead.projectCode}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          General lead
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>
                      <EntityStatusBadge isActive={lead.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(lead.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(lead);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleLeadMutation.isPending}
                          onClick={() =>
                            void toggleLeadMutation
                              .mutateAsync({
                                leadId: lead.id,
                                isActive: lead.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the lead status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {lead.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={leadsQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No leads found"
            description="Create the first lead or adjust the current filters to inspect the internal lead queue."
          />
        )}
      </CrmPropertyDeskSection>

      <SidePanel
        description={
          editor
            ? 'Update lead contact data, project linkage, and simple internal status.'
            : 'Create a lead with optional project context and enough metadata to support downstream follow-up.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit lead' : 'Create lead'}
      >
        <LeadFormPanel
          isPending={saveLeadMutation.isPending}
          lead={leadForForm}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveLeadMutation
              .mutateAsync(
                editor
                  ? { leadId: editor.id, payload: buildPayload(values) }
                  : { payload: buildPayload(values) },
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
