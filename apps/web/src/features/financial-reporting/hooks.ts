'use client';

import { useQuery } from '@tanstack/react-query';

import { listParticularAccounts } from '../../lib/api/accounting';
import {
  getBusinessOverviewReport,
  getBalanceSheetReport,
  getGeneralLedgerReport,
  getProfitAndLossReport,
  getTrialBalanceReport,
} from '../../lib/api/financial-reporting';
import type {
  BalanceSheetQueryParams,
  BusinessOverviewReportQueryParams,
  GeneralLedgerQueryParams,
  ParticularAccountListQueryParams,
  ProfitAndLossQueryParams,
  TrialBalanceQueryParams,
} from '../../lib/api/types';

const assertCompanyId = (companyId: string | undefined): string => {
  if (!companyId) {
    throw new Error(
      'A company context is required for financial reporting operations.',
    );
  }

  return companyId;
};

export const financialReportingKeys = {
  all: (companyId: string) => ['financial-reporting', companyId] as const,
  trialBalance: (companyId: string, query: TrialBalanceQueryParams) =>
    ['financial-reporting', companyId, 'trial-balance', query] as const,
  generalLedger: (companyId: string, query: GeneralLedgerQueryParams) =>
    ['financial-reporting', companyId, 'general-ledger', query] as const,
  profitAndLoss: (companyId: string, query: ProfitAndLossQueryParams) =>
    ['financial-reporting', companyId, 'profit-loss', query] as const,
  balanceSheet: (companyId: string, query: BalanceSheetQueryParams) =>
    ['financial-reporting', companyId, 'balance-sheet', query] as const,
  businessOverview: (
    companyId: string,
    query: BusinessOverviewReportQueryParams,
  ) => ['financial-reporting', companyId, 'business-overview', query] as const,
  postingAccounts: (
    companyId: string,
    query: ParticularAccountListQueryParams,
  ) => ['financial-reporting', companyId, 'posting-accounts', query] as const,
};

export const useTrialBalanceReport = (
  companyId: string | undefined,
  query: TrialBalanceQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: financialReportingKeys.trialBalance(
      companyId ?? 'no-company',
      query,
    ),
    queryFn: () => getTrialBalanceReport(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
  });

export const useGeneralLedgerReport = (
  companyId: string | undefined,
  query: GeneralLedgerQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: financialReportingKeys.generalLedger(
      companyId ?? 'no-company',
      query,
    ),
    queryFn: () => getGeneralLedgerReport(assertCompanyId(companyId), query),
    enabled:
      enabled && Boolean(companyId) && query.particularAccountId.length > 0,
    placeholderData: (previousData) => previousData,
  });

export const useProfitAndLossReport = (
  companyId: string | undefined,
  query: ProfitAndLossQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: financialReportingKeys.profitAndLoss(
      companyId ?? 'no-company',
      query,
    ),
    queryFn: () => getProfitAndLossReport(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
  });

export const useBalanceSheetReport = (
  companyId: string | undefined,
  query: BalanceSheetQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: financialReportingKeys.balanceSheet(
      companyId ?? 'no-company',
      query,
    ),
    queryFn: () => getBalanceSheetReport(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
  });

export const useBusinessOverviewReport = (
  companyId: string | undefined,
  query: BusinessOverviewReportQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: financialReportingKeys.businessOverview(
      companyId ?? 'no-company',
      query,
    ),
    queryFn: () => getBusinessOverviewReport(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
  });

export const useReportingPostingAccounts = (
  companyId: string | undefined,
  query: ParticularAccountListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: financialReportingKeys.postingAccounts(
      companyId ?? 'no-company',
      query,
    ),
    queryFn: () => listParticularAccounts(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
    placeholderData: (previousData) => previousData,
  });
