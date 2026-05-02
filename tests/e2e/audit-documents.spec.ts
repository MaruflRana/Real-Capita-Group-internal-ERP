import { Buffer } from 'node:buffer';
import { expect, test, type Page } from '@playwright/test';

const now = '2026-04-01T00:00:00.000Z';
const sessionCookieUrl = 'http://localhost:3100';

const baseSession = {
  tokenType: 'Bearer',
  accessToken: 'access-token',
  accessTokenExpiresAt: '2026-04-01T03:00:00.000Z',
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: '2026-04-08T03:00:00.000Z',
  user: {
    id: 'user-admin',
    email: 'admin@example.com',
    isActive: true,
    lastLoginAt: '2026-04-01T01:00:00.000Z',
    currentCompany: {
      id: 'company-1',
      name: 'Real Capita Holdings',
      slug: 'real-capita-holdings',
    },
    roles: ['company_admin'],
    assignments: [
      {
        company: {
          id: 'company-1',
          name: 'Real Capita Holdings',
          slug: 'real-capita-holdings',
        },
        roles: ['company_admin'],
      },
    ],
  },
};

type MockRoute = Parameters<Page['route']>[1] extends (
  route: infer T,
) => unknown
  ? T
  : never;

type AttachmentLinkState = {
  id: string;
  companyId: string;
  attachmentId: string;
  entityType:
    | 'COMPANY'
    | 'USER'
    | 'EMPLOYEE'
    | 'PROJECT'
    | 'UNIT'
    | 'CUSTOMER'
    | 'BOOKING'
    | 'SALE_CONTRACT'
    | 'VOUCHER'
    | 'PAYROLL_RUN';
  entityId: string;
  createdById: string;
  createdByEmail: string | null;
  removedById: string | null;
  removedByEmail: string | null;
  isActive: boolean;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AttachmentState = {
  id: string;
  companyId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: string;
  checksumSha256: string | null;
  objectEtag: string | null;
  uploadedById: string;
  uploadedByEmail: string | null;
  archivedById: string | null;
  archivedByEmail: string | null;
  status: 'PENDING_UPLOAD' | 'AVAILABLE' | 'ARCHIVED';
  links: AttachmentLinkState[];
  uploadCompletedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditEventState = {
  id: string;
  companyId: string;
  category:
    | 'AUTH'
    | 'ADMIN'
    | 'ACCOUNTING'
    | 'CRM_PROPERTY_DESK'
    | 'PAYROLL'
    | 'ATTACHMENT';
  eventType: string;
  actorUserId: string | null;
  actorEmail: string | null;
  targetEntityType:
    | 'COMPANY'
    | 'LOCATION'
    | 'DEPARTMENT'
    | 'USER'
    | 'USER_ROLE'
    | 'EMPLOYEE'
    | 'PROJECT'
    | 'UNIT'
    | 'CUSTOMER'
    | 'BOOKING'
    | 'SALE_CONTRACT'
    | 'VOUCHER'
    | 'PAYROLL_RUN'
    | 'ATTACHMENT'
    | 'ATTACHMENT_LINK'
    | null;
  targetEntityId: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const createApiError = (statusCode: number, message: string) => ({
  statusCode,
  error:
    statusCode === 401
      ? 'Unauthorized'
      : statusCode === 403
        ? 'Forbidden'
        : statusCode === 404
          ? 'Not Found'
          : 'Bad Request',
  message,
  path: '/api/v1',
  timestamp: now,
  requestId: 'audit-documents-test-request-id',
});

const fulfillJson = async (route: MockRoute, status: number, payload: unknown) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
};

const createMeta = (page: number, pageSize: number, total: number) => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

const paginate = <T,>(
  items: T[],
  searchParams: URLSearchParams,
  defaultPageSize: number,
) => {
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? String(defaultPageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    meta: createMeta(page, pageSize, items.length),
  };
};

const matchesSearch = (value: string | null | undefined, search: string | null) =>
  !search || (value ?? '').toLowerCase().includes(search.toLowerCase());

const optionalString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const addAuthenticatedCookie = async (page: Page) => {
  await page.context().addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: sessionCookieUrl,
    },
  ]);
};

const setupAuditDocumentsApiMocks = async (
  page: Page,
  {
    authenticated = false,
  }: {
    authenticated?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;
  let timestampTick = 0;
  const nextTimestamp = () =>
    new Date(Date.parse(now) + timestampTick++ * 60_000).toISOString();

  const companyUsers = [
    {
      id: 'user-admin',
      email: 'admin@example.com',
      firstName: 'Amina',
      lastName: 'Rahman',
      identityIsActive: true,
      companyAccessIsActive: true,
      roles: ['company_admin'],
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user-hr',
      email: 'hr@example.com',
      firstName: 'Nabila',
      lastName: 'Hasan',
      identityIsActive: true,
      companyAccessIsActive: true,
      roles: ['company_hr'],
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const attachmentEntityTypes = [
    { entityType: 'COMPANY', label: 'Company' },
    { entityType: 'USER', label: 'User' },
    { entityType: 'EMPLOYEE', label: 'Employee' },
    { entityType: 'PROJECT', label: 'Project' },
    { entityType: 'UNIT', label: 'Unit' },
    { entityType: 'CUSTOMER', label: 'Customer' },
    { entityType: 'BOOKING', label: 'Booking' },
    { entityType: 'SALE_CONTRACT', label: 'Sale Contract' },
    { entityType: 'VOUCHER', label: 'Voucher' },
    { entityType: 'PAYROLL_RUN', label: 'Payroll Run' },
  ] as const;

  const entityReferences = {
    EMPLOYEE: [
      {
        id: 'employee-stale',
        entityType: 'EMPLOYEE',
        primaryLabel: 'EMP-404 - Stale Employee',
        secondaryLabel: 'Legacy department',
        contextLabel: 'Stale selector option',
        isActive: true,
      },
      {
        id: 'employee-1',
        entityType: 'EMPLOYEE',
        primaryLabel: 'EMP-100 - Amina Rahman',
        secondaryLabel: 'Finance',
        contextLabel: 'admin@example.com',
        isActive: true,
      },
    ],
    PROJECT: [
      {
        id: 'project-1',
        entityType: 'PROJECT',
        primaryLabel: 'AZR - Azure Heights',
        secondaryLabel: 'Head Office',
        contextLabel: 'Primary residential tower',
        isActive: true,
      },
    ],
  } satisfies Record<string, Array<Record<string, string | boolean | null>>>;

  let attachments: AttachmentState[] = [
    {
      id: 'attachment-pending',
      companyId: 'company-1',
      originalFileName: 'pending-contract.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '2048',
      checksumSha256: null,
      objectEtag: null,
      uploadedById: 'user-admin',
      uploadedByEmail: 'admin@example.com',
      archivedById: null,
      archivedByEmail: null,
      status: 'PENDING_UPLOAD',
      links: [],
      uploadCompletedAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'attachment-available',
      companyId: 'company-1',
      originalFileName: 'payroll-summary.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: '4096',
      checksumSha256: null,
      objectEtag: 'etag-existing',
      uploadedById: 'user-hr',
      uploadedByEmail: 'hr@example.com',
      archivedById: null,
      archivedByEmail: null,
      status: 'AVAILABLE',
      links: [
        {
          id: 'link-existing',
          companyId: 'company-1',
          attachmentId: 'attachment-available',
          entityType: 'EMPLOYEE',
          entityId: 'employee-1',
          createdById: 'user-admin',
          createdByEmail: 'admin@example.com',
          removedById: null,
          removedByEmail: null,
          isActive: true,
          removedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      uploadCompletedAt: now,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const uploadedAttachmentIds = new Set<string>();

  const auditEvents: AuditEventState[] = [
    {
      id: 'audit-attachment-link',
      companyId: 'company-1',
      category: 'ATTACHMENT',
      eventType: 'attachment.linked',
      actorUserId: 'user-admin',
      actorEmail: 'admin@example.com',
      targetEntityType: 'ATTACHMENT_LINK',
      targetEntityId: 'link-existing',
      requestId: 'req-attachment-link',
      metadata: {
        attachmentId: 'attachment-available',
        entityType: 'EMPLOYEE',
        entityId: 'employee-1',
      },
      createdAt: '2026-04-01T02:00:00.000Z',
    },
    {
      id: 'audit-attachment-finalized',
      companyId: 'company-1',
      category: 'ATTACHMENT',
      eventType: 'attachment.upload.finalized',
      actorUserId: 'user-hr',
      actorEmail: 'hr@example.com',
      targetEntityType: 'ATTACHMENT',
      targetEntityId: 'attachment-available',
      requestId: 'req-attachment-finalized',
      metadata: {
        objectEtag: 'etag-existing',
        storageKey: 'attachments/company-1/existing',
      },
      createdAt: '2026-04-01T01:30:00.000Z',
    },
    {
      id: 'audit-auth-login',
      companyId: 'company-1',
      category: 'AUTH',
      eventType: 'auth.login.succeeded',
      actorUserId: 'user-admin',
      actorEmail: 'admin@example.com',
      targetEntityType: 'USER',
      targetEntityId: 'user-admin',
      requestId: 'req-auth-login',
      metadata: {
        ipAddress: '127.0.0.1',
      },
      createdAt: '2026-04-01T01:00:00.000Z',
    },
  ];

  const buildAttachmentRecord = (attachment: AttachmentState) => ({
    id: attachment.id,
    companyId: attachment.companyId,
    storageBucket: 'real-capita-documents',
    storageKey: `attachments/${attachment.id}`,
    originalFileName: attachment.originalFileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    checksumSha256: attachment.checksumSha256,
    objectEtag: attachment.objectEtag,
    uploadedById: attachment.uploadedById,
    uploadedByEmail: attachment.uploadedByEmail,
    archivedById: attachment.archivedById,
    archivedByEmail: attachment.archivedByEmail,
    status: attachment.status,
    activeLinkCount: attachment.links.filter((link) => link.isActive).length,
    links: attachment.links,
    uploadCompletedAt: attachment.uploadCompletedAt,
    archivedAt: attachment.archivedAt,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
  });

  await page.context().route('**/mock-storage/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const attachmentId = path.split('/').at(-1);

    if (route.request().method() === 'PUT' && attachmentId) {
      uploadedAttachmentIds.add(attachmentId);
      await route.fulfill({
        status: 200,
        body: '',
      });
      return;
    }

    await route.fallback();
  });

  await page.context().route('**/mock-download/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'download-ok',
    });
  });

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    let body: Record<string, unknown> = {};

    try {
      body = request.postDataJSON() as Record<string, unknown>;
    } catch {
      body = {};
    }

    const attachmentDetailMatch = pathname.match(
      /\/companies\/company-1\/attachments\/([^/]+)$/u,
    );
    const attachmentFinalizeMatch = pathname.match(
      /\/companies\/company-1\/attachments\/([^/]+)\/finalize$/u,
    );
    const attachmentLinkMatch = pathname.match(
      /\/companies\/company-1\/attachments\/([^/]+)\/links$/u,
    );
    const attachmentLinkArchiveMatch = pathname.match(
      /\/companies\/company-1\/attachments\/([^/]+)\/links\/([^/]+)\/archive$/u,
    );
    const attachmentArchiveMatch = pathname.match(
      /\/companies\/company-1\/attachments\/([^/]+)\/archive$/u,
    );
    const attachmentDownloadMatch = pathname.match(
      /\/companies\/company-1\/attachments\/([^/]+)\/download-url$/u,
    );
    const auditEventDetailMatch = pathname.match(
      /\/companies\/company-1\/audit-events\/([^/]+)$/u,
    );

    if (pathname.endsWith('/auth/me')) {
      if (!isAuthenticated) {
        await fulfillJson(
          route,
          401,
          createApiError(401, 'Access token verification failed.'),
        );
        return;
      }

      await fulfillJson(route, 200, baseSession.user);
      return;
    }

    if (pathname.endsWith('/auth/refresh')) {
      if (!isAuthenticated) {
        await fulfillJson(
          route,
          401,
          createApiError(401, 'Refresh token verification failed.'),
        );
        return;
      }

      await fulfillJson(route, 200, baseSession);
      return;
    }

    if (pathname.endsWith('/auth/logout')) {
      isAuthenticated = false;
      await page.context().clearCookies();
      await fulfillJson(route, 200, {
        status: 'ok',
        message: 'Session revoked.',
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/attachments/references/entity-types')) {
      await fulfillJson(route, 200, {
        items: attachmentEntityTypes,
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/attachments/references/entities')) {
      const entityType = searchParams.get('entityType') ?? '';
      const search = searchParams.get('search');
      const items = (entityReferences[entityType] ?? []).filter((reference) =>
        matchesSearch(reference.primaryLabel, search) ||
        matchesSearch(reference.secondaryLabel, search) ||
        matchesSearch(reference.contextLabel, search),
      );

      await fulfillJson(route, 200, paginate(items, searchParams, 25));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/attachments/references/uploaders')
    ) {
      const search = searchParams.get('search');
      const items = companyUsers.filter(
        (user) =>
          matchesSearch(user.email, search) ||
          matchesSearch(user.firstName, search) ||
          matchesSearch(user.lastName, search),
      );

      await fulfillJson(route, 200, paginate(items, searchParams, 25));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/attachments') &&
      request.method() === 'GET'
    ) {
      const entityType = searchParams.get('entityType');
      const entityId = searchParams.get('entityId');
      const status = searchParams.get('status');
      const mimeType = searchParams.get('mimeType');
      const uploadedByUserId = searchParams.get('uploadedByUserId');
      const search = searchParams.get('search');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      const items = attachments
        .filter((attachment) => attachment.companyId === 'company-1')
        .filter((attachment) => !status || attachment.status === status)
        .filter(
          (attachment) =>
            !mimeType ||
            attachment.mimeType.toLowerCase() === mimeType.toLowerCase(),
        )
        .filter(
          (attachment) =>
            !uploadedByUserId || attachment.uploadedById === uploadedByUserId,
        )
        .filter(
          (attachment) =>
            !entityType ||
            !entityId ||
            attachment.links.some(
              (link) =>
                link.isActive &&
                link.entityType === entityType &&
                link.entityId === entityId,
            ),
        )
        .filter(
          (attachment) =>
            matchesSearch(attachment.originalFileName, search) ||
            matchesSearch(`attachments/${attachment.id}`, search),
        )
        .filter(
          (attachment) => !dateFrom || attachment.createdAt.slice(0, 10) >= dateFrom,
        )
        .filter(
          (attachment) => !dateTo || attachment.createdAt.slice(0, 10) <= dateTo,
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map((attachment) => buildAttachmentRecord(attachment));

      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/attachments/uploads') &&
      request.method() === 'POST'
    ) {
      const timestamp = nextTimestamp();
      const attachmentId = `attachment-uploaded-${attachments.length - 1}`;
      const record: AttachmentState = {
        id: attachmentId,
        companyId: 'company-1',
        originalFileName: String(body.originalFileName ?? 'uploaded-file.bin'),
        mimeType: String(body.mimeType ?? 'application/octet-stream'),
        sizeBytes: String(body.sizeBytes ?? '0'),
        checksumSha256: null,
        objectEtag: null,
        uploadedById: 'user-admin',
        uploadedByEmail: 'admin@example.com',
        archivedById: null,
        archivedByEmail: null,
        status: 'PENDING_UPLOAD',
        links: [],
        uploadCompletedAt: null,
        archivedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      attachments = [record, ...attachments];

      await fulfillJson(route, 201, {
        attachment: buildAttachmentRecord(record),
        uploadMethod: 'PUT',
        uploadUrl: `${sessionCookieUrl}/mock-storage/${attachmentId}`,
        requiredHeaders: {
          'Content-Type': record.mimeType,
        },
        expiresAt: '2026-04-01T02:30:00.000Z',
      });
      return;
    }

    if (attachmentDetailMatch && request.method() === 'GET') {
      const attachment = attachments.find((item) => item.id === attachmentDetailMatch[1]);

      if (!attachment) {
        await fulfillJson(route, 404, createApiError(404, 'Attachment not found.'));
        return;
      }

      await fulfillJson(route, 200, buildAttachmentRecord(attachment));
      return;
    }

    if (attachmentFinalizeMatch && request.method() === 'POST') {
      const attachment = attachments.find((item) => item.id === attachmentFinalizeMatch[1]);

      if (!attachment) {
        await fulfillJson(route, 404, createApiError(404, 'Attachment not found.'));
        return;
      }

      if (!uploadedAttachmentIds.has(attachment.id)) {
        await fulfillJson(
          route,
          400,
          createApiError(
            400,
            'Uploaded object was not found in storage. Complete the direct upload before finalization.',
          ),
        );
        return;
      }

      attachment.status = 'AVAILABLE';
      attachment.objectEtag = `etag-${attachment.id}`;
      attachment.uploadCompletedAt = nextTimestamp();
      attachment.updatedAt = attachment.uploadCompletedAt;

      await fulfillJson(route, 200, buildAttachmentRecord(attachment));
      return;
    }

    if (attachmentLinkMatch && request.method() === 'POST') {
      const attachment = attachments.find((item) => item.id === attachmentLinkMatch[1]);
      const entityId = optionalString(body.entityId);

      if (!attachment || !entityId) {
        await fulfillJson(
          route,
          404,
          createApiError(404, 'Attachment was not found in the requested company.'),
        );
        return;
      }

      if (entityId === 'employee-stale') {
        await fulfillJson(
          route,
          404,
          createApiError(
            404,
            'employee was not found in the requested company.',
          ),
        );
        return;
      }

      const timestamp = nextTimestamp();
      const link: AttachmentLinkState = {
        id: `link-${attachment.links.length + 1}`,
        companyId: attachment.companyId,
        attachmentId: attachment.id,
        entityType: String(body.entityType ?? 'EMPLOYEE') as AttachmentLinkState['entityType'],
        entityId,
        createdById: 'user-admin',
        createdByEmail: 'admin@example.com',
        removedById: null,
        removedByEmail: null,
        isActive: true,
        removedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      attachment.links = [...attachment.links, link];
      attachment.updatedAt = timestamp;

      await fulfillJson(route, 200, buildAttachmentRecord(attachment));
      return;
    }

    if (attachmentLinkArchiveMatch && request.method() === 'POST') {
      const attachment = attachments.find(
        (item) => item.id === attachmentLinkArchiveMatch[1],
      );
      const link = attachment?.links.find(
        (item) => item.id === attachmentLinkArchiveMatch[2],
      );

      if (!attachment || !link) {
        await fulfillJson(route, 404, createApiError(404, 'Attachment link not found.'));
        return;
      }

      const timestamp = nextTimestamp();
      link.isActive = false;
      link.removedAt = timestamp;
      link.removedById = 'user-admin';
      link.removedByEmail = 'admin@example.com';
      link.updatedAt = timestamp;
      attachment.updatedAt = timestamp;

      await fulfillJson(route, 200, buildAttachmentRecord(attachment));
      return;
    }

    if (attachmentArchiveMatch && request.method() === 'POST') {
      const attachment = attachments.find((item) => item.id === attachmentArchiveMatch[1]);

      if (!attachment) {
        await fulfillJson(route, 404, createApiError(404, 'Attachment not found.'));
        return;
      }

      const timestamp = nextTimestamp();
      attachment.status = 'ARCHIVED';
      attachment.archivedAt = timestamp;
      attachment.archivedById = 'user-admin';
      attachment.archivedByEmail = 'admin@example.com';
      attachment.updatedAt = timestamp;

      await fulfillJson(route, 200, buildAttachmentRecord(attachment));
      return;
    }

    if (attachmentDownloadMatch && request.method() === 'POST') {
      const attachment = attachments.find(
        (item) => item.id === attachmentDownloadMatch[1],
      );

      if (!attachment) {
        await fulfillJson(route, 404, createApiError(404, 'Attachment not found.'));
        return;
      }

      if (attachment.status !== 'AVAILABLE') {
        await fulfillJson(
          route,
          400,
          createApiError(
            400,
            'Secure download access is available only for finalized attachments.',
          ),
        );
        return;
      }

      await fulfillJson(route, 200, {
        attachmentId: attachment.id,
        fileName: attachment.originalFileName,
        mimeType: attachment.mimeType,
        downloadUrl: `${sessionCookieUrl}/mock-download/${attachment.id}`,
        expiresAt: '2026-04-01T03:00:00.000Z',
      });
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/audit-events') &&
      request.method() === 'GET'
    ) {
      const search = searchParams.get('search');
      const category = searchParams.get('category');
      const eventType = searchParams.get('eventType');
      const actorUserId = searchParams.get('actorUserId');
      const targetEntityType = searchParams.get('targetEntityType');
      const targetEntityId = searchParams.get('targetEntityId');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      const items = auditEvents
        .filter((event) => event.companyId === 'company-1')
        .filter((event) => !category || event.category === category)
        .filter(
          (event) =>
            !eventType ||
            event.eventType.toLowerCase() === eventType.toLowerCase(),
        )
        .filter((event) => !actorUserId || event.actorUserId === actorUserId)
        .filter(
          (event) => !targetEntityType || event.targetEntityType === targetEntityType,
        )
        .filter((event) => !targetEntityId || event.targetEntityId === targetEntityId)
        .filter((event) => !dateFrom || event.createdAt.slice(0, 10) >= dateFrom)
        .filter((event) => !dateTo || event.createdAt.slice(0, 10) <= dateTo)
        .filter(
          (event) =>
            matchesSearch(event.eventType, search) ||
            matchesSearch(event.requestId, search) ||
            matchesSearch(event.actorEmail, search),
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

      await fulfillJson(route, 200, paginate(items, searchParams, 10));
      return;
    }

    if (auditEventDetailMatch && request.method() === 'GET') {
      const auditEvent = auditEvents.find((item) => item.id === auditEventDetailMatch[1]);

      if (!auditEvent) {
        await fulfillJson(route, 404, createApiError(404, 'Audit event not found.'));
        return;
      }

      await fulfillJson(route, 200, auditEvent);
      return;
    }

    await fulfillJson(route, 404, createApiError(404, `Unhandled API path: ${pathname}`));
  });
};

test('redirects audit-document routes to login when no browser session exists', async ({
  page,
}) => {
  await page.goto('/audit-documents/attachments');

  await expect(page).toHaveURL(/\/login\?next=%2Faudit-documents%2Fattachments/);
  await expect(
    page.getByRole('heading', { name: 'Open the admin shell' }),
  ).toBeVisible();
});

test('supports attachment list, finalize error surfacing, secure upload, linking, download access, and archiving', async ({
  page,
}) => {
  await setupAuditDocumentsApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);
  const exportDate = new Date().toISOString().slice(0, 10);

  await page.goto('/audit-documents/attachments');

  await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();
  await expect(page.getByText('Document coverage')).toBeVisible();
  await expect(page.getByText('Audit activity')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Attachments' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Audit Events' })).toBeVisible();
  await expect(page.getByText('pending-contract.pdf')).toBeVisible();
  await expect(page.getByText('payroll-summary.xlsx')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe(
    `real-capita-holdings-attachments-export-${exportDate}.csv`,
  );

  await page
    .locator('tbody tr', { hasText: 'pending-contract.pdf' })
    .getByRole('link', { name: 'Open' })
    .click();

  await expect(page.getByRole('heading', { name: 'Attachment Detail' })).toBeVisible();
  await expect(page.getByText('pending-contract.pdf')).toBeVisible();
  await page.getByRole('button', { name: 'Finalize upload' }).click();
  await expect(
    page.getByText(
      'Uploaded object was not found in storage. Complete the direct upload before finalization.',
    ),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Back to attachments' }).click();
  await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

  await page.getByRole('button', { name: 'New attachment' }).click();
  const uploadPanel = page.getByRole('dialog');
  await uploadPanel
    .getByLabel('File')
    .setInputFiles({
      name: 'tenant-lease.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('tenant-lease-pdf'),
    });
  await uploadPanel.getByRole('button', { name: 'Start secure upload' }).click();

  await expect(page).toHaveURL(/\/audit-documents\/attachments\/attachment-uploaded-1/);
  await expect(page.getByText('tenant-lease.pdf')).toBeVisible();
  await expect(page.getByText('Available', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Add entity link' }).click();
  const linkPanel = page.getByRole('dialog');
  await linkPanel.getByLabel('Entity type').selectOption('EMPLOYEE');
  await linkPanel.getByLabel('Linked entity').selectOption('employee-stale');
  await linkPanel.getByRole('button', { name: 'Create link' }).click();

  await expect(
    page.getByText('employee was not found in the requested company.'),
  ).toBeVisible();

  await linkPanel.getByLabel('Linked entity').selectOption('employee-1');
  await linkPanel.getByRole('button', { name: 'Create link' }).click();

  await expect(page.getByRole('cell', { name: 'employee-1' })).toBeVisible();

  await page.getByRole('button', { name: 'Generate secure download' }).click();
  const secureDownloadLink = page.getByRole('link', { name: 'Open secure download' });
  await expect(secureDownloadLink).toHaveAttribute(
    'href',
    /mock-download\/attachment-uploaded-1/,
  );

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Archive link' }).click();
  await expect(page.locator('tbody tr', { hasText: 'employee-1' })).toContainText(
    'Archived',
  );

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Archive attachment' }).click();
  await expect(page.getByText('Attachment archived')).toBeVisible();
  await expect(page.getByText('Archived', { exact: true }).first()).toBeVisible();
});

test('supports audit-event filtering and detail review', async ({ page }) => {
  await setupAuditDocumentsApiMocks(page, { authenticated: true });
  await addAuthenticatedCookie(page);

  await page.goto('/audit-documents/audit-events');

  await expect(page.getByRole('heading', { name: 'Audit Events' })).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: 'attachment.linked' })).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: 'auth.login.succeeded' })).toBeVisible();

  await page.getByLabel('Category').selectOption('ATTACHMENT');
  await page.getByLabel('Actor').selectOption('user-admin');

  await expect(page.locator('tbody tr', { hasText: 'attachment.linked' })).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: 'auth.login.succeeded' })).toHaveCount(0);

  await page
    .locator('tbody tr', { hasText: 'attachment.linked' })
    .getByRole('button', { name: 'Open' })
    .click();

  const detailPanel = page.getByRole('dialog');
  await expect(detailPanel.getByText('Operational payload preview')).toBeVisible();
  await expect(detailPanel.getByText('ATTACHMENT', { exact: true }).first()).toBeVisible();
  await expect(detailPanel.getByText('req-attachment-link')).toBeVisible();
  await expect(detailPanel.getByText('attachmentId')).toBeVisible();
  await expect(detailPanel.getByText('attachment-available')).toBeVisible();
});
