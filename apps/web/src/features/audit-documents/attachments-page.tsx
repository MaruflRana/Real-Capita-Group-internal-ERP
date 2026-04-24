'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button, buttonVariants, cn } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { Input } from '../../components/ui/input';
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
import { listAttachments } from '../../lib/api/audit-documents';
import type { AttachmentEntityType, AttachmentStatus } from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  buildExportFileName,
  exportPaginatedCsv,
  getExportDateStamp,
} from '../../lib/output';
import { getAttachmentDetailRoute } from '../../lib/routes';
import { AttachmentUploadPanel } from './forms';
import {
  useAttachmentEntityReferences,
  useAttachmentEntityTypes,
  useAttachments,
  useAttachmentUploaders,
} from './hooks';
import {
  AttachmentActionSurface,
  AttachmentEntityAttachmentsWidget,
  AttachmentLinkBadgeRow,
  AttachmentStatusBadge,
  AuditDocumentsFilterCard,
  AuditDocumentsPageHeader,
  AuditDocumentsQueryErrorBanner,
  AuditDocumentsReadOnlyNotice,
  AuditDocumentsSection,
  DocumentsAccessRequiredState,
} from './shared';
import {
  ATTACHMENT_STATUS_OPTIONS,
  formatFileSize,
  getReferenceOptionLabel,
  getReferenceSummary,
  getUserLabel,
  normalizeOptionalText,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const AttachmentsPage = () => {
  const router = useRouter();
  const { canAccessDocuments, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessDocuments && Boolean(companyId);
  const isAdmin = user?.roles.includes('company_admin') ?? false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [entityIdFilter, setEntityIdFilter] = useState('');
  const [entitySearch, setEntitySearch] = useState('');
  const [uploaderFilter, setUploaderFilter] = useState('');
  const [mimeTypeFilter, setMimeTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const deferredEntitySearch = useDeferredValue(entitySearch);

  const attachmentListEnabled =
    isEnabled && (isAdmin || (entityTypeFilter.length > 0 && entityIdFilter.length > 0));

  const entityTypeQuery = useAttachmentEntityTypes(companyId, isEnabled);
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
  const entityReferenceQuery = useAttachmentEntityReferences(
    companyId,
    {
      entityType: entityTypeFilter as AttachmentEntityType,
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'primaryLabel',
      sortOrder: 'asc',
      ...(deferredEntitySearch ? { search: deferredEntitySearch } : {}),
    },
    isEnabled && entityTypeFilter.length > 0,
  );

  const listQuery = useMemo(
    () => {
      const normalizedMimeType = normalizeOptionalText(mimeTypeFilter);

      return {
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(statusFilter ? { status: statusFilter as AttachmentStatus } : {}),
        ...(entityTypeFilter && entityIdFilter
          ? {
              entityType: entityTypeFilter as AttachmentEntityType,
              entityId: entityIdFilter,
            }
          : {}),
        ...(uploaderFilter ? { uploadedByUserId: uploaderFilter } : {}),
        ...(normalizedMimeType ? { mimeType: normalizedMimeType } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      };
    },
    [
      dateFrom,
      dateTo,
      deferredSearch,
      entityIdFilter,
      entityTypeFilter,
      mimeTypeFilter,
      page,
      statusFilter,
      uploaderFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [
    dateFrom,
    dateTo,
    deferredSearch,
    entityIdFilter,
    entityTypeFilter,
    mimeTypeFilter,
    statusFilter,
    uploaderFilter,
  ]);

  useEffect(() => {
    setEntityIdFilter('');
    setEntitySearch('');
  }, [entityTypeFilter]);

  const attachmentsQuery = useAttachments(
    companyId,
    listQuery,
    attachmentListEnabled,
  );

  const selectedEntityReference =
    entityReferenceQuery.data?.items.find((item) => item.id === entityIdFilter) ?? null;

  if (!user) {
    return null;
  }

  if (!canAccessDocuments) {
    return <DocumentsAccessRequiredState />;
  }

  const referenceError =
    entityReferenceQuery.isError && isApiError(entityReferenceQuery.error)
      ? entityReferenceQuery.error.apiError.message
      : null;
  const uploadersError =
    uploaderQuery.isError && isApiError(uploaderQuery.error)
      ? uploaderQuery.error.apiError.message
      : null;
  const entityTypesError =
    entityTypeQuery.isError && isApiError(entityTypeQuery.error)
      ? entityTypeQuery.error.apiError.message
      : null;

  const handleExport = async () => {
    if (!companyId || !attachmentListEnabled) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      await exportPaginatedCsv({
        columns: [
          {
            header: 'Attachment ID',
            value: (attachment) => attachment.id,
          },
          {
            header: 'Original File Name',
            value: (attachment) => attachment.originalFileName,
          },
          {
            header: 'Status',
            value: (attachment) => attachment.status,
          },
          {
            header: 'Uploader',
            value: (attachment) =>
              getUserLabel(
                attachment.uploadedByEmail,
                attachment.uploadedById,
                'Unknown uploader',
              ),
          },
          {
            header: 'Mime Type',
            value: (attachment) => attachment.mimeType,
          },
          {
            header: 'Size (Bytes)',
            value: (attachment) => attachment.sizeBytes,
          },
          {
            header: 'Linked Entities',
            value: (attachment) =>
              attachment.links
                .filter((link) => link.isActive)
                .map((link) => `${link.entityType}:${link.entityId}`)
                .join('; '),
          },
          {
            header: 'Created At',
            value: (attachment) => attachment.createdAt,
          },
        ],
        companyId,
        fileName: buildExportFileName([
          user.currentCompany.slug,
          'attachments',
          'export',
          getExportDateStamp(),
        ]),
        listFn: listAttachments,
        query: listQuery,
      });
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the attachment list.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AuditDocumentsPageHeader
        title="Attachments"
        description="Manage attachment metadata, upload files directly to secure storage, finalize upload state through the API, and review linked-entity context without leaving the frontend-only shell."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <div className="flex flex-wrap gap-2">
            <OutputActionGroup
              exportDisabled={!attachmentListEnabled}
              isExporting={isExporting}
              onExport={() => void handleExport()}
            />
            <Button
              onClick={() => {
                setActionError(null);
                setUploadPanelOpen(true);
              }}
            >
              New attachment
            </Button>
          </div>
        }
      />

      {actionError ? <AuditDocumentsQueryErrorBanner message={actionError} /> : null}
      {exportError ? <AuditDocumentsQueryErrorBanner message={exportError} /> : null}
      {entityTypesError ? <AuditDocumentsQueryErrorBanner message={entityTypesError} /> : null}
      {uploadersError ? <AuditDocumentsQueryErrorBanner message={uploadersError} /> : null}

      {!isAdmin ? (
        <AuditDocumentsReadOnlyNotice
          title="Entity-scoped document browsing"
          description="This session has document access, but non-admin attachment listing still requires a linked entity filter. Upload and detail operations continue to use the same backend authorization model."
        />
      ) : null}

      <AttachmentActionSurface
        title="Secure upload workflow"
        description="Start with attachment metadata, upload file bytes directly to the storage URL returned by the API, then finalize and link the attachment to a supported company-scoped record."
        action={
          <Button
            onClick={() => {
              setActionError(null);
              setUploadPanelOpen(true);
            }}
            variant="outline"
          >
            Start upload
          </Button>
        }
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Company admins can browse the full attachment scope in the active company.
          Other document-access roles must choose a linked entity to query attachment
          metadata safely.
        </p>
      </AttachmentActionSurface>

      <AuditDocumentsSection
        title="Attachment list"
        description="Filter by linked entity, uploader, status, mime type, and created date to keep the document workspace operational and traceable."
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
            <Label htmlFor="attachments-search">Search</Label>
            <Input
              id="attachments-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by original filename or storage key"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments-status-filter">Upload status</Label>
            <Select
              id="attachments-status-filter"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="">All statuses</option>
              {ATTACHMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments-entity-type-filter">Entity type</Label>
            <Select
              id="attachments-entity-type-filter"
              onChange={(event) => setEntityTypeFilter(event.target.value)}
              value={entityTypeFilter}
            >
              <option value="">
                {entityTypeQuery.isPending ? 'Loading entity types...' : 'All entity types'}
              </option>
              {entityTypeQuery.data?.items.map((option) => (
                <option key={option.entityType} value={option.entityType}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="attachments-entity-search">Linked entity search</Label>
            <Input
              disabled={entityTypeFilter.length === 0}
              id="attachments-entity-search"
              onChange={(event) => setEntitySearch(event.target.value)}
              placeholder="Search the selected linked-entity scope"
              value={entitySearch}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments-entity-id-filter">Linked entity</Label>
            <Select
              disabled={entityTypeFilter.length === 0}
              id="attachments-entity-id-filter"
              onChange={(event) => setEntityIdFilter(event.target.value)}
              value={entityIdFilter}
            >
              <option value="">
                {entityTypeFilter.length === 0
                  ? 'Select entity type first'
                  : entityReferenceQuery.isPending
                    ? 'Loading linked entities...'
                    : 'All linked entities'}
              </option>
              {entityReferenceQuery.data?.items.map((reference) => (
                <option key={reference.id} value={reference.id}>
                  {getReferenceOptionLabel(reference)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments-uploader-filter">Uploader</Label>
            <Select
              id="attachments-uploader-filter"
              onChange={(event) => setUploaderFilter(event.target.value)}
              value={uploaderFilter}
            >
              <option value="">
                {uploaderQuery.isPending ? 'Loading uploaders...' : 'All uploaders'}
              </option>
              {uploaderQuery.data?.items.map((uploader) => (
                <option key={uploader.id} value={uploader.id}>
                  {getUserLabel(uploader.email, uploader.id, 'Unknown uploader')}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments-mime-type-filter">Mime type</Label>
            <Input
              id="attachments-mime-type-filter"
              onChange={(event) => setMimeTypeFilter(event.target.value)}
              placeholder="application/pdf"
              value={mimeTypeFilter}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments-date-from">Created from</Label>
            <Input
              id="attachments-date-from"
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments-date-to">Created to</Label>
            <Input
              id="attachments-date-to"
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </div>
        </AuditDocumentsFilterCard>

        {referenceError ? <AuditDocumentsQueryErrorBanner message={referenceError} /> : null}

        {selectedEntityReference ? (
          <AttachmentEntityAttachmentsWidget
            attachments={attachmentsQuery.data?.items ?? []}
            description="This reusable entity-linked widget keeps the selected business context visible while you browse the operational attachment table."
            title={`Linked entity scope: ${getReferenceSummary(selectedEntityReference)}`}
          />
        ) : null}

        {!attachmentListEnabled ? (
          <EmptyState
            title="Select an attachment scope"
            description={
              isAdmin
                ? 'Apply filters or browse the current company attachment scope.'
                : 'Choose both an entity type and a linked entity to load attachment metadata for this document-access session.'
            }
          />
        ) : attachmentsQuery.isError && isApiError(attachmentsQuery.error) ? (
          <AuditDocumentsQueryErrorBanner
            message={attachmentsQuery.error.apiError.message}
          />
        ) : attachmentsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading attachments.
          </div>
        ) : attachmentsQuery.data && attachmentsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>Type / size</TableHead>
                  <TableHead>Linked entities</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attachmentsQuery.data.items.map((attachment) => (
                  <TableRow key={attachment.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {attachment.originalFileName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {attachment.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AttachmentStatusBadge status={attachment.status} />
                    </TableCell>
                    <TableCell>
                      {getUserLabel(
                        attachment.uploadedByEmail,
                        attachment.uploadedById,
                        'Unknown uploader',
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{attachment.mimeType}</p>
                        <p className="text-muted-foreground">
                          {formatFileSize(attachment.sizeBytes)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AttachmentLinkBadgeRow links={attachment.links} />
                    </TableCell>
                    <TableCell>{formatDateTime(attachment.createdAt)}</TableCell>
                    <TableCell>
                      <Link
                        className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                        href={getAttachmentDetailRoute(attachment.id)}
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={attachmentsQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No attachments found"
            description="Start a secure upload or adjust the current filters to review attachment metadata in this company scope."
          />
        )}
      </AuditDocumentsSection>

      <SidePanel
        description="Create attachment metadata, upload directly to secure storage, and finalize through the backend upload contract without proxying file bytes through Next.js."
        onClose={() => setUploadPanelOpen(false)}
        open={uploadPanelOpen}
        title="New attachment"
      >
        {companyId ? (
          <AttachmentUploadPanel
            companyId={companyId}
            onClose={() => setUploadPanelOpen(false)}
            onUploaded={(attachment) => {
              setActionError(null);
              setUploadPanelOpen(false);
              void router.push(getAttachmentDetailRoute(attachment.id));
            }}
          />
        ) : null}
      </SidePanel>
    </div>
  );
};
