import { expect, test, type Page } from '@playwright/test';

const PAGE_SIZE = 10;

const baseSession = {
  tokenType: 'Bearer',
  accessToken: 'access-token',
  accessTokenExpiresAt: '2026-03-16T03:00:00.000Z',
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: '2026-03-23T03:00:00.000Z',
  user: {
    id: 'user-admin',
    email: 'admin@example.com',
    isActive: true,
    lastLoginAt: '2026-03-16T01:00:00.000Z',
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

const createApiError = (
  statusCode: number,
  message: string,
) => ({
  statusCode,
  error: statusCode === 401 ? 'Unauthorized' : 'Bad Request',
  message,
  path: '/api/v1',
  timestamp: '2026-03-16T00:00:00.000Z',
  requestId: 'accounting-test-request-id',
});

const fulfillJson = async (
  route: Parameters<Page['route']>[1] extends (route: infer T) => unknown
    ? T
    : never,
  status: number,
  payload: unknown,
) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
};

const fulfillText = async (
  route: Parameters<Page['route']>[1] extends (route: infer T) => unknown
    ? T
    : never,
  status: number,
  body: string,
  contentType = 'text/plain',
) => {
  await route.fulfill({
    status,
    contentType,
    body,
  });
};

const createPagination = (total: number, pageSize: number) => ({
  page: 1,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

const matchesSearch = (
  value: string | null | undefined,
  search: string | null,
) => !search || (value ?? '').toLowerCase().includes(search.toLowerCase());

const setupAccountingApiMocks = async (
  page: Page,
  {
    authenticated = false,
  }: {
    authenticated?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;
  const now = '2026-03-16T00:00:00.000Z';
  const accountClasses = [
    {
      id: 'class-assets',
      code: 'ASSET',
      name: 'Assets',
      naturalBalance: 'DEBIT',
      sortOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'class-liabilities',
      code: 'LIABILITY',
      name: 'Liabilities',
      naturalBalance: 'CREDIT',
      sortOrder: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const accountGroups = [
    {
      id: 'group-current-assets',
      companyId: 'company-1',
      accountClassId: 'class-assets',
      accountClassCode: 'ASSET',
      accountClassName: 'Assets',
      code: 'CURRENT_ASSETS',
      name: 'Current Assets',
      description: 'Operational liquid assets',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const ledgerAccounts = [
    {
      id: 'ledger-cash',
      companyId: 'company-1',
      accountClassId: 'class-assets',
      accountClassCode: 'ASSET',
      accountClassName: 'Assets',
      accountGroupId: 'group-current-assets',
      accountGroupCode: 'CURRENT_ASSETS',
      accountGroupName: 'Current Assets',
      code: 'CASH_LEDGER',
      name: 'Cash Ledger',
      description: 'Cash movement accounts',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const particularAccounts = [
    {
      id: 'particular-cash',
      companyId: 'company-1',
      accountClassId: 'class-assets',
      accountClassCode: 'ASSET',
      accountClassName: 'Assets',
      accountGroupId: 'group-current-assets',
      accountGroupCode: 'CURRENT_ASSETS',
      accountGroupName: 'Current Assets',
      ledgerAccountId: 'ledger-cash',
      ledgerAccountCode: 'CASH_LEDGER',
      ledgerAccountName: 'Cash Ledger',
      code: 'PETTY_CASH',
      name: 'Petty Cash',
      description: 'Front-desk petty cash',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'particular-bank',
      companyId: 'company-1',
      accountClassId: 'class-assets',
      accountClassCode: 'ASSET',
      accountClassName: 'Assets',
      accountGroupId: 'group-current-assets',
      accountGroupCode: 'CURRENT_ASSETS',
      accountGroupName: 'Current Assets',
      ledgerAccountId: 'ledger-cash',
      ledgerAccountCode: 'CASH_LEDGER',
      ledgerAccountName: 'Cash Ledger',
      code: 'BANK_MAIN',
      name: 'Main Bank',
      description: 'Primary operating bank',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  type VoucherLineState = {
    id: string;
    lineNumber: number;
    particularAccountId: string;
    description: string | null;
    debitAmount: string;
    creditAmount: string;
    createdAt: string;
    updatedAt: string;
  };

  type VoucherState = {
    id: string;
    companyId: string;
    voucherType: 'RECEIPT' | 'PAYMENT' | 'JOURNAL' | 'CONTRA';
    status: 'DRAFT' | 'POSTED';
    voucherDate: string;
    description: string | null;
    reference: string | null;
    createdById: string;
    postedById: string | null;
    postedAt: string | null;
    createdAt: string;
    updatedAt: string;
    lines: VoucherLineState[];
  };

  let vouchers: VoucherState[] = [];

  const resolveParticularAccount = (particularAccountId: string) =>
    particularAccounts.find((account) => account.id === particularAccountId);

  const calculateTotals = (lines: VoucherLineState[]) =>
    lines.reduce(
      (totals, line) => ({
        totalDebit: totals.totalDebit + Number(line.debitAmount),
        totalCredit: totals.totalCredit + Number(line.creditAmount),
      }),
      {
        totalDebit: 0,
        totalCredit: 0,
      },
    );

  const toVoucherSummary = (voucher: VoucherState) => {
    const totals = calculateTotals(voucher.lines);

    return {
      id: voucher.id,
      companyId: voucher.companyId,
      voucherType: voucher.voucherType,
      status: voucher.status,
      voucherDate: voucher.voucherDate,
      description: voucher.description,
      reference: voucher.reference,
      createdById: voucher.createdById,
      postedById: voucher.postedById,
      postedAt: voucher.postedAt,
      lineCount: voucher.lines.length,
      totalDebit: totals.totalDebit.toFixed(2),
      totalCredit: totals.totalCredit.toFixed(2),
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    };
  };

  const toVoucherDetail = (voucher: VoucherState) => ({
    ...toVoucherSummary(voucher),
    lines: voucher.lines.map((line) => {
      const account = resolveParticularAccount(line.particularAccountId)!;

      return {
        id: line.id,
        voucherId: voucher.id,
        lineNumber: line.lineNumber,
        particularAccountId: line.particularAccountId,
        particularAccountCode: account.code,
        particularAccountName: account.name,
        ledgerAccountId: account.ledgerAccountId,
        ledgerAccountCode: account.ledgerAccountCode,
        ledgerAccountName: account.ledgerAccountName,
        description: line.description,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
      };
    }),
  });

  const filterByStatus = <T extends { isActive?: boolean; status?: string }>(
    items: T[],
    searchParams: URLSearchParams,
  ) => {
    const isActive = searchParams.get('isActive');
    const status = searchParams.get('status');

    return items.filter((item) => {
      if (isActive !== null && item.isActive !== undefined) {
        return item.isActive === (isActive === 'true');
      }

      if (status !== null && item.status !== undefined) {
        return item.status === status;
      }

      return true;
    });
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const body = request.postDataJSON?.() ?? (() => {
      try {
        return JSON.parse(request.postData() || '{}');
      } catch {
        return {};
      }
    })();

    if (pathname.endsWith('/auth/me')) {
      if (!isAuthenticated) {
        await fulfillJson(route, 401, createApiError(401, 'Access token verification failed.'));
        return;
      }

      await fulfillJson(route, 200, baseSession.user);
      return;
    }

    if (pathname.endsWith('/auth/refresh')) {
      if (!isAuthenticated) {
        await fulfillJson(route, 401, createApiError(401, 'Refresh token verification failed.'));
        return;
      }

      await fulfillJson(route, 200, baseSession);
      return;
    }

    if (pathname.endsWith('/auth/login')) {
      isAuthenticated = true;
      await page.context().addCookies([
        {
          name: 'rc_access_token',
          value: 'access-token',
          url: 'http://localhost:3100',
        },
      ]);
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

    if (pathname.endsWith('/companies/company-1/accounting/account-classes')) {
      const items = filterByStatus(accountClasses, searchParams).filter(
        (item) =>
          matchesSearch(item.code, searchParams.get('search')) ||
          matchesSearch(item.name, searchParams.get('search')),
      );
      await fulfillJson(route, 200, {
        items,
        meta: createPagination(items.length, 50),
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/account-groups')) {
      const accountClassId = searchParams.get('accountClassId');
      const items = filterByStatus(accountGroups, searchParams).filter(
        (item) =>
          (!accountClassId || item.accountClassId === accountClassId) &&
          (matchesSearch(item.code, searchParams.get('search')) ||
            matchesSearch(item.name, searchParams.get('search')) ||
            matchesSearch(item.description, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, {
        items,
        meta: createPagination(items.length, 100),
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/ledger-accounts')) {
      const accountClassId = searchParams.get('accountClassId');
      const accountGroupId = searchParams.get('accountGroupId');
      const items = filterByStatus(ledgerAccounts, searchParams).filter(
        (item) =>
          (!accountClassId || item.accountClassId === accountClassId) &&
          (!accountGroupId || item.accountGroupId === accountGroupId) &&
          (matchesSearch(item.code, searchParams.get('search')) ||
            matchesSearch(item.name, searchParams.get('search')) ||
            matchesSearch(item.description, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, {
        items,
        meta: createPagination(items.length, 100),
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/particular-accounts')) {
      const accountClassId = searchParams.get('accountClassId');
      const accountGroupId = searchParams.get('accountGroupId');
      const ledgerAccountId = searchParams.get('ledgerAccountId');
      const items = filterByStatus(particularAccounts, searchParams).filter(
        (item) =>
          (!accountClassId || item.accountClassId === accountClassId) &&
          (!accountGroupId || item.accountGroupId === accountGroupId) &&
          (!ledgerAccountId || item.ledgerAccountId === ledgerAccountId) &&
          (matchesSearch(item.code, searchParams.get('search')) ||
            matchesSearch(item.name, searchParams.get('search')) ||
            matchesSearch(item.description, searchParams.get('search'))),
      );
      await fulfillJson(route, 200, {
        items,
        meta: createPagination(items.length, 100),
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/vouchers') && request.method() === 'GET') {
      const voucherType = searchParams.get('voucherType');
      const status = searchParams.get('status');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const search = searchParams.get('search');
      const items = vouchers
        .filter((voucher) => {
          if (voucherType && voucher.voucherType !== voucherType) {
            return false;
          }
          if (status && voucher.status !== status) {
            return false;
          }
          if (dateFrom && voucher.voucherDate < dateFrom) {
            return false;
          }
          if (dateTo && voucher.voucherDate > dateTo) {
            return false;
          }

          return (
            matchesSearch(voucher.reference, search) ||
            matchesSearch(voucher.description, search)
          );
        })
        .map(toVoucherSummary);
      await fulfillJson(route, 200, {
        items,
        meta: createPagination(items.length, PAGE_SIZE),
      });
      return;
    }

    if (pathname.endsWith('/companies/company-1/accounting/vouchers') && request.method() === 'POST') {
      const voucher: VoucherState = {
        id: `voucher-${vouchers.length + 1}`,
        companyId: 'company-1',
        voucherType: body.voucherType,
        status: 'DRAFT',
        voucherDate: body.voucherDate,
        description: body.description ?? null,
        reference: body.reference ?? null,
        createdById: 'user-admin',
        postedById: null,
        postedAt: null,
        createdAt: now,
        updatedAt: now,
        lines: [],
      };
      vouchers = [voucher, ...vouchers];
      await fulfillJson(route, 201, toVoucherDetail(voucher));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/accounting\/vouchers\/[^/]+\/export$/u) &&
      request.method() === 'GET'
    ) {
      const voucherId = pathname.split('/').slice(-2)[0];
      const voucher = vouchers.find((item) => item.id === voucherId);

      if (!voucher) {
        await fulfillJson(route, 404, createApiError(404, 'Voucher not found.'));
        return;
      }

      await fulfillText(
        route,
        200,
        `Voucher ID,Reference,Status\r\n${voucher.id},${voucher.reference ?? ''},${voucher.status}`,
        'text/csv; charset=utf-8',
      );
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/accounting\/vouchers\/[^/]+$/u) &&
      request.method() === 'GET'
    ) {
      const voucherId = pathname.split('/').pop()!;
      const voucher = vouchers.find((item) => item.id === voucherId);

      if (!voucher) {
        await fulfillJson(route, 404, createApiError(404, 'Voucher not found.'));
        return;
      }

      await fulfillJson(route, 200, toVoucherDetail(voucher));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/accounting\/vouchers\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const voucherId = pathname.split('/').pop()!;
      vouchers = vouchers.map((voucher) =>
        voucher.id === voucherId
          ? {
              ...voucher,
              voucherType: body.voucherType ?? voucher.voucherType,
              voucherDate: body.voucherDate ?? voucher.voucherDate,
              description: body.description ?? voucher.description,
              reference: body.reference ?? voucher.reference,
              updatedAt: now,
            }
          : voucher,
      );
      await fulfillJson(route, 200, toVoucherDetail(vouchers.find((item) => item.id === voucherId)!));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/accounting\/vouchers\/[^/]+\/lines$/u) &&
      request.method() === 'POST'
    ) {
      const voucherId = pathname.split('/').slice(-2)[0];
      const voucher = vouchers.find((item) => item.id === voucherId)!;
      voucher.lines = [
        ...voucher.lines,
        {
          id: `${voucherId}-line-${voucher.lines.length + 1}`,
          lineNumber: voucher.lines.length + 1,
          particularAccountId: body.particularAccountId,
          description: body.description ?? null,
          debitAmount: body.debitAmount,
          creditAmount: body.creditAmount,
          createdAt: now,
          updatedAt: now,
        },
      ];
      voucher.updatedAt = now;
      await fulfillJson(route, 200, toVoucherDetail(voucher));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/accounting\/vouchers\/[^/]+\/lines\/[^/]+$/u) &&
      request.method() === 'PATCH'
    ) {
      const parts = pathname.split('/');
      const voucherId = parts[parts.length - 3];
      const voucherLineId = parts[parts.length - 1];
      const voucher = vouchers.find((item) => item.id === voucherId)!;
      voucher.lines = voucher.lines.map((line) =>
        line.id === voucherLineId
          ? {
              ...line,
              particularAccountId: body.particularAccountId ?? line.particularAccountId,
              description: body.description ?? line.description,
              debitAmount: body.debitAmount ?? line.debitAmount,
              creditAmount: body.creditAmount ?? line.creditAmount,
              updatedAt: now,
            }
          : line,
      );
      voucher.updatedAt = now;
      await fulfillJson(route, 200, toVoucherDetail(voucher));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/accounting\/vouchers\/[^/]+\/lines\/[^/]+$/u) &&
      request.method() === 'DELETE'
    ) {
      const parts = pathname.split('/');
      const voucherId = parts[parts.length - 3];
      const voucherLineId = parts[parts.length - 1];
      const voucher = vouchers.find((item) => item.id === voucherId)!;
      voucher.lines = voucher.lines
        .filter((line) => line.id !== voucherLineId)
        .map((line, index) => ({
          ...line,
          lineNumber: index + 1,
        }));
      voucher.updatedAt = now;
      await fulfillJson(route, 200, toVoucherDetail(voucher));
      return;
    }

    if (
      pathname.match(/\/companies\/company-1\/accounting\/vouchers\/[^/]+\/post$/u) &&
      request.method() === 'POST'
    ) {
      const voucherId = pathname.split('/').slice(-2)[0];
      const voucher = vouchers.find((item) => item.id === voucherId)!;
      const totals = calculateTotals(voucher.lines);

      if (voucher.lines.length === 0) {
        await fulfillJson(route, 400, createApiError(400, 'Voucher must contain at least one line before posting.'));
        return;
      }

      if (Math.abs(totals.totalDebit - totals.totalCredit) > 0.0001) {
        await fulfillJson(route, 400, createApiError(400, 'Voucher must be balanced before posting.'));
        return;
      }

      voucher.status = 'POSTED';
      voucher.postedById = 'user-admin';
      voucher.postedAt = now;
      voucher.updatedAt = now;
      await fulfillJson(route, 200, toVoucherDetail(voucher));
      return;
    }

    await route.continue();
  });
};

test('redirects accounting routes to login when no browser session exists', async ({
  page,
}) => {
  await page.goto('/accounting/vouchers');

  await expect(page).toHaveURL(/\/login\?next=%2Faccounting%2Fvouchers/);
});

test('renders accounting pages and completes an unbalanced-to-posted voucher flow', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: 'http://localhost:3100',
    },
  ]);
  await setupAccountingApiMocks(page, { authenticated: true });

  await page.goto('/accounting/chart-of-accounts');
  await expect(page.getByRole('heading', { name: 'Chart of Accounts' })).toBeVisible();
  await expect(page.getByText('Current Assets').first()).toBeVisible();
  await expect(page.getByText('Cash Ledger').first()).toBeVisible();
  await expect(page.getByText('Petty Cash').first()).toBeVisible();

  await page.getByRole('link', { name: 'Vouchers' }).click();
  await expect(
    page.getByRole('heading', { name: 'Vouchers', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Create voucher' }).first().click();
  await expect(page.getByRole('heading', { name: 'Create voucher draft' })).toBeVisible();
  await page.getByLabel('Voucher date').fill('2026-03-16');
  await page.getByLabel('Reference').fill('JV-1001');
  await page.getByLabel('Description').fill('Cash to bank adjustment');
  await page.getByRole('button', { name: 'Create draft' }).click();

  await expect(page.getByRole('heading', { name: 'Voucher detail' })).toBeVisible();
  await expect(page.getByText('Journal voucher')).toBeVisible();

  await page.getByRole('button', { name: 'Add line' }).first().click();
  await page
    .getByLabel('Posting account', { exact: true })
    .selectOption('particular-cash');
  await page.getByLabel('Debit').fill('1000.00');
  await page.getByLabel('Credit').fill('0.00');
  await page.getByRole('dialog').getByRole('button', { name: 'Add line' }).click();
  await expect(page.getByText('Petty Cash')).toBeVisible();

  await page.getByRole('button', { name: 'Add line' }).first().click();
  await page
    .getByLabel('Posting account', { exact: true })
    .selectOption('particular-bank');
  await page.getByLabel('Debit').fill('0.00');
  await page.getByLabel('Credit').fill('900.00');
  await page.getByRole('dialog').getByRole('button', { name: 'Add line' }).click();
  await expect(page.getByText('Main Bank')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Post voucher' }).click();
  await expect(
    page.getByText('Voucher must be balanced before posting.'),
  ).toBeVisible();

  await page.locator('tr', { hasText: 'Main Bank' }).getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Credit').fill('1000.00');
  await page.getByRole('button', { name: 'Save line' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Post voucher' }).click();
  await expect(page.getByText('Voucher posted')).toBeVisible();
  await expect(
    page.getByText('strongly protected in the UI'),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe(
    'real-capita-holdings-voucher-jv-1001-2026-03-16.csv',
  );

  await page.emulateMedia({ media: 'print' });

  await expect(page.getByText('Voucher print context')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to vouchers' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Save header' })).toBeHidden();
});
