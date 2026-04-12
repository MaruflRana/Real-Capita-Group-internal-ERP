import { SetMetadata } from '@nestjs/common';

import { COMPANY_SCOPE_KEY } from '../constants/auth.constants';

export interface CompanyScopeOptions {
  source?: 'params' | 'body' | 'query' | 'headers';
  key?: string;
  allowInactiveCompany?: boolean;
}

export const CompanyScope = (
  options: CompanyScopeOptions = {},
) =>
  SetMetadata(COMPANY_SCOPE_KEY, {
    source: options.source ?? 'params',
    key: options.key ?? 'companyId',
    allowInactiveCompany: options.allowInactiveCompany ?? false,
  } satisfies CompanyScopeOptions);
