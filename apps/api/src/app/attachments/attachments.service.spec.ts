const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} = require('@nestjs/common');

const { AttachmentsService } = require('./attachments.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeAttachmentRecord = (overrides = {}) => ({
  id: 'attachment-1',
  companyId: 'company-1',
  storageBucket: 'bucket-1',
  storageKey: 'attachments/company-1/file-1.pdf',
  originalFileName: 'file-1.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 1024n,
  checksumSha256: null,
  objectEtag: null,
  uploadedById: 'user-1',
  archivedById: null,
  status: 'PENDING_UPLOAD',
  uploadCompletedAt: null,
  archivedAt: null,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  uploadedBy: {
    email: 'uploader@example.com',
  },
  archivedBy: null,
  links: [],
  ...overrides,
});

const makeAttachmentLink = (overrides = {}) => ({
  id: 'attachment-link-1',
  companyId: 'company-1',
  attachmentId: 'attachment-1',
  entityType: 'BOOKING',
  entityId: 'booking-1',
  createdById: 'user-1',
  removedById: null,
  isActive: true,
  removedAt: null,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  createdBy: {
    email: 'uploader@example.com',
  },
  removedBy: null,
  ...overrides,
});

const createService = ({
  attachmentSequence = [makeAttachmentRecord()],
  transactionOverrides = {},
  storageOverrides = {},
  entityOverrides = {},
  auditOverrides = {},
} = {}) => {
  let attachmentReadIndex = 0;
  const recordedAuditEvents = [];
  const prisma = {
    attachment: {
      findMany: async () => [],
      count: async () => 0,
      findFirst: async () =>
        attachmentSequence[
          Math.min(attachmentReadIndex++, attachmentSequence.length - 1)
        ] ?? null,
    },
  };
  const transaction = {
    attachment: {
      create: async () => makeAttachmentRecord(),
      update: async () => undefined,
    },
    attachmentLink: {
      findUnique: async () => null,
      create: async () => ({
        id: 'attachment-link-1',
      }),
      update: async () => ({
        id: 'attachment-link-1',
      }),
    },
    ...transactionOverrides,
  };
  const databaseService = {
    withTransaction: async (operation) => operation(transaction),
  };
  const storageService = {
    ensureBucketExists: async () => undefined,
    getBucketName: () => 'bucket-1',
    createPresignedUploadUrl: async () => 'https://storage.example/upload',
    createPresignedDownloadUrl: async () => 'https://storage.example/download',
    headObject: async () => ({
      ContentLength: 1024,
      ContentType: 'application/pdf',
      ETag: '"etag-1"',
    }),
    ...storageOverrides,
  };
  const auditService = {
    recordEvent: async (input) => {
      recordedAuditEvents.push(input);
    },
    ...auditOverrides,
  };
  const entityReferenceService = {
    assertCompanyExists: async () => undefined,
    assertEntityAccess: () => undefined,
    assertEntityReference: async () => undefined,
    getAccessibleEntityTypes: () => ['BOOKING'],
    ...entityOverrides,
  };

  return {
    service: new AttachmentsService(
      prisma,
      databaseService,
      storageService,
      auditService,
      entityReferenceService,
    ),
    transaction,
    storageService,
    recordedAuditEvents,
  };
};

test('attachments service creates upload intent metadata and returns a signed upload URL', async () => {
  let createdAttachmentData;
  const { service, recordedAuditEvents } = createService({
    transactionOverrides: {
      attachment: {
        create: async ({ data }) => {
          createdAttachmentData = data;

          return makeAttachmentRecord({
            id: 'attachment-upload-1',
            storageBucket: data.storageBucket,
            storageKey: data.storageKey,
            originalFileName: data.originalFileName,
            mimeType: data.mimeType,
            sizeBytes: data.sizeBytes,
          });
        },
      },
    },
  });

  const response = await service.createAttachmentUploadIntent(
    'company-1',
    {
      id: 'user-1',
      email: 'uploader@example.com',
      companyId: 'company-1',
      companyName: 'Real Capita',
      companySlug: 'real-capita',
      roles: ['company_sales'],
    },
    'request-1',
    {
      originalFileName: 'Offer Letter.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '1024',
    },
  );

  assert.equal(createdAttachmentData.companyId, 'company-1');
  assert.equal(response.uploadMethod, 'PUT');
  assert.equal(response.attachment.originalFileName, 'Offer Letter.pdf');
  assert.equal(response.requiredHeaders['Content-Type'], 'application/pdf');
  assert.equal(recordedAuditEvents[0].eventType, 'attachment.upload.initiated');
});

test('attachments service finalizes an uploaded object after validating storage metadata', async () => {
  let updatedAttachmentData;
  const { service, recordedAuditEvents } = createService({
    attachmentSequence: [
      makeAttachmentRecord({
        status: 'PENDING_UPLOAD',
      }),
      makeAttachmentRecord({
        status: 'AVAILABLE',
        objectEtag: 'etag-1',
        uploadCompletedAt: new Date('2026-03-16T00:05:00.000Z'),
      }),
    ],
    transactionOverrides: {
      attachment: {
        update: async ({ data }) => {
          updatedAttachmentData = data;
        },
      },
    },
  });

  const attachment = await service.finalizeAttachmentUpload(
    'company-1',
    'attachment-1',
    {
      id: 'user-1',
      email: 'uploader@example.com',
      companyId: 'company-1',
      companyName: 'Real Capita',
      companySlug: 'real-capita',
      roles: ['company_sales'],
    },
    'request-2',
  );

  assert.equal(updatedAttachmentData.status, 'AVAILABLE');
  assert.equal(updatedAttachmentData.objectEtag, 'etag-1');
  assert.equal(attachment.status, 'AVAILABLE');
  assert.equal(recordedAuditEvents[0].eventType, 'attachment.upload.finalized');
});

test('attachments service links an available attachment to a supported entity', async () => {
  let createdLinkData;
  const { service, recordedAuditEvents } = createService({
    attachmentSequence: [
      makeAttachmentRecord({
        status: 'AVAILABLE',
      }),
      makeAttachmentRecord({
        status: 'AVAILABLE',
        links: [makeAttachmentLink()],
      }),
    ],
    transactionOverrides: {
      attachmentLink: {
        findUnique: async () => null,
        create: async ({ data }) => {
          createdLinkData = data;

          return {
            id: 'attachment-link-1',
          };
        },
      },
    },
  });

  const attachment = await service.createAttachmentLink(
    'company-1',
    'attachment-1',
    {
      id: 'user-1',
      email: 'sales@example.com',
      companyId: 'company-1',
      companyName: 'Real Capita',
      companySlug: 'real-capita',
      roles: ['company_sales'],
    },
    'request-3',
    {
      entityType: 'BOOKING',
      entityId: 'booking-1',
    },
  );

  assert.equal(createdLinkData.entityType, 'BOOKING');
  assert.equal(attachment.links[0].entityId, 'booking-1');
  assert.equal(recordedAuditEvents[0].eventType, 'attachment.link.created');
});

test('attachments service rejects cross-company entity links clearly', async () => {
  const { service } = createService({
    entityOverrides: {
      assertEntityReference: async () => {
        throw new NotFoundException('booking was not found in the requested company.');
      },
    },
    attachmentSequence: [
      makeAttachmentRecord({
        status: 'AVAILABLE',
      }),
    ],
  });

  await assert.rejects(
    () =>
      service.createAttachmentLink(
        'company-1',
        'attachment-1',
        {
          id: 'user-1',
          email: 'sales@example.com',
          companyId: 'company-1',
          companyName: 'Real Capita',
          companySlug: 'real-capita',
          roles: ['company_sales'],
        },
        'request-4',
        {
          entityType: 'BOOKING',
          entityId: 'booking-other-company',
        },
      ),
    NotFoundException,
  );
});

test('attachments service rejects unauthorized secure download access for disallowed entity types', async () => {
  const { service } = createService({
    attachmentSequence: [
      makeAttachmentRecord({
        status: 'AVAILABLE',
        links: [
          makeAttachmentLink({
            entityType: 'VOUCHER',
            entityId: 'voucher-1',
          }),
        ],
      }),
    ],
    entityOverrides: {
      getAccessibleEntityTypes: () => ['BOOKING'],
    },
  });

  await assert.rejects(
    () =>
      service.createAttachmentDownloadAccess(
        'company-1',
        'attachment-1',
        {
          id: 'user-2',
          email: 'sales@example.com',
          companyId: 'company-1',
          companyName: 'Real Capita',
          companySlug: 'real-capita',
          roles: ['company_sales'],
        },
      ),
    ForbiddenException,
  );
});

test('attachments service requires explicit entity filtering for non-admin list access', async () => {
  const { service } = createService();

  await assert.rejects(
    () =>
      service.listAttachments(
        'company-1',
        {
          id: 'user-2',
          email: 'sales@example.com',
          companyId: 'company-1',
          companyName: 'Real Capita',
          companySlug: 'real-capita',
          roles: ['company_sales'],
        },
        {
          page: 1,
          pageSize: 20,
          sortOrder: 'asc',
        },
      ),
    BadRequestException,
  );
});
