'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button, buttonVariants, cn } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
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
import { formatDateTime } from '../../lib/format';
import { APP_ROUTES } from '../../lib/routes';
import { AttachmentLinkFormPanel } from './forms';
import {
  useArchiveAttachment,
  useArchiveAttachmentLink,
  useAttachment,
  useAttachmentEntityTypes,
  useCreateAttachmentDownloadAccess,
  useCreateAttachmentLink,
  useFinalizeAttachmentUpload,
} from './hooks';
import {
  ActiveLinkSummary,
  AttachmentActionSurface,
  AttachmentStatusBadge,
  AuditDocumentsPageHeader,
  AuditDocumentsQueryErrorBanner,
  AuditDocumentsReadOnlyNotice,
  AuditDocumentsSection,
  DocumentsAccessRequiredState,
  KeyValueList,
} from './shared';
import {
  formatAttachmentEntityTypeLabel,
  formatFileSize,
  getUserLabel,
} from './utils';

export const AttachmentDetailPage = ({
  attachmentId,
}: {
  attachmentId: string;
}) => {
  const { canAccessDocuments, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessDocuments && Boolean(companyId);

  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadAccess, setDownloadAccess] = useState<{
    attachmentId: string;
    fileName: string;
    mimeType: string;
    downloadUrl: string;
    expiresAt: string;
  } | null>(null);

  const attachmentQuery = useAttachment(companyId, attachmentId, isEnabled);
  const entityTypesQuery = useAttachmentEntityTypes(
    companyId,
    isEnabled && linkPanelOpen,
  );
  const finalizeAttachmentMutation = useFinalizeAttachmentUpload(companyId);
  const createAttachmentLinkMutation = useCreateAttachmentLink(companyId);
  const archiveAttachmentLinkMutation = useArchiveAttachmentLink(companyId);
  const archiveAttachmentMutation = useArchiveAttachment(companyId);
  const createDownloadAccessMutation = useCreateAttachmentDownloadAccess(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessDocuments) {
    return <DocumentsAccessRequiredState />;
  }

  const attachment = attachmentQuery.data;

  const handleActionError = (error: unknown, fallbackMessage: string) => {
    if (isApiError(error)) {
      setActionError(error.apiError.message);
      return;
    }

    if (error instanceof Error) {
      setActionError(error.message);
      return;
    }

    setActionError(fallbackMessage);
  };

  return (
    <div className="space-y-6">
      <AuditDocumentsPageHeader
        title="Attachment Detail"
        description="Review attachment metadata, secure download access, upload state, and normalized entity-link relationships from the current company scope."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={APP_ROUTES.auditDocumentsAttachments}
          >
            Back to attachments
          </Link>
        }
      />

      {actionError ? <AuditDocumentsQueryErrorBanner message={actionError} /> : null}

      {attachmentQuery.isPending ? (
        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
          Loading attachment detail.
        </div>
      ) : attachmentQuery.isError && isApiError(attachmentQuery.error) ? (
        <AuditDocumentsQueryErrorBanner
          message={attachmentQuery.error.apiError.message}
        />
      ) : attachment ? (
        <>
          <AuditDocumentsSection
            title={attachment.originalFileName}
            description="Attachment metadata stays company-scoped. Finalization, download access, and linking actions all continue to use the existing NestJS REST contracts."
            actions={
              <div className="flex flex-wrap gap-2">
                {attachment.status === 'PENDING_UPLOAD' ? (
                  <Button
                    disabled={finalizeAttachmentMutation.isPending}
                    onClick={() => {
                      void finalizeAttachmentMutation
                        .mutateAsync(attachment.id)
                        .then(() => {
                          setActionError(null);
                        })
                        .catch((error) =>
                          handleActionError(error, 'Unable to finalize the attachment upload.'),
                        );
                    }}
                  >
                    {finalizeAttachmentMutation.isPending
                      ? 'Finalizing...'
                      : 'Finalize upload'}
                  </Button>
                ) : null}
                {attachment.status !== 'ARCHIVED' ? (
                  <Button
                    disabled={archiveAttachmentMutation.isPending}
                    onClick={() => {
                      if (!window.confirm('Archive this attachment now?')) {
                        return;
                      }

                      void archiveAttachmentMutation
                        .mutateAsync(attachment.id)
                        .then(() => {
                          setActionError(null);
                          setDownloadAccess(null);
                        })
                        .catch((error) =>
                          handleActionError(error, 'Unable to archive the attachment.'),
                        );
                    }}
                    variant="ghost"
                  >
                    Archive attachment
                  </Button>
                ) : null}
              </div>
            }
          >
            <div className="flex flex-wrap gap-2">
              <AttachmentStatusBadge status={attachment.status} />
            </div>

            {attachment.status === 'PENDING_UPLOAD' ? (
              <AuditDocumentsReadOnlyNotice
                title="Upload still pending"
                description="Direct storage upload must finish successfully before this attachment becomes available for linking or secure download."
              />
            ) : null}
            {attachment.status === 'ARCHIVED' ? (
              <AuditDocumentsReadOnlyNotice
                title="Attachment archived"
                description="Archived attachments stay visible for auditability, but new secure-download or active-link management actions are blocked in this phase."
              />
            ) : null}

            <KeyValueList
              items={[
                {
                  label: 'Attachment id',
                  value: attachment.id,
                },
                {
                  label: 'Mime type',
                  value: attachment.mimeType,
                },
                {
                  label: 'File size',
                  value: formatFileSize(attachment.sizeBytes),
                },
                {
                  label: 'Uploaded by',
                  value: getUserLabel(
                    attachment.uploadedByEmail,
                    attachment.uploadedById,
                    'Unknown uploader',
                  ),
                },
                {
                  label: 'Upload completed',
                  value: formatDateTime(attachment.uploadCompletedAt, 'Pending'),
                },
                {
                  label: 'Archived at',
                  value: formatDateTime(attachment.archivedAt, 'Not archived'),
                },
                {
                  label: 'Active link count',
                  value: String(attachment.activeLinkCount),
                },
                {
                  label: 'Checksum',
                  value: attachment.checksumSha256 ?? 'Not supplied',
                },
                {
                  label: 'Object etag',
                  value: attachment.objectEtag ?? 'Not yet recorded',
                },
                {
                  label: 'Created',
                  value: formatDateTime(attachment.createdAt),
                },
                {
                  label: 'Updated',
                  value: formatDateTime(attachment.updatedAt),
                },
              ]}
            />
          </AuditDocumentsSection>

          <AttachmentActionSurface
            title="Secure download access"
            description="Generate a short-lived authorized download URL through the backend. Storage details remain hidden behind the API contract."
            action={
              <Button
                disabled={
                  attachment.status !== 'AVAILABLE' ||
                  createDownloadAccessMutation.isPending
                }
                onClick={() => {
                  void createDownloadAccessMutation
                    .mutateAsync(attachment.id)
                    .then((response) => {
                      setActionError(null);
                      setDownloadAccess(response);
                    })
                    .catch((error) =>
                      handleActionError(error, 'Unable to generate secure download access.'),
                    );
                }}
              >
                {createDownloadAccessMutation.isPending
                  ? 'Generating...'
                  : 'Generate secure download'}
              </Button>
            }
          >
            {attachment.status !== 'AVAILABLE' ? (
              <AuditDocumentsReadOnlyNotice
                title="Download access unavailable"
                description="Only finalized available attachments can return a secure read/download URL."
              />
            ) : downloadAccess ? (
              <div className="space-y-4">
                <KeyValueList
                  items={[
                    {
                      label: 'Download file',
                      value: downloadAccess.fileName,
                    },
                    {
                      label: 'Mime type',
                      value: downloadAccess.mimeType,
                    },
                    {
                      label: 'URL expires',
                      value: formatDateTime(downloadAccess.expiresAt),
                    },
                  ]}
                />
                <a
                  className={cn(buttonVariants({ variant: 'outline' }))}
                  href={downloadAccess.downloadUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open secure download
                </a>
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Generate a short-lived URL when an authorized user needs to view or
                download this file.
              </p>
            )}
          </AttachmentActionSurface>

          <AttachmentActionSurface
            title="Entity links"
            description="Link this attachment to a supported entity type so downstream module pages can browse documents through a normalized company-scoped relationship."
            action={
              <Button
                disabled={attachment.status !== 'AVAILABLE'}
                onClick={() => {
                  setActionError(null);
                  setLinkPanelOpen(true);
                }}
                variant="outline"
              >
                Add entity link
              </Button>
            }
          >
            <div className="space-y-5">
              {attachment.status !== 'AVAILABLE' ? (
                <AuditDocumentsReadOnlyNotice
                  title="Linking locked"
                  description="Entity links can only be created after the attachment finishes upload finalization successfully."
                />
              ) : null}

              <ActiveLinkSummary links={attachment.links} />

              {attachment.links.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity type</TableHead>
                      <TableHead>Entity id</TableHead>
                      <TableHead>Created by</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="w-[160px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attachment.links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          {formatAttachmentEntityTypeLabel(link.entityType)}
                        </TableCell>
                        <TableCell>{link.entityId}</TableCell>
                        <TableCell>
                          {getUserLabel(
                            link.createdByEmail,
                            link.createdById,
                            'Unknown user',
                          )}
                        </TableCell>
                        <TableCell>{formatDateTime(link.createdAt)}</TableCell>
                        <TableCell>
                          {link.isActive
                            ? 'Active'
                            : `Archived ${formatDateTime(link.removedAt, 'Inactive')}`}
                        </TableCell>
                        <TableCell>
                          {link.isActive ? (
                            <Button
                              disabled={archiveAttachmentLinkMutation.isPending}
                              onClick={() => {
                                if (!window.confirm('Archive this attachment link?')) {
                                  return;
                                }

                                void archiveAttachmentLinkMutation
                                  .mutateAsync({
                                    attachmentId: attachment.id,
                                    attachmentLinkId: link.id,
                                  })
                                  .then(() => setActionError(null))
                                  .catch((error) =>
                                    handleActionError(
                                      error,
                                      'Unable to archive the attachment link.',
                                    ),
                                  );
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              Archive link
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Read-only
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No entity links yet"
                  description="Create the first normalized entity link once the attachment becomes available."
                />
              )}
            </div>
          </AttachmentActionSurface>
        </>
      ) : null}

      <SidePanel
        description="Choose a supported entity type and a company-scoped record to create or reactivate a normalized attachment link."
        onClose={() => setLinkPanelOpen(false)}
        open={linkPanelOpen}
        title="Add entity link"
      >
        {attachment ? (
          entityTypesQuery.isError && isApiError(entityTypesQuery.error) ? (
            <AuditDocumentsQueryErrorBanner
              message={entityTypesQuery.error.apiError.message}
            />
          ) : entityTypesQuery.isPending ? (
            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
              Loading supported entity types.
            </div>
          ) : (entityTypesQuery.data?.items.length ?? 0) > 0 ? (
            <AttachmentLinkFormPanel
              companyId={companyId ?? ''}
              entityTypeOptions={entityTypesQuery.data?.items ?? []}
              isPending={createAttachmentLinkMutation.isPending}
              onClose={() => setLinkPanelOpen(false)}
              onSubmit={(payload) =>
                createAttachmentLinkMutation
                  .mutateAsync({
                    attachmentId: attachment.id,
                    payload,
                  })
                  .then(() => {
                    setActionError(null);
                    setLinkPanelOpen(false);
                  })
              }
            />
          ) : (
            <AuditDocumentsReadOnlyNotice
              title="No supported entity types"
              description="The current company-scoped session does not have any attachment-link entity types available for this user."
            />
          )
        ) : null}
      </SidePanel>
    </div>
  );
};
