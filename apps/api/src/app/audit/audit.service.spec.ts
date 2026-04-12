const assert = require('node:assert/strict');
const test = require('node:test');

const { BadRequestException } = require('@nestjs/common');

const { AuditService } = require('./audit.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

test('audit service records normalized audit events', async () => {
  let createdData;
  const service = new AuditService({
    auditEvent: {
      create: async ({ data }) => {
        createdData = data;
      },
    },
  });

  await service.recordEvent({
    companyId: 'company-1',
    category: 'ADMIN',
    eventType: 'admin.company.created',
  });

  assert.equal(createdData.companyId, 'company-1');
  assert.equal(createdData.actorUserId, null);
  assert.equal(createdData.requestId, null);
});

test('audit service lists company-scoped events with filtering and mapping', async () => {
  let findManyArgs;
  const service = new AuditService({
    company: {
      findUnique: async () => ({
        id: 'company-1',
      }),
    },
    auditEvent: {
      findMany: async (args) => {
        findManyArgs = args;

        return [
          {
            id: 'audit-1',
            companyId: 'company-1',
            actorUserId: 'user-1',
            category: 'ATTACHMENT',
            eventType: 'attachment.upload.finalized',
            targetEntityType: 'ATTACHMENT',
            targetEntityId: 'attachment-1',
            requestId: 'request-1',
            metadata: {
              storageKey: 'attachments/company-1/file-1.pdf',
            },
            createdAt: ISO_DATE,
            actorUser: {
              email: 'admin@example.com',
            },
          },
        ];
      },
      count: async () => 1,
    },
  });

  const response = await service.listAuditEvents('company-1', {
    page: 1,
    pageSize: 20,
    sortOrder: 'desc',
    eventType: 'attachment.upload.finalized',
    actorUserId: 'user-1',
    targetEntityType: 'ATTACHMENT',
    targetEntityId: 'attachment-1',
    dateFrom: '2026-03-16',
    dateTo: '2026-03-16',
    requestId: 'request-1',
  });

  assert.equal(findManyArgs.where.companyId, 'company-1');
  assert.equal(findManyArgs.where.eventType.equals, 'attachment.upload.finalized');
  assert.equal(findManyArgs.where.actorUserId, 'user-1');
  assert.equal(response.items[0].actorEmail, 'admin@example.com');
  assert.equal(response.items[0].metadata.storageKey, 'attachments/company-1/file-1.pdf');
});

test('audit service rejects inverted date ranges', async () => {
  const service = new AuditService({
    company: {
      findUnique: async () => ({
        id: 'company-1',
      }),
    },
    auditEvent: {
      findMany: async () => [],
      count: async () => 0,
    },
  });

  await assert.rejects(
    () =>
      service.listAuditEvents('company-1', {
        page: 1,
        pageSize: 20,
        sortOrder: 'asc',
        dateFrom: '2026-03-17',
        dateTo: '2026-03-16',
      }),
    BadRequestException,
  );
});
