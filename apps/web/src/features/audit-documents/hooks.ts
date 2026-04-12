'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  archiveAttachment,
  archiveAttachmentLink,
  createAttachmentDownloadAccess,
  createAttachmentLink,
  createAttachmentUploadIntent,
  finalizeAttachmentUpload,
  getAttachment,
  getAuditEvent,
  listAttachmentEntityReferences,
  listAttachmentEntityTypes,
  listAttachments,
  listAttachmentUploaders,
  listAuditEvents,
} from '../../lib/api/audit-documents';
import type {
  AttachmentEntityReferenceListQueryParams,
  AttachmentListQueryParams,
  AuditEventListQueryParams,
  CompanyUsersListQueryParams,
  CreateAttachmentLinkPayload,
  CreateAttachmentUploadIntentPayload,
} from '../../lib/api/types';

const assertCompanyId = (companyId: string | undefined): string => {
  if (!companyId) {
    throw new Error('A company context is required for audit and document operations.');
  }

  return companyId;
};

export const auditDocumentsKeys = {
  all: (companyId: string) => ['audit-documents', companyId] as const,
  attachmentEntityTypes: (companyId: string) =>
    ['audit-documents', companyId, 'attachment-entity-types'] as const,
  attachmentEntityReferences: (
    companyId: string,
    query: AttachmentEntityReferenceListQueryParams,
  ) => ['audit-documents', companyId, 'attachment-entity-references', query] as const,
  attachmentUploaders: (
    companyId: string,
    query: CompanyUsersListQueryParams,
  ) => ['audit-documents', companyId, 'attachment-uploaders', query] as const,
  attachments: (companyId: string, query: AttachmentListQueryParams) =>
    ['audit-documents', companyId, 'attachments', query] as const,
  attachment: (companyId: string, attachmentId: string) =>
    ['audit-documents', companyId, 'attachment', attachmentId] as const,
  auditEvents: (companyId: string, query: AuditEventListQueryParams) =>
    ['audit-documents', companyId, 'audit-events', query] as const,
  auditEvent: (companyId: string, auditEventId: string) =>
    ['audit-documents', companyId, 'audit-event', auditEventId] as const,
};

const invalidateAuditDocuments = async (
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | undefined,
) => {
  if (!companyId) {
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: auditDocumentsKeys.all(companyId),
  });
};

export const useAttachmentEntityTypes = (
  companyId: string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: auditDocumentsKeys.attachmentEntityTypes(companyId ?? 'no-company'),
    queryFn: () => listAttachmentEntityTypes(assertCompanyId(companyId)),
    enabled: enabled && Boolean(companyId),
  });

export const useAttachmentEntityReferences = (
  companyId: string | undefined,
  query: AttachmentEntityReferenceListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: auditDocumentsKeys.attachmentEntityReferences(
      companyId ?? 'no-company',
      query,
    ),
    queryFn: () =>
      listAttachmentEntityReferences(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useAttachmentUploaders = (
  companyId: string | undefined,
  query: CompanyUsersListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: auditDocumentsKeys.attachmentUploaders(companyId ?? 'no-company', query),
    queryFn: () => listAttachmentUploaders(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useAttachments = (
  companyId: string | undefined,
  query: AttachmentListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: auditDocumentsKeys.attachments(companyId ?? 'no-company', query),
    queryFn: () => listAttachments(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useAttachment = (
  companyId: string | undefined,
  attachmentId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: auditDocumentsKeys.attachment(companyId ?? 'no-company', attachmentId),
    queryFn: () => getAttachment(assertCompanyId(companyId), attachmentId),
    enabled: enabled && Boolean(companyId) && attachmentId.length > 0,
  });

export const useCreateAttachmentUploadIntent = (companyId: string | undefined) =>
  useMutation({
    mutationFn: (payload: CreateAttachmentUploadIntentPayload) =>
      createAttachmentUploadIntent(assertCompanyId(companyId), payload),
  });

export const useFinalizeAttachmentUpload = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) =>
      finalizeAttachmentUpload(assertCompanyId(companyId), attachmentId),
    onSuccess: async (attachment) => {
      if (companyId) {
        queryClient.setQueryData(
          auditDocumentsKeys.attachment(companyId, attachment.id),
          attachment,
        );
      }

      await invalidateAuditDocuments(queryClient, companyId);
    },
  });
};

export const useCreateAttachmentLink = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attachmentId,
      payload,
    }: {
      attachmentId: string;
      payload: CreateAttachmentLinkPayload;
    }) => createAttachmentLink(assertCompanyId(companyId), attachmentId, payload),
    onSuccess: async (attachment) => {
      if (companyId) {
        queryClient.setQueryData(
          auditDocumentsKeys.attachment(companyId, attachment.id),
          attachment,
        );
      }

      await invalidateAuditDocuments(queryClient, companyId);
    },
  });
};

export const useArchiveAttachmentLink = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attachmentId,
      attachmentLinkId,
    }: {
      attachmentId: string;
      attachmentLinkId: string;
    }) =>
      archiveAttachmentLink(
        assertCompanyId(companyId),
        attachmentId,
        attachmentLinkId,
      ),
    onSuccess: async (attachment) => {
      if (companyId) {
        queryClient.setQueryData(
          auditDocumentsKeys.attachment(companyId, attachment.id),
          attachment,
        );
      }

      await invalidateAuditDocuments(queryClient, companyId);
    },
  });
};

export const useArchiveAttachment = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) =>
      archiveAttachment(assertCompanyId(companyId), attachmentId),
    onSuccess: async (attachment) => {
      if (companyId) {
        queryClient.setQueryData(
          auditDocumentsKeys.attachment(companyId, attachment.id),
          attachment,
        );
      }

      await invalidateAuditDocuments(queryClient, companyId);
    },
  });
};

export const useCreateAttachmentDownloadAccess = (
  companyId: string | undefined,
) =>
  useMutation({
    mutationFn: (attachmentId: string) =>
      createAttachmentDownloadAccess(assertCompanyId(companyId), attachmentId),
  });

export const useAuditEvents = (
  companyId: string | undefined,
  query: AuditEventListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: auditDocumentsKeys.auditEvents(companyId ?? 'no-company', query),
    queryFn: () => listAuditEvents(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useAuditEvent = (
  companyId: string | undefined,
  auditEventId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: auditDocumentsKeys.auditEvent(companyId ?? 'no-company', auditEventId),
    queryFn: () => getAuditEvent(assertCompanyId(companyId), auditEventId),
    enabled: enabled && Boolean(companyId) && auditEventId.length > 0,
  });
