import { apiRequest } from './client';
import { buildQueryString } from './query-string';
import type {
  AttachmentDetailRecord,
  AttachmentDownloadAccessRecord,
  AttachmentEntityReferenceListQueryParams,
  AttachmentEntityReferenceRecord,
  AttachmentEntityTypeOptionRecord,
  AttachmentListQueryParams,
  AttachmentRecord,
  AttachmentUploadIntentResponse,
  AuditEventListQueryParams,
  AuditEventRecord,
  CompanyUsersListQueryParams,
  CompanyUserRecord,
  CreateAttachmentLinkPayload,
  CreateAttachmentUploadIntentPayload,
  PaginatedResponse,
} from './types';

export const listAttachmentEntityTypes = (companyId: string) =>
  apiRequest<{ items: AttachmentEntityTypeOptionRecord[] }>(
    `companies/${companyId}/attachments/references/entity-types`,
  );

export const listAttachmentEntityReferences = (
  companyId: string,
  query: AttachmentEntityReferenceListQueryParams,
) =>
  apiRequest<PaginatedResponse<AttachmentEntityReferenceRecord>>(
    `companies/${companyId}/attachments/references/entities${buildQueryString(query)}`,
  );

export const listAttachmentUploaders = (
  companyId: string,
  query: CompanyUsersListQueryParams,
) =>
  apiRequest<PaginatedResponse<CompanyUserRecord>>(
    `companies/${companyId}/attachments/references/uploaders${buildQueryString(query)}`,
  );

export const listAttachments = (
  companyId: string,
  query: AttachmentListQueryParams,
) =>
  apiRequest<PaginatedResponse<AttachmentRecord>>(
    `companies/${companyId}/attachments${buildQueryString(query)}`,
  );

export const getAttachment = (companyId: string, attachmentId: string) =>
  apiRequest<AttachmentDetailRecord>(
    `companies/${companyId}/attachments/${attachmentId}`,
  );

export const createAttachmentUploadIntent = (
  companyId: string,
  payload: CreateAttachmentUploadIntentPayload,
) =>
  apiRequest<AttachmentUploadIntentResponse>(
    `companies/${companyId}/attachments/uploads`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const finalizeAttachmentUpload = (
  companyId: string,
  attachmentId: string,
) =>
  apiRequest<AttachmentDetailRecord>(
    `companies/${companyId}/attachments/${attachmentId}/finalize`,
    {
      method: 'POST',
      body: {},
    },
  );

export const createAttachmentLink = (
  companyId: string,
  attachmentId: string,
  payload: CreateAttachmentLinkPayload,
) =>
  apiRequest<AttachmentDetailRecord>(
    `companies/${companyId}/attachments/${attachmentId}/links`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const archiveAttachmentLink = (
  companyId: string,
  attachmentId: string,
  attachmentLinkId: string,
) =>
  apiRequest<AttachmentDetailRecord>(
    `companies/${companyId}/attachments/${attachmentId}/links/${attachmentLinkId}/archive`,
    {
      method: 'POST',
      body: {},
    },
  );

export const archiveAttachment = (companyId: string, attachmentId: string) =>
  apiRequest<AttachmentDetailRecord>(
    `companies/${companyId}/attachments/${attachmentId}/archive`,
    {
      method: 'POST',
      body: {},
    },
  );

export const createAttachmentDownloadAccess = (
  companyId: string,
  attachmentId: string,
) =>
  apiRequest<AttachmentDownloadAccessRecord>(
    `companies/${companyId}/attachments/${attachmentId}/download-url`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listAuditEvents = (
  companyId: string,
  query: AuditEventListQueryParams,
) =>
  apiRequest<PaginatedResponse<AuditEventRecord>>(
    `companies/${companyId}/audit-events${buildQueryString(query)}`,
  );

export const getAuditEvent = (companyId: string, auditEventId: string) =>
  apiRequest<AuditEventRecord>(
    `companies/${companyId}/audit-events/${auditEventId}`,
  );
