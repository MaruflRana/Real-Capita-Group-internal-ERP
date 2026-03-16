export const ACCESS_TOKEN_TYPE = 'access';
export const REFRESH_TOKEN_TYPE = 'refresh';

export const ROLE_COMPANY_ADMIN = 'company_admin';
export const ROLE_COMPANY_MEMBER = 'company_member';

export const AUTH_ROLES_KEY = 'auth_roles';
export const COMPANY_SCOPE_KEY = 'company_scope';

export const BOOTSTRAP_ROLE_DEFINITIONS = [
  {
    code: ROLE_COMPANY_ADMIN,
    name: 'Company Administrator',
    description: 'Full administrative access within the selected company scope.',
  },
  {
    code: ROLE_COMPANY_MEMBER,
    name: 'Company Member',
    description: 'Baseline authenticated access within the selected company scope.',
  },
] as const;
