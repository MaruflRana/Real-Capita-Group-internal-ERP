import { apiRequest } from './client';
import { buildQueryString } from './query-string';
import type {
  BalanceSheetQueryParams,
  BalanceSheetResponseRecord,
  BusinessOverviewReportQueryParams,
  BusinessOverviewReportResponseRecord,
  GeneralLedgerQueryParams,
  GeneralLedgerResponseRecord,
  ProfitAndLossQueryParams,
  ProfitAndLossResponseRecord,
  TrialBalanceQueryParams,
  TrialBalanceResponseRecord,
} from './types';

export const getBusinessOverviewReport = (
  companyId: string,
  query: BusinessOverviewReportQueryParams,
) =>
  apiRequest<BusinessOverviewReportResponseRecord>(
    `companies/${companyId}/accounting/reports/business-overview${buildQueryString(query)}`,
  );

export const getTrialBalanceReport = (
  companyId: string,
  query: TrialBalanceQueryParams,
) =>
  apiRequest<TrialBalanceResponseRecord>(
    `companies/${companyId}/accounting/reports/trial-balance${buildQueryString(query)}`,
  );

export const getGeneralLedgerReport = (
  companyId: string,
  query: GeneralLedgerQueryParams,
) =>
  apiRequest<GeneralLedgerResponseRecord>(
    `companies/${companyId}/accounting/reports/general-ledger${buildQueryString(query)}`,
  );

export const getProfitAndLossReport = (
  companyId: string,
  query: ProfitAndLossQueryParams,
) =>
  apiRequest<ProfitAndLossResponseRecord>(
    `companies/${companyId}/accounting/reports/profit-loss${buildQueryString(query)}`,
  );

export const getBalanceSheetReport = (
  companyId: string,
  query: BalanceSheetQueryParams,
) =>
  apiRequest<BalanceSheetResponseRecord>(
    `companies/${companyId}/accounting/reports/balance-sheet${buildQueryString(query)}`,
  );
