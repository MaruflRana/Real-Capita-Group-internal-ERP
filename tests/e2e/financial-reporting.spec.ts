import { expect, test, type Page } from '@playwright/test';

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

const createApiError = (statusCode: number, message: string) => ({
  statusCode,
  error:
    statusCode === 401
      ? 'Unauthorized'
      : statusCode === 404
        ? 'Not Found'
        : 'Bad Request',
  message,
  path: '/api/v1',
  timestamp: '2026-03-16T00:00:00.000Z',
  requestId: 'financial-reporting-test-request-id',
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

const setupFinancialReportingApiMocks = async (
  page: Page,
  {
    authenticated = false,
  }: {
    authenticated?: boolean;
  } = {},
) => {
  let isAuthenticated = authenticated;
  const now = '2026-03-16T00:00:00.000Z';
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
      description: 'Front desk petty cash',
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

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;

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

    if (
      pathname.endsWith('/companies/company-1/accounting/particular-accounts')
    ) {
      const search = searchParams.get('search')?.toLowerCase() ?? '';
      const items = particularAccounts.filter((account) => {
        if (!search) {
          return true;
        }

        const haystack = [
          account.code,
          account.name,
          account.ledgerAccountCode,
          account.ledgerAccountName,
          account.accountGroupCode,
          account.accountGroupName,
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });

      await fulfillJson(route, 200, {
        items,
        meta: {
          page: 1,
          pageSize: 100,
          total: items.length,
          totalPages: 1,
        },
      });
      return;
    }

    if (
      pathname.endsWith(
        '/companies/company-1/accounting/reports/trial-balance/export',
      )
    ) {
      await fulfillText(
        route,
        200,
        'Row Type,Account Class Name\r\nREPORT_TOTAL,Report totals',
        'text/csv; charset=utf-8',
      );
      return;
    }

    if (
      pathname.endsWith(
        '/companies/company-1/accounting/reports/general-ledger/export',
      )
    ) {
      await fulfillText(
        route,
        200,
        'Row Type,Posting Account Name\r\nPERIOD_TOTAL,Petty Cash',
        'text/csv; charset=utf-8',
      );
      return;
    }

    if (
      pathname.endsWith(
        '/companies/company-1/accounting/reports/profit-loss/export',
      )
    ) {
      await fulfillText(
        route,
        200,
        'Row Type,Amount\r\nNET_PROFIT_LOSS,5800.00',
        'text/csv; charset=utf-8',
      );
      return;
    }

    if (
      pathname.endsWith(
        '/companies/company-1/accounting/reports/balance-sheet/export',
      )
    ) {
      await fulfillText(
        route,
        200,
        'Row Type,Amount\r\nTOTAL_ASSETS,25000.00',
        'text/csv; charset=utf-8',
      );
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/accounting/reports/trial-balance')
    ) {
      await fulfillJson(route, 200, {
        companyId: 'company-1',
        dateFrom: searchParams.get('dateFrom'),
        dateTo: searchParams.get('dateTo'),
        voucherType: searchParams.get('voucherType'),
        ledgerAccountId: null,
        particularAccountId: null,
        totals: {
          openingDebit: '5000.00',
          openingCredit: '5000.00',
          movementDebit: '2300.00',
          movementCredit: '2300.00',
          closingDebit: '7300.00',
          closingCredit: '7300.00',
        },
        sections: [
          {
            accountClassId: 'class-assets',
            accountClassCode: 'ASSET',
            accountClassName: 'Assets',
            accountClassNaturalBalance: 'DEBIT',
            accountClassSortOrder: 1,
            openingDebit: '5000.00',
            openingCredit: '0.00',
            movementDebit: '2300.00',
            movementCredit: '0.00',
            closingDebit: '7300.00',
            closingCredit: '0.00',
            accountGroups: [
              {
                accountGroupId: 'group-current-assets',
                accountGroupCode: 'CURRENT_ASSETS',
                accountGroupName: 'Current Assets',
                openingDebit: '5000.00',
                openingCredit: '0.00',
                movementDebit: '2300.00',
                movementCredit: '0.00',
                closingDebit: '7300.00',
                closingCredit: '0.00',
                ledgerAccounts: [
                  {
                    ledgerAccountId: 'ledger-cash',
                    ledgerAccountCode: 'CASH_LEDGER',
                    ledgerAccountName: 'Cash Ledger',
                    openingDebit: '5000.00',
                    openingCredit: '0.00',
                    movementDebit: '2300.00',
                    movementCredit: '0.00',
                    closingDebit: '7300.00',
                    closingCredit: '0.00',
                    postingAccounts: [
                      {
                        particularAccountId: 'particular-cash',
                        particularAccountCode: 'PETTY_CASH',
                        particularAccountName: 'Petty Cash',
                        openingDebit: '1200.00',
                        openingCredit: '0.00',
                        movementDebit: '300.00',
                        movementCredit: '0.00',
                        closingDebit: '1500.00',
                        closingCredit: '0.00',
                      },
                      {
                        particularAccountId: 'particular-bank',
                        particularAccountCode: 'BANK_MAIN',
                        particularAccountName: 'Main Bank',
                        openingDebit: '3800.00',
                        openingCredit: '0.00',
                        movementDebit: '2000.00',
                        movementCredit: '0.00',
                        closingDebit: '5800.00',
                        closingCredit: '0.00',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            accountClassId: 'class-equity',
            accountClassCode: 'EQUITY',
            accountClassName: 'Equity',
            accountClassNaturalBalance: 'CREDIT',
            accountClassSortOrder: 2,
            openingDebit: '0.00',
            openingCredit: '5000.00',
            movementDebit: '0.00',
            movementCredit: '2300.00',
            closingDebit: '0.00',
            closingCredit: '7300.00',
            accountGroups: [
              {
                accountGroupId: 'group-owner-equity',
                accountGroupCode: 'OWNER_EQUITY',
                accountGroupName: 'Owner Equity',
                openingDebit: '0.00',
                openingCredit: '5000.00',
                movementDebit: '0.00',
                movementCredit: '2300.00',
                closingDebit: '0.00',
                closingCredit: '7300.00',
                ledgerAccounts: [],
              },
            ],
          },
        ],
      });
      return;
    }

    if (
      pathname.endsWith(
        '/companies/company-1/accounting/reports/general-ledger',
      )
    ) {
      if (searchParams.get('dateFrom') === '2026-04-30') {
        await fulfillJson(
          route,
          400,
          createApiError(
            400,
            'The requested ledger period is outside the available reporting range.',
          ),
        );
        return;
      }

      if (searchParams.get('particularAccountId') !== 'particular-cash') {
        await fulfillJson(
          route,
          404,
          createApiError(404, 'Posting account not found.'),
        );
        return;
      }

      await fulfillJson(route, 200, {
        companyId: 'company-1',
        dateFrom: searchParams.get('dateFrom'),
        dateTo: searchParams.get('dateTo'),
        voucherType: searchParams.get('voucherType'),
        account: {
          accountClassId: 'class-assets',
          accountClassCode: 'ASSET',
          accountClassName: 'Assets',
          accountClassNaturalBalance: 'DEBIT',
          accountGroupId: 'group-current-assets',
          accountGroupCode: 'CURRENT_ASSETS',
          accountGroupName: 'Current Assets',
          ledgerAccountId: 'ledger-cash',
          ledgerAccountCode: 'CASH_LEDGER',
          ledgerAccountName: 'Cash Ledger',
          particularAccountId: 'particular-cash',
          particularAccountCode: 'PETTY_CASH',
          particularAccountName: 'Petty Cash',
          isActive: true,
        },
        openingBalance: {
          debit: '1200.00',
          credit: '0.00',
        },
        totals: {
          debit: '900.00',
          credit: '300.00',
          closingDebit: '1800.00',
          closingCredit: '0.00',
        },
        lines: [
          {
            voucherId: 'voucher-1',
            voucherLineId: 'voucher-line-1',
            voucherDate: '2026-03-10',
            voucherType: 'JOURNAL',
            voucherReference: 'JV-3001',
            voucherDescription: 'Cash adjustment',
            lineNumber: 1,
            lineDescription: 'Petty cash replenishment',
            debit: '900.00',
            credit: '0.00',
            runningDebit: '2100.00',
            runningCredit: '0.00',
          },
          {
            voucherId: 'voucher-2',
            voucherLineId: 'voucher-line-2',
            voucherDate: '2026-03-11',
            voucherType: 'PAYMENT',
            voucherReference: 'PV-2004',
            voucherDescription: 'Office supplies',
            lineNumber: 1,
            lineDescription: 'Office stationery',
            debit: '0.00',
            credit: '300.00',
            runningDebit: '1800.00',
            runningCredit: '0.00',
          },
        ],
      });
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/accounting/reports/profit-loss')
    ) {
      await fulfillJson(route, 200, {
        companyId: 'company-1',
        dateFrom: searchParams.get('dateFrom'),
        dateTo: searchParams.get('dateTo'),
        totals: {
          totalRevenue: '15000.00',
          totalExpense: '9200.00',
          netProfitLoss: '5800.00',
        },
        sections: [
          {
            accountClassId: 'class-revenue',
            accountClassCode: 'REVENUE',
            accountClassName: 'Revenue',
            accountClassNaturalBalance: 'CREDIT',
            accountClassSortOrder: 1,
            amount: '15000.00',
            accountGroups: [
              {
                accountGroupId: 'group-operating-revenue',
                accountGroupCode: 'OPERATING_REVENUE',
                accountGroupName: 'Operating Revenue',
                amount: '15000.00',
                ledgerAccounts: [
                  {
                    ledgerAccountId: 'ledger-sales',
                    ledgerAccountCode: 'SALES',
                    ledgerAccountName: 'Sales Revenue',
                    amount: '15000.00',
                    postingAccounts: [
                      {
                        particularAccountId: 'posting-sales',
                        particularAccountCode: 'UNIT_SALES',
                        particularAccountName: 'Unit Sales',
                        amount: '15000.00',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            accountClassId: 'class-expense',
            accountClassCode: 'EXPENSE',
            accountClassName: 'Expense',
            accountClassNaturalBalance: 'DEBIT',
            accountClassSortOrder: 2,
            amount: '9200.00',
            accountGroups: [
              {
                accountGroupId: 'group-operating-expense',
                accountGroupCode: 'OPERATING_EXPENSE',
                accountGroupName: 'Operating Expense',
                amount: '9200.00',
                ledgerAccounts: [
                  {
                    ledgerAccountId: 'ledger-admin-expense',
                    ledgerAccountCode: 'ADMIN_EXPENSE',
                    ledgerAccountName: 'Administrative Expense',
                    amount: '9200.00',
                    postingAccounts: [
                      {
                        particularAccountId: 'posting-supplies',
                        particularAccountCode: 'OFFICE_SUPPLIES',
                        particularAccountName: 'Office Supplies',
                        amount: '9200.00',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
      return;
    }

    if (
      pathname.endsWith('/companies/company-1/accounting/reports/balance-sheet')
    ) {
      await fulfillJson(route, 200, {
        companyId: 'company-1',
        asOfDate: searchParams.get('asOfDate'),
        isBalanced: true,
        totals: {
          totalAssets: '25000.00',
          totalLiabilities: '8000.00',
          totalEquity: '17000.00',
          unclosedEarnings: '5800.00',
          totalLiabilitiesAndEquity: '25000.00',
        },
        sections: [
          {
            accountClassId: 'class-assets',
            accountClassCode: 'ASSET',
            accountClassName: 'Assets',
            accountClassNaturalBalance: 'DEBIT',
            accountClassSortOrder: 1,
            amount: '25000.00',
            accountGroups: [
              {
                accountGroupId: 'group-current-assets',
                accountGroupCode: 'CURRENT_ASSETS',
                accountGroupName: 'Current Assets',
                amount: '25000.00',
                ledgerAccounts: [
                  {
                    ledgerAccountId: 'ledger-cash',
                    ledgerAccountCode: 'CASH_LEDGER',
                    ledgerAccountName: 'Cash Ledger',
                    amount: '25000.00',
                    postingAccounts: [
                      {
                        particularAccountId: 'particular-bank',
                        particularAccountCode: 'BANK_MAIN',
                        particularAccountName: 'Main Bank',
                        amount: '25000.00',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            accountClassId: 'class-liabilities',
            accountClassCode: 'LIABILITY',
            accountClassName: 'Liabilities',
            accountClassNaturalBalance: 'CREDIT',
            accountClassSortOrder: 2,
            amount: '8000.00',
            accountGroups: [
              {
                accountGroupId: 'group-payables',
                accountGroupCode: 'PAYABLES',
                accountGroupName: 'Payables',
                amount: '8000.00',
                ledgerAccounts: [],
              },
            ],
          },
          {
            accountClassId: 'class-equity',
            accountClassCode: 'EQUITY',
            accountClassName: 'Equity',
            accountClassNaturalBalance: 'CREDIT',
            accountClassSortOrder: 3,
            amount: '17000.00',
            accountGroups: [
              {
                accountGroupId: 'group-owner-equity',
                accountGroupCode: 'OWNER_EQUITY',
                accountGroupName: 'Owner Equity',
                amount: '17000.00',
                ledgerAccounts: [],
              },
            ],
          },
        ],
        equityAdjustments: [
          {
            code: 'UNCLOSED_EARNINGS',
            name: 'Unclosed earnings adjustment',
            amount: '5800.00',
          },
        ],
      });
      return;
    }

    await route.continue();
  });
};

test('redirects financial reporting routes to login when no browser session exists', async ({
  page,
}) => {
  await page.goto('/accounting/reports/trial-balance');

  await expect(page).toHaveURL(
    /\/login\?next=%2Faccounting%2Freports%2Ftrial-balance/,
  );
});

test('renders the trial balance page and financial reports navigation', async ({
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
  await setupFinancialReportingApiMocks(page, { authenticated: true });

  await page.goto('/accounting/reports/trial-balance');

  await expect(
    page.getByRole('heading', { name: 'Trial Balance' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'General Ledger' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Profit & Loss' })).toBeVisible();
  await expect(page.getByText('Current Assets').first()).toBeVisible();
  await expect(page.getByText('Petty Cash')).toBeVisible();
  await expect(page.getByText('Report totals')).toBeVisible();
});

test('supports general ledger account selection and surfaces validation and backend errors', async ({
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
  await setupFinancialReportingApiMocks(page, { authenticated: true });

  await page.goto('/accounting/reports/general-ledger');

  await expect(
    page.getByText('Choose an active posting account and apply the date range'),
  ).toBeVisible();

  await page
    .getByLabel('Posting account', { exact: true })
    .selectOption('particular-cash');
  await page.getByLabel('Date from').fill('2026-03-31');
  await page.getByLabel('Date to').fill('2026-03-01');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(
    page.getByText('Date from cannot be later than date to.'),
  ).toBeVisible();

  await page.getByLabel('Date from').fill('2026-03-01');
  await page.getByLabel('Date to').fill('2026-03-31');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByText('JV-3001')).toBeVisible();
  await expect(page.getByText('Petty cash replenishment')).toBeVisible();
  await expect(page.getByText('Voucher ID voucher-1')).toBeVisible();

  await page.getByLabel('Date from').fill('2026-04-30');
  await page.getByLabel('Date to').fill('2026-04-30');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(
    page.getByText(
      'The requested ledger period is outside the available reporting range.',
    ),
  ).toBeVisible();
});

test('renders the profit and loss statement', async ({ page, context }) => {
  await context.addCookies([
    {
      name: 'rc_access_token',
      value: 'dummy-token',
      url: 'http://localhost:3100',
    },
  ]);
  await setupFinancialReportingApiMocks(page, { authenticated: true });

  await page.goto('/accounting/reports/profit-loss');

  await expect(
    page.getByRole('heading', { name: 'Profit & Loss' }),
  ).toBeVisible();
  await expect(page.getByText('Total revenue')).toBeVisible();
  await expect(page.getByText('Operating Revenue')).toBeVisible();
  await expect(page.getByText('Operating Expense')).toBeVisible();
  await expect(
    page.locator('span.font-mono.tabular-nums').filter({ hasText: '5,800.00' }),
  ).toBeVisible();
});

test('renders the balance sheet and discloses derived equity adjustments', async ({
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
  await setupFinancialReportingApiMocks(page, { authenticated: true });

  await page.goto('/accounting/reports/balance-sheet');

  await expect(
    page.getByRole('heading', { name: 'Balance Sheet' }),
  ).toBeVisible();
  await expect(page.getByText('Balance sheet is balanced.')).toBeVisible();
  await expect(
    page.getByText('Unclosed earnings adjustment', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('UNCLOSED_EARNINGS', { exact: true })).toBeVisible();
  await expect(page.getByText('25,000.00').first()).toBeVisible();
});

test('supports trial balance export and print-ready rendering', async ({
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
  await setupFinancialReportingApiMocks(page, { authenticated: true });

  await page.goto('/accounting/reports/trial-balance');
  await page.getByLabel('Date from').fill('2026-03-01');
  await page.getByLabel('Date to').fill('2026-03-31');
  await page.getByRole('button', { name: 'Apply filters' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;

  await expect(download.failure()).resolves.toBeNull();
  expect(download.suggestedFilename()).toBe(
    'real-capita-holdings-trial-balance-2026-03-01-to-2026-03-31-all-vouchers.csv',
  );

  await page.emulateMedia({ media: 'print' });

  await expect(page.getByText('Trial balance print context')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply filters' })).toBeHidden();
  await expect(page.locator('aside')).toBeHidden();
});

test('surfaces export authorization failures clearly', async ({
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
  await setupFinancialReportingApiMocks(page, { authenticated: true });
  await page.route(
    '**/api/v1/companies/company-1/accounting/reports/trial-balance/export**',
    async (route) => {
      await fulfillJson(
        route,
        403,
        createApiError(403, 'Company accounting access is required for export.'),
      );
    },
  );

  await page.goto('/accounting/reports/trial-balance');
  await page.getByRole('button', { name: 'Export CSV' }).click();

  await expect(
    page.getByText('Company accounting access is required for export.'),
  ).toBeVisible();
});
