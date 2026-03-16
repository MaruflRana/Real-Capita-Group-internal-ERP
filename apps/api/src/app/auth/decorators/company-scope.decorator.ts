import { SetMetadata } from '@nestjs/common';

import { COMPANY_SCOPE_KEY } from '../constants/auth.constants';

export interface CompanyScopeOptions {
  source?: 'params' | 'body' | 'query' | 'headers';
  key?: string;
}

export const CompanyScope = (
  options: CompanyScopeOptions = {},
) =>
  SetMetadata(COMPANY_SCOPE_KEY, {
    source: options.source ?? 'params',
    key: options.key ?? 'companyId',
  } satisfies CompanyScopeOptions);
