import { AttachmentEntityType } from '@prisma/client';

import {
  ROLE_COMPANY_ACCOUNTANT,
  ROLE_COMPANY_ADMIN,
  ROLE_COMPANY_HR,
  ROLE_COMPANY_PAYROLL,
  ROLE_COMPANY_SALES,
} from '../auth/constants/auth.constants';

export const ATTACHMENT_UPLOAD_URL_TTL_SECONDS = 15 * 60;
export const ATTACHMENT_DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

export const ATTACHMENT_SORT_FIELDS = [
  'createdAt',
  'mimeType',
  'originalFileName',
  'status',
  'updatedAt',
  'uploadCompletedAt',
] as const;

export const ATTACHMENT_ENTITY_ROLE_ACCESS: Record<
  AttachmentEntityType,
  string[]
> = {
  [AttachmentEntityType.COMPANY]: [ROLE_COMPANY_ADMIN],
  [AttachmentEntityType.USER]: [ROLE_COMPANY_ADMIN],
  [AttachmentEntityType.EMPLOYEE]: [
    ROLE_COMPANY_ADMIN,
    ROLE_COMPANY_HR,
    ROLE_COMPANY_PAYROLL,
  ],
  [AttachmentEntityType.PROJECT]: [ROLE_COMPANY_ADMIN, ROLE_COMPANY_SALES],
  [AttachmentEntityType.UNIT]: [ROLE_COMPANY_ADMIN, ROLE_COMPANY_SALES],
  [AttachmentEntityType.CUSTOMER]: [ROLE_COMPANY_ADMIN, ROLE_COMPANY_SALES],
  [AttachmentEntityType.BOOKING]: [ROLE_COMPANY_ADMIN, ROLE_COMPANY_SALES],
  [AttachmentEntityType.SALE_CONTRACT]: [
    ROLE_COMPANY_ADMIN,
    ROLE_COMPANY_SALES,
  ],
  [AttachmentEntityType.VOUCHER]: [
    ROLE_COMPANY_ADMIN,
    ROLE_COMPANY_ACCOUNTANT,
  ],
  [AttachmentEntityType.PAYROLL_RUN]: [
    ROLE_COMPANY_ADMIN,
    ROLE_COMPANY_HR,
    ROLE_COMPANY_PAYROLL,
  ],
};

export const ATTACHMENT_ENTITY_LABELS: Record<AttachmentEntityType, string> = {
  [AttachmentEntityType.COMPANY]: 'Company',
  [AttachmentEntityType.USER]: 'User',
  [AttachmentEntityType.EMPLOYEE]: 'Employee',
  [AttachmentEntityType.PROJECT]: 'Project',
  [AttachmentEntityType.UNIT]: 'Unit',
  [AttachmentEntityType.CUSTOMER]: 'Customer',
  [AttachmentEntityType.BOOKING]: 'Booking',
  [AttachmentEntityType.SALE_CONTRACT]: 'Sale Contract',
  [AttachmentEntityType.VOUCHER]: 'Voucher',
  [AttachmentEntityType.PAYROLL_RUN]: 'Payroll Run',
};
