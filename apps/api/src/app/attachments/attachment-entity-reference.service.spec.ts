const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} = require('@nestjs/common');

const {
  AttachmentEntityReferenceService,
} = require('./attachment-entity-reference.service');

test('attachment entity reference service blocks company links outside the current scope', async () => {
  const service = new AttachmentEntityReferenceService({
    company: {
      findUnique: async () => ({
        id: 'company-1',
      }),
    },
  });

  await assert.rejects(
    () =>
      service.assertEntityReference(
        'company-1',
        'COMPANY',
        'company-other',
      ),
    BadRequestException,
  );
});

test('attachment entity reference service rejects entity access outside the caller role set', () => {
  const service = new AttachmentEntityReferenceService({});

  assert.throws(
    () =>
      service.assertEntityAccess(
        {
          id: 'user-1',
          email: 'sales@example.com',
          companyId: 'company-1',
          companyName: 'Real Capita',
          companySlug: 'real-capita',
          roles: ['company_sales'],
        },
        'VOUCHER',
      ),
    ForbiddenException,
  );
});

test('attachment entity reference service keeps user links company-scoped', async () => {
  const service = new AttachmentEntityReferenceService({
    user: {
      findFirst: async () => null,
    },
  });

  await assert.rejects(
    () => service.assertEntityReference('company-1', 'USER', 'user-2'),
    NotFoundException,
  );
});
