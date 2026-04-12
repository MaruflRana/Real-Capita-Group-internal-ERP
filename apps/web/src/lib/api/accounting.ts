import { apiRequest } from './client';
import { buildQueryString } from './query-string';
import type {
  AccountClassListQueryParams,
  AccountClassRecord,
  AccountGroupListQueryParams,
  AccountGroupRecord,
  CreateAccountGroupPayload,
  CreateLedgerAccountPayload,
  CreateParticularAccountPayload,
  CreateVoucherDraftPayload,
  CreateVoucherLinePayload,
  LedgerAccountListQueryParams,
  LedgerAccountRecord,
  PaginatedResponse,
  ParticularAccountListQueryParams,
  ParticularAccountRecord,
  UpdateAccountGroupPayload,
  UpdateLedgerAccountPayload,
  UpdateParticularAccountPayload,
  UpdateVoucherDraftPayload,
  UpdateVoucherLinePayload,
  VoucherDetailRecord,
  VoucherListQueryParams,
  VoucherRecord,
} from './types';

export const listAccountClasses = (
  companyId: string,
  query: AccountClassListQueryParams,
) =>
  apiRequest<PaginatedResponse<AccountClassRecord>>(
    `companies/${companyId}/accounting/account-classes${buildQueryString(query)}`,
  );

export const listAccountGroups = (
  companyId: string,
  query: AccountGroupListQueryParams,
) =>
  apiRequest<PaginatedResponse<AccountGroupRecord>>(
    `companies/${companyId}/accounting/account-groups${buildQueryString(query)}`,
  );

export const createAccountGroup = (
  companyId: string,
  payload: CreateAccountGroupPayload,
) =>
  apiRequest<AccountGroupRecord>(`companies/${companyId}/accounting/account-groups`, {
    method: 'POST',
    body: payload,
  });

export const updateAccountGroup = (
  companyId: string,
  accountGroupId: string,
  payload: UpdateAccountGroupPayload,
) =>
  apiRequest<AccountGroupRecord>(
    `companies/${companyId}/accounting/account-groups/${accountGroupId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateAccountGroup = (companyId: string, accountGroupId: string) =>
  apiRequest<AccountGroupRecord>(
    `companies/${companyId}/accounting/account-groups/${accountGroupId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateAccountGroup = (companyId: string, accountGroupId: string) =>
  apiRequest<AccountGroupRecord>(
    `companies/${companyId}/accounting/account-groups/${accountGroupId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listLedgerAccounts = (
  companyId: string,
  query: LedgerAccountListQueryParams,
) =>
  apiRequest<PaginatedResponse<LedgerAccountRecord>>(
    `companies/${companyId}/accounting/ledger-accounts${buildQueryString(query)}`,
  );

export const createLedgerAccount = (
  companyId: string,
  payload: CreateLedgerAccountPayload,
) =>
  apiRequest<LedgerAccountRecord>(
    `companies/${companyId}/accounting/ledger-accounts`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const updateLedgerAccount = (
  companyId: string,
  ledgerAccountId: string,
  payload: UpdateLedgerAccountPayload,
) =>
  apiRequest<LedgerAccountRecord>(
    `companies/${companyId}/accounting/ledger-accounts/${ledgerAccountId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateLedgerAccount = (companyId: string, ledgerAccountId: string) =>
  apiRequest<LedgerAccountRecord>(
    `companies/${companyId}/accounting/ledger-accounts/${ledgerAccountId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateLedgerAccount = (
  companyId: string,
  ledgerAccountId: string,
) =>
  apiRequest<LedgerAccountRecord>(
    `companies/${companyId}/accounting/ledger-accounts/${ledgerAccountId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listParticularAccounts = (
  companyId: string,
  query: ParticularAccountListQueryParams,
) =>
  apiRequest<PaginatedResponse<ParticularAccountRecord>>(
    `companies/${companyId}/accounting/particular-accounts${buildQueryString(query)}`,
  );

export const createParticularAccount = (
  companyId: string,
  payload: CreateParticularAccountPayload,
) =>
  apiRequest<ParticularAccountRecord>(
    `companies/${companyId}/accounting/particular-accounts`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const updateParticularAccount = (
  companyId: string,
  particularAccountId: string,
  payload: UpdateParticularAccountPayload,
) =>
  apiRequest<ParticularAccountRecord>(
    `companies/${companyId}/accounting/particular-accounts/${particularAccountId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const activateParticularAccount = (
  companyId: string,
  particularAccountId: string,
) =>
  apiRequest<ParticularAccountRecord>(
    `companies/${companyId}/accounting/particular-accounts/${particularAccountId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateParticularAccount = (
  companyId: string,
  particularAccountId: string,
) =>
  apiRequest<ParticularAccountRecord>(
    `companies/${companyId}/accounting/particular-accounts/${particularAccountId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listVouchers = (companyId: string, query: VoucherListQueryParams) =>
  apiRequest<PaginatedResponse<VoucherRecord>>(
    `companies/${companyId}/accounting/vouchers${buildQueryString(query)}`,
  );

export const getVoucher = (companyId: string, voucherId: string) =>
  apiRequest<VoucherDetailRecord>(
    `companies/${companyId}/accounting/vouchers/${voucherId}`,
  );

export const createVoucherDraft = (
  companyId: string,
  payload: CreateVoucherDraftPayload,
) =>
  apiRequest<VoucherDetailRecord>(`companies/${companyId}/accounting/vouchers`, {
    method: 'POST',
    body: payload,
  });

export const updateVoucherDraft = (
  companyId: string,
  voucherId: string,
  payload: UpdateVoucherDraftPayload,
) =>
  apiRequest<VoucherDetailRecord>(
    `companies/${companyId}/accounting/vouchers/${voucherId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const addVoucherLine = (
  companyId: string,
  voucherId: string,
  payload: CreateVoucherLinePayload,
) =>
  apiRequest<VoucherDetailRecord>(
    `companies/${companyId}/accounting/vouchers/${voucherId}/lines`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const updateVoucherLine = (
  companyId: string,
  voucherId: string,
  voucherLineId: string,
  payload: UpdateVoucherLinePayload,
) =>
  apiRequest<VoucherDetailRecord>(
    `companies/${companyId}/accounting/vouchers/${voucherId}/lines/${voucherLineId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const removeVoucherLine = (
  companyId: string,
  voucherId: string,
  voucherLineId: string,
) =>
  apiRequest<VoucherDetailRecord>(
    `companies/${companyId}/accounting/vouchers/${voucherId}/lines/${voucherLineId}`,
    {
      method: 'DELETE',
    },
  );

export const postVoucher = (companyId: string, voucherId: string) =>
  apiRequest<VoucherDetailRecord>(
    `companies/${companyId}/accounting/vouchers/${voucherId}/post`,
    {
      method: 'POST',
      body: {},
    },
  );
