import { expect, test, type Page } from '@playwright/test';

type CompanyAssignment = {
  company: {
    id: string;
    name: string;
    slug: string;
  };
  roles: string[];
};

type CurrentUser = {
  id: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string;
  currentCompany: {
    id: string;
    name: string;
    slug: string;
  };
  roles: string[];
  assignments: CompanyAssignment[];
};

const ACTIVE_COMPANY = {
  id: 'company-1',
  name: 'Real Capita Holdings',
  slug: 'real-capita-holdings',
} as const;

const createUser = (
  roles: string[],
  assignments: CompanyAssignment[] = [
    {
      company: ACTIVE_COMPANY,
      roles,
    },
  ],
): CurrentUser => ({
  id: `user-${roles.join('-') || 'session'}`,
  email: `${roles.join('.') || 'member'}@example.com`,
  isActive: true,
  lastLoginAt: '2026-03-16T01:00:00.000Z',
  currentCompany: ACTIVE_COMPANY,
  roles,
  assignments,
});

const createPageResponse = <TItem>(items: TItem[]) => ({
  items,
  meta: {
    page: 1,
    pageSize: 20,
    total: items.length,
    totalPages: 1,
  },
});

const TRIAL_BALANCE_RESPONSE = {
  companyId: ACTIVE_COMPANY.id,
  dateFrom: '2026-01-01',
  dateTo: '2026-12-31',
  voucherType: null,
  ledgerAccountId: null,
  particularAccountId: null,
  totals: {
    openingDebit: '0.00',
    openingCredit: '0.00',
    movementDebit: '0.00',
    movementCredit: '0.00',
    closingDebit: '0.00',
    closingCredit: '0.00',
  },
  sections: [],
};

const PROFIT_AND_LOSS_RESPONSE = {
  companyId: ACTIVE_COMPANY.id,
  dateFrom: '2026-01-01',
  dateTo: '2026-12-31',
  totals: {
    totalRevenue: '0.00',
    totalExpense: '0.00',
    netProfitLoss: '0.00',
  },
  sections: [],
};

const BALANCE_SHEET_RESPONSE = {
  companyId: ACTIVE_COMPANY.id,
  asOfDate: '2026-12-31',
  isBalanced: true,
  totals: {
    totalAssets: '0.00',
    totalLiabilities: '0.00',
    totalEquity: '0.00',
    unclosedEarnings: '0.00',
    totalLiabilitiesAndEquity: '0.00',
  },
  sections: [],
  equityAdjustments: [],
};

const addBrowserSession = async (page: Page) => {
  await page.context().addCookies([
    {
      name: 'rc_access_token',
      value: 'access-token',
      url: 'http://localhost:3100',
    },
  ]);
};

const setupAuthorizedApiMocks = async (page: Page, user: CurrentUser) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname.endsWith('/auth/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
      return;
    }

    if (pathname.endsWith('/auth/logout')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          message: 'Session revoked.',
        }),
      });
      return;
    }

    if (pathname.endsWith('/health')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          service: 'api',
          version: '1.0.0-test',
          timestamp: '2026-03-16T00:00:00.000Z',
        }),
      });
      return;
    }

    if (pathname.includes('/reports/trial-balance')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TRIAL_BALANCE_RESPONSE),
      });
      return;
    }

    if (pathname.includes('/reports/profit-loss')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PROFIT_AND_LOSS_RESPONSE),
      });
      return;
    }

    if (pathname.includes('/reports/balance-sheet')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BALANCE_SHEET_RESPONSE),
      });
      return;
    }

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createPageResponse([])),
      });
      return;
    }

    await route.fulfill({
      status: 204,
      body: '',
    });
  });
};

const navLink = (page: Page, name: string) =>
  page.locator('aside nav').getByRole('link', {
    name,
    exact: true,
  });

test('admin navigation exposes every Phase 1 module entry point', async ({
  page,
}) => {
  await addBrowserSession(page);
  await setupAuthorizedApiMocks(page, createUser(['company_admin']));

  await page.goto('/dashboard');

  await expect(page.getByText('Company snapshot')).toBeVisible();
  await expect(navLink(page, 'Chart of Accounts')).toBeVisible();
  await expect(navLink(page, 'Trial Balance')).toBeVisible();
  await expect(navLink(page, 'Yearly Report')).toBeVisible();
  await expect(navLink(page, 'Attachments')).toBeVisible();
  await expect(navLink(page, 'Audit Events')).toBeVisible();
  await expect(navLink(page, 'Payroll Runs')).toBeVisible();
  await expect(navLink(page, 'Projects')).toBeVisible();
  await expect(navLink(page, 'Customers')).toBeVisible();
  await expect(navLink(page, 'Employees')).toBeVisible();
  await expect(navLink(page, 'Companies')).toBeVisible();
});

test('accountant navigation only exposes accounting, reports, documents, and dashboard', async ({
  page,
}) => {
  await addBrowserSession(page);
  await setupAuthorizedApiMocks(page, createUser(['company_accountant']));

  await page.goto('/dashboard');

  await expect(page.getByText('Company snapshot')).toBeVisible();
  await expect(navLink(page, 'Chart of Accounts')).toBeVisible();
  await expect(navLink(page, 'Trial Balance')).toBeVisible();
  await expect(navLink(page, 'Yearly Report')).toBeVisible();
  await expect(navLink(page, 'Attachments')).toBeVisible();
  await expect(navLink(page, 'Employees')).toHaveCount(0);
  await expect(navLink(page, 'Payroll Runs')).toHaveCount(0);
  await expect(navLink(page, 'Customers')).toHaveCount(0);
  await expect(navLink(page, 'Companies')).toHaveCount(0);
});

test('accountant sessions expose report output actions on permitted finance pages', async ({
  page,
}) => {
  await addBrowserSession(page);
  await setupAuthorizedApiMocks(page, createUser(['company_accountant']));

  await page.goto('/accounting/reports/trial-balance');

  await expect(
    page.getByRole('heading', { exact: true, name: 'Trial Balance' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
});

test('accountant sessions get a clear forbidden state on HR routes', async ({
  page,
}) => {
  await addBrowserSession(page);
  await setupAuthorizedApiMocks(page, createUser(['company_accountant']));

  await page.goto('/hr/employees');

  await expect(
    page.getByRole('heading', {
      name: 'HR is not available in this session',
    }),
  ).toBeVisible();
  await expect(page.getByText('Allowed roles')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Return to dashboard' }),
  ).toBeVisible();
});

test('hr sessions keep HR and payroll visibility but block accounting operations', async ({
  page,
}) => {
  await addBrowserSession(page);
  await setupAuthorizedApiMocks(page, createUser(['company_hr']));

  await page.goto('/dashboard');

  await expect(navLink(page, 'Employees')).toBeVisible();
  await expect(navLink(page, 'Payroll Runs')).toBeVisible();
  await expect(navLink(page, 'Chart of Accounts')).toHaveCount(0);
  await expect(navLink(page, 'Companies')).toHaveCount(0);

  await page.goto('/accounting/vouchers');

  await expect(
    page.getByRole('heading', {
      name: 'Accounting is not available in this session',
    }),
  ).toBeVisible();
});

test('payroll sessions are blocked from org-security routes', async ({
  page,
}) => {
  await addBrowserSession(page);
  await setupAuthorizedApiMocks(page, createUser(['company_payroll']));

  await page.goto('/org-security/companies');

  await expect(
    page.getByRole('heading', {
      name: 'Org & Security is not available in this session',
    }),
  ).toBeVisible();
});

test('sales sessions only expose CRM and document access while blocking payroll routes', async ({
  page,
}) => {
  await addBrowserSession(page);
  await setupAuthorizedApiMocks(page, createUser(['company_sales']));
  await page.goto('/dashboard');

  await expect(navLink(page, 'Customers')).toBeVisible();
  await expect(navLink(page, 'Attachments')).toBeVisible();
  await expect(navLink(page, 'Payroll Runs')).toHaveCount(0);
  await expect(navLink(page, 'Companies')).toHaveCount(0);

  await page.goto('/payroll/runs');

  await expect(
    page.getByRole('heading', {
      name: 'Payroll is not available in this session',
    }),
  ).toBeVisible();
});

test('company member sessions stay anchored to dashboard-only access', async ({
  page,
}) => {
  await addBrowserSession(page);
  await setupAuthorizedApiMocks(page, createUser(['company_member']));

  await page.goto('/dashboard');

  await expect(navLink(page, 'Dashboard')).toBeVisible();
  await expect(navLink(page, 'Chart of Accounts')).toHaveCount(0);
  await expect(navLink(page, 'Attachments')).toHaveCount(0);
  await expect(navLink(page, 'Customers')).toHaveCount(0);
  await expect(navLink(page, 'Employees')).toHaveCount(0);
  await expect(page.getByText('No shortcuts available')).toBeVisible();
});
