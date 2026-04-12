export const ACCESS_TOKEN_TYPE = 'access';
export const REFRESH_TOKEN_TYPE = 'refresh';
export const AUTH_ACCESS_COOKIE_NAME = 'rc_access_token';
export const AUTH_REFRESH_COOKIE_NAME = 'rc_refresh_token';

export const ROLE_COMPANY_ADMIN = 'company_admin';
export const ROLE_COMPANY_ACCOUNTANT = 'company_accountant';
export const ROLE_COMPANY_HR = 'company_hr';
export const ROLE_COMPANY_MEMBER = 'company_member';
export const ROLE_COMPANY_PAYROLL = 'company_payroll';
export const ROLE_COMPANY_SALES = 'company_sales';

export const AUTH_ROLES_KEY = 'auth_roles';
export const COMPANY_SCOPE_KEY = 'company_scope';

export const BOOTSTRAP_ROLE_DEFINITIONS = [
  {
    code: ROLE_COMPANY_ADMIN,
    name: 'Company Administrator',
    description: 'Full administrative access within the selected company scope.',
  },
  {
    code: ROLE_COMPANY_ACCOUNTANT,
    name: 'Company Accountant',
    description:
      'Accounting administration access for chart-of-accounts and voucher operations within the selected company scope.',
  },
  {
    code: ROLE_COMPANY_HR,
    name: 'Company HR',
    description:
      'HR administration access for employees, attendance, leave types, and leave requests within the selected company scope.',
  },
  {
    code: ROLE_COMPANY_PAYROLL,
    name: 'Company Payroll',
    description:
      'Payroll administration access for salary structures, payroll runs, payroll lines, and payroll posting within the selected company scope.',
  },
  {
    code: ROLE_COMPANY_MEMBER,
    name: 'Company Member',
    description: 'Baseline authenticated access within the selected company scope.',
  },
  {
    code: ROLE_COMPANY_SALES,
    name: 'Company Sales',
    description:
      'CRM and property desk access for customers, leads, bookings, contracts, schedules, and collections within the selected company scope.',
  },
] as const;
