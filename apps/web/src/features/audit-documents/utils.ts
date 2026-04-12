import {
  ATTACHMENT_STATUSES,
  AUDIT_ENTITY_TYPES,
  AUDIT_EVENT_CATEGORIES,
} from '../../lib/api/types';
import type {
  AttachmentEntityReferenceRecord,
  AttachmentEntityType,
  AttachmentLinkRecord,
  AttachmentStatus,
  AuditEntityType,
  AuditEventCategory,
  AttachmentUploadIntentResponse,
} from '../../lib/api/types';

export const PAGE_SIZE = 10;
export const OPTION_PAGE_SIZE = 25;

export const normalizeOptionalText = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

export const formatAttachmentStatusLabel = (status: AttachmentStatus) => {
  switch (status) {
    case 'PENDING_UPLOAD':
      return 'Pending upload';
    case 'AVAILABLE':
      return 'Available';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return status;
  }
};

const attachmentEntityTypeLabels: Record<AttachmentEntityType, string> = {
  COMPANY: 'Company',
  USER: 'User',
  EMPLOYEE: 'Employee',
  PROJECT: 'Project',
  UNIT: 'Unit',
  CUSTOMER: 'Customer',
  BOOKING: 'Booking',
  SALE_CONTRACT: 'Sale Contract',
  VOUCHER: 'Voucher',
  PAYROLL_RUN: 'Payroll Run',
};

const auditEntityTypeLabels: Record<AuditEntityType, string> = {
  COMPANY: 'Company',
  LOCATION: 'Location',
  DEPARTMENT: 'Department',
  USER: 'User',
  USER_ROLE: 'User Role',
  EMPLOYEE: 'Employee',
  PROJECT: 'Project',
  UNIT: 'Unit',
  CUSTOMER: 'Customer',
  BOOKING: 'Booking',
  SALE_CONTRACT: 'Sale Contract',
  VOUCHER: 'Voucher',
  PAYROLL_RUN: 'Payroll Run',
  ATTACHMENT: 'Attachment',
  ATTACHMENT_LINK: 'Attachment Link',
};

export const formatAttachmentEntityTypeLabel = (
  entityType: AttachmentEntityType,
) => attachmentEntityTypeLabels[entityType] ?? entityType;

export const formatAuditEntityTypeLabel = (entityType: AuditEntityType) =>
  auditEntityTypeLabels[entityType] ?? entityType;

export const formatAuditEventCategoryLabel = (category: AuditEventCategory) => {
  switch (category) {
    case 'AUTH':
      return 'Auth';
    case 'ADMIN':
      return 'Admin';
    case 'ACCOUNTING':
      return 'Accounting';
    case 'CRM_PROPERTY_DESK':
      return 'CRM / Property Desk';
    case 'PAYROLL':
      return 'Payroll';
    case 'ATTACHMENT':
      return 'Attachment';
    default:
      return category;
  }
};

export const ATTACHMENT_STATUS_OPTIONS = ATTACHMENT_STATUSES.map((status) => ({
  value: status,
  label: formatAttachmentStatusLabel(status),
}));

export const AUDIT_EVENT_CATEGORY_OPTIONS = AUDIT_EVENT_CATEGORIES.map(
  (category) => ({
    value: category,
    label: formatAuditEventCategoryLabel(category),
  }),
);

export const AUDIT_ENTITY_TYPE_OPTIONS = AUDIT_ENTITY_TYPES.map((entityType) => ({
  value: entityType,
  label: formatAuditEntityTypeLabel(entityType),
}));

export const formatFileSize = (value: string | number | null | undefined) => {
  const size =
    typeof value === 'number' ? value : value ? Number(value) : Number.NaN;

  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let currentSize = size;

  while (currentSize >= 1024 && unitIndex < units.length - 1) {
    currentSize /= 1024;
    unitIndex += 1;
  }

  return `${currentSize.toFixed(currentSize >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const shortenId = (value: string) =>
  value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;

export const getUserLabel = (
  email: string | null | undefined,
  userId: string | null | undefined,
  emptyLabel = 'System',
) => {
  if (email) {
    return email;
  }

  if (userId) {
    return shortenId(userId);
  }

  return emptyLabel;
};

export const formatAttachmentLinkLabel = (link: AttachmentLinkRecord) =>
  `${formatAttachmentEntityTypeLabel(link.entityType)} | ${shortenId(link.entityId)}`;

export const getReferenceOptionLabel = (
  reference: AttachmentEntityReferenceRecord,
) =>
  [
    reference.primaryLabel,
    reference.secondaryLabel,
    reference.contextLabel,
  ]
    .filter(Boolean)
    .join(' | ');

export const getReferenceSummary = (
  reference: AttachmentEntityReferenceRecord | null | undefined,
) => {
  if (!reference) {
    return 'No linked entity selected';
  }

  return getReferenceOptionLabel(reference);
};

export const buildAttachmentUploadSummary = (
  response: AttachmentUploadIntentResponse,
) =>
  [
    response.attachment.originalFileName,
    response.attachment.mimeType,
    formatAttachmentStatusLabel(response.attachment.status),
  ].join(' | ');

export const getAuditTargetLabel = ({
  targetEntityType,
  targetEntityId,
}: {
  targetEntityType: AuditEntityType | null;
  targetEntityId: string | null;
}) => {
  if (!targetEntityType || !targetEntityId) {
    return 'No target entity';
  }

  return `${formatAuditEntityTypeLabel(targetEntityType)} | ${shortenId(targetEntityId)}`;
};

export const getAuditMetadataPreview = (
  metadata: Record<string, unknown> | null | undefined,
) => {
  if (!metadata) {
    return 'No metadata';
  }

  const entries = Object.entries(metadata).slice(0, 3);

  if (entries.length === 0) {
    return 'No metadata';
  }

  return entries
    .map(([key, value]) => `${key}: ${stringifyMetadataValue(value)}`)
    .join(' | ');
};

export const stringifyMetadataValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'string') {
    return value.length > 80 ? `${value.slice(0, 77)}...` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    const serialized = JSON.stringify(value);

    return serialized.length > 80 ? `${serialized.slice(0, 77)}...` : serialized;
  } catch {
    return 'Unserializable metadata';
  }
};

export const uploadFileToPresignedUrl = ({
  file,
  uploadIntent,
  onProgress,
}: {
  file: File;
  uploadIntent: AttachmentUploadIntentResponse;
  onProgress?: (progress: number) => void;
}) =>
  new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open(uploadIntent.uploadMethod || 'PUT', uploadIntent.uploadUrl, true);

    for (const [header, value] of Object.entries(uploadIntent.requiredHeaders)) {
      request.setRequestHeader(header, value);
    }

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    });

    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(
        new Error(
          `Direct upload failed with status ${request.status || 'unknown'}.`,
        ),
      );
    });

    request.addEventListener('error', () => {
      reject(new Error('Direct upload failed before the storage service accepted the file.'));
    });

    request.send(file);
  });
