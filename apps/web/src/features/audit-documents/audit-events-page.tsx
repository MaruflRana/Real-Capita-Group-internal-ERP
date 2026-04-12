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
import type { AuditEntityType, AuditEventCategory } from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { useAttachmentUploaders, useAuditEvent, useAuditEvents } from './hooks';
import {
  AuditAccessRequiredState,
  AuditCategoryBadge,
  AuditDocumentsFilterCard,
  AuditDocumentsPageHeader,
  AuditDocumentsQueryErrorBanner,
  AuditDocumentsReadOnlyNotice,
  AuditDocumentsSection,
  KeyValueList,
  MetadataPreviewCard,
} from './shared';
import {
  AUDIT_ENTITY_TYPE_OPTIONS,
  AUDIT_EVENT_CATEGORY_OPTIONS,
  getAuditMetadataPreview,
  getAuditTargetLabel,
  getUserLabel,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const AuditEventsPage = () => {
  const { canAccessAuditEvents, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessAuditEvents && Boolean(companyId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [targetEntityTypeFilter, setTargetEntityTypeFilter] = useState('');
  const [targetEntityIdFilter, setTargetEntityIdFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAuditEventId, setSelectedAuditEventId] = useState<string | null>(
    null,
  );
  const deferredSearch = useDeferredValue(search);

  const uploaderQuery = useAttachmentUploaders(
    companyId,
    {
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'email',
      sortOrder: 'asc',
    },
    isEnabled,
  );

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(categoryFilter
        ? { category: categoryFilter as AuditEventCategory }
        : {}),
      ...(eventTypeFilter ? { eventType: eventTypeFilter.trim() } : {}),
      ...(actorFilter ? { actorUserId: actorFilter } : {}),
      ...(targetEntityTypeFilter
        ? { targetEntityType: targetEntityTypeFilter as AuditEntityType }
        : {}),
      ...(targetEntityIdFilter ? { targetEntityId: targetEntityIdFilter.trim() } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [
      actorFilter,
      categoryFilter,
      dateFrom,
      dateTo,
      deferredSearch,
      eventTypeFilter,
      page,
      targetEntityIdFilter,
      targetEntityTypeFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [
    actorFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    deferredSearch,
    eventTypeFilter,
    targetEntityIdFilter,
    targetEntityTypeFilter,
  ]);

  const auditEventsQuery = useAuditEvents(companyId, listQuery, isEnabled);
  const auditEventQuery = useAuditEvent(
    companyId,
    selectedAuditEventId ?? '',
    isEnabled && selectedAuditEventId !== null,
  );

  if (!user) {
    return null;
  }

  if (!canAccessAuditEvents) {
    return <AuditAccessRequiredState />;
  }

  const uploadersError =
    uploaderQuery.isError && isApiError(uploaderQuery.error)
      ? uploaderQuery.error.apiError.message
      : null;

  return (
    <div className="space-y-6">
      <AuditDocumentsPageHeader
        title="Audit Events"
        description="Browse company-scoped audit events with operational filters, compact metadata previews, and a focused detail surface for traceability."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
      />

      {uploadersError ? <AuditDocumentsQueryErrorBanner message={uploadersError} /> : null}

      <AuditDocumentsSection
        title="Audit event list"
        description="Filter by actor, category, target entity, and date range to review system activity without turning this phase into a full SIEM-style explorer."
      >
        <AuditDocumentsFilterCard>
          <div className="space-y-2">
            <Label>Company scope</Label>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground">
              <p className="font-semibold">{user.currentCompany.name}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {user.currentCompany.slug}
              </p>
            </div>
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="audit-events-search">Search</Label>
            <Input
              id="audit-events-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by event type, request id, or actor email"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-events-category-filter">Category</Label>
            <Select
              id="audit-events-category-filter"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="">All categories</option>
              {AUDIT_EVENT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-events-event-type-filter">Event type</Label>
            <Input
              id="audit-events-event-type-filter"
              onChange={(event) => setEventTypeFilter(event.target.value)}
              placeholder="attachment.upload.finalized"
              value={eventTypeFilter}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-events-actor-filter">Actor</Label>
            <Select
              id="audit-events-actor-filter"
              onChange={(event) => setActorFilter(event.target.value)}
              value={actorFilter}
            >
              <option value="">
                {uploaderQuery.isPending ? 'Loading actors...' : 'All actors'}
              </option>
              {uploaderQuery.data?.items.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {getUserLabel(actor.email, actor.id, 'Unknown actor')}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-events-target-entity-type-filter">
              Target entity type
            </Label>
            <Select
              id="audit-events-target-entity-type-filter"
              onChange={(event) => setTargetEntityTypeFilter(event.target.value)}
              value={targetEntityTypeFilter}
            >
              <option value="">All target types</option>
              {AUDIT_ENTITY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-events-target-entity-id-filter">
              Target entity id
            </Label>
            <Input
              id="audit-events-target-entity-id-filter"
              onChange={(event) => setTargetEntityIdFilter(event.target.value)}
              placeholder="Filter by exact target record id"
              value={targetEntityIdFilter}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-events-date-from">Created from</Label>
            <Input
              id="audit-events-date-from"
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-events-date-to">Created to</Label>
            <Input
              id="audit-events-date-to"
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </div>
        </AuditDocumentsFilterCard>

        {auditEventsQuery.isError && isApiError(auditEventsQuery.error) ? (
          <AuditDocumentsQueryErrorBanner
            message={auditEventsQuery.error.apiError.message}
          />
        ) : auditEventsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading audit events.
          </div>
        ) : auditEventsQuery.data && auditEventsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Event type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Request id</TableHead>
                  <TableHead>Metadata preview</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEventsQuery.data.items.map((auditEvent) => (
                  <TableRow key={auditEvent.id}>
                    <TableCell>{formatDateTime(auditEvent.createdAt)}</TableCell>
                    <TableCell>
                      {getUserLabel(
                        auditEvent.actorEmail,
                        auditEvent.actorUserId,
                        'System',
                      )}
                    </TableCell>
                    <TableCell>
                      <AuditCategoryBadge category={auditEvent.category} />
                    </TableCell>
                    <TableCell>{auditEvent.eventType}</TableCell>
                    <TableCell>
                      {getAuditTargetLabel({
                        targetEntityType: auditEvent.targetEntityType,
                        targetEntityId: auditEvent.targetEntityId,
                      })}
                    </TableCell>
                    <TableCell>{auditEvent.requestId ?? 'No request id'}</TableCell>
                    <TableCell>{getAuditMetadataPreview(auditEvent.metadata)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => setSelectedAuditEventId(auditEvent.id)}
                        size="sm"
                        variant="outline"
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={auditEventsQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No audit events found"
            description="Adjust the current filters to review company activity or wait for new events to be recorded by backend operations."
          />
        )}
      </AuditDocumentsSection>

      <SidePanel
        description="Review the selected audit event without exposing more payload detail than the backend returns safely for this operational phase."
        onClose={() => setSelectedAuditEventId(null)}
        open={selectedAuditEventId !== null}
        title="Audit event detail"
      >
        {auditEventQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading audit event detail.
          </div>
        ) : auditEventQuery.isError && isApiError(auditEventQuery.error) ? (
          <AuditDocumentsQueryErrorBanner
            message={auditEventQuery.error.apiError.message}
          />
        ) : auditEventQuery.data ? (
          <div className="space-y-5">
            <AuditDocumentsReadOnlyNotice
              title="Operational payload preview"
              description="This detail surface shows a compact metadata view only. It intentionally avoids turning the UI into a raw log dump."
            />
            <KeyValueList
              items={[
                {
                  label: 'Audit event id',
                  value: auditEventQuery.data.id,
                },
                {
                  label: 'Actor',
                  value: getUserLabel(
                    auditEventQuery.data.actorEmail,
                    auditEventQuery.data.actorUserId,
                    'System',
                  ),
                },
                {
                  label: 'Category',
                  value: auditEventQuery.data.category,
                },
                {
                  label: 'Event type',
                  value: auditEventQuery.data.eventType,
                },
                {
                  label: 'Target',
                  value: getAuditTargetLabel({
                    targetEntityType: auditEventQuery.data.targetEntityType,
                    targetEntityId: auditEventQuery.data.targetEntityId,
                  }),
                },
                {
                  label: 'Request id',
                  value: auditEventQuery.data.requestId ?? 'Not recorded',
                },
                {
                  label: 'Created',
                  value: formatDateTime(auditEventQuery.data.createdAt),
                },
              ]}
            />
            <MetadataPreviewCard metadata={auditEventQuery.data.metadata} />
          </div>
        ) : null}
      </SidePanel>
    </div>
  );
};
