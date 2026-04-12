'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateAccountGroup,
  activateLedgerAccount,
  activateParticularAccount,
  addVoucherLine,
  createAccountGroup,
  createLedgerAccount,
  createParticularAccount,
  createVoucherDraft,
  deactivateAccountGroup,
  deactivateLedgerAccount,
  deactivateParticularAccount,
  getVoucher,
  listAccountClasses,
  listAccountGroups,
  listLedgerAccounts,
  listParticularAccounts,
  listVouchers,
  postVoucher,
  removeVoucherLine,
  updateAccountGroup,
  updateLedgerAccount,
  updateParticularAccount,
  updateVoucherDraft,
  updateVoucherLine,
} from '../../lib/api/accounting';
import type {
  AccountClassListQueryParams,
  AccountGroupListQueryParams,
  CreateAccountGroupPayload,
  CreateLedgerAccountPayload,
  CreateParticularAccountPayload,
  CreateVoucherDraftPayload,
  CreateVoucherLinePayload,
  LedgerAccountListQueryParams,
  ParticularAccountListQueryParams,
  UpdateAccountGroupPayload,
  UpdateLedgerAccountPayload,
  UpdateParticularAccountPayload,
  UpdateVoucherDraftPayload,
  UpdateVoucherLinePayload,
  VoucherDetailRecord,
  VoucherListQueryParams,
} from '../../lib/api/types';

export const accountingKeys = {
  all: (companyId: string) => ['accounting', companyId] as const,
  accountClasses: (
    companyId: string,
    query: AccountClassListQueryParams,
  ) => ['accounting', companyId, 'account-classes', query] as const,
  accountGroups: (
    companyId: string,
    query: AccountGroupListQueryParams,
  ) => ['accounting', companyId, 'account-groups', query] as const,
  ledgerAccounts: (
    companyId: string,
    query: LedgerAccountListQueryParams,
  ) => ['accounting', companyId, 'ledger-accounts', query] as const,
  particularAccounts: (
    companyId: string,
    query: ParticularAccountListQueryParams,
  ) => ['accounting', companyId, 'particular-accounts', query] as const,
  vouchers: (companyId: string, query: VoucherListQueryParams) =>
    ['accounting', companyId, 'vouchers', query] as const,
  vouchersRoot: (companyId: string) =>
    ['accounting', companyId, 'vouchers'] as const,
  voucher: (companyId: string, voucherId: string) =>
    ['accounting', companyId, 'voucher', voucherId] as const,
};

const assertCompanyId = (
  companyId: string | undefined,
): string => {
  if (!companyId) {
    throw new Error('A company context is required for accounting operations.');
  }

  return companyId;
};

const writeVoucherDetailCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  voucher: VoucherDetailRecord,
) => {
  queryClient.setQueryData(
    accountingKeys.voucher(voucher.companyId, voucher.id),
    voucher,
  );
};

export const useAccountClasses = (
  companyId: string | undefined,
  query: AccountClassListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: accountingKeys.accountClasses(companyId ?? 'no-company', query),
    queryFn: () => listAccountClasses(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useAccountGroups = (
  companyId: string | undefined,
  query: AccountGroupListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: accountingKeys.accountGroups(companyId ?? 'no-company', query),
    queryFn: () => listAccountGroups(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useLedgerAccounts = (
  companyId: string | undefined,
  query: LedgerAccountListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: accountingKeys.ledgerAccounts(companyId ?? 'no-company', query),
    queryFn: () => listLedgerAccounts(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useParticularAccounts = (
  companyId: string | undefined,
  query: ParticularAccountListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: accountingKeys.particularAccounts(companyId ?? 'no-company', query),
    queryFn: () => listParticularAccounts(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useVouchers = (
  companyId: string | undefined,
  query: VoucherListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: accountingKeys.vouchers(companyId ?? 'no-company', query),
    queryFn: () => listVouchers(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useVoucher = (
  companyId: string | undefined,
  voucherId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: accountingKeys.voucher(companyId ?? 'no-company', voucherId),
    queryFn: () => getVoucher(assertCompanyId(companyId), voucherId),
    enabled: enabled && Boolean(companyId) && voucherId.length > 0,
  });

export const useSaveAccountGroup = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountGroupId,
      payload,
    }: {
      accountGroupId?: string;
      payload: CreateAccountGroupPayload | UpdateAccountGroupPayload;
    }) =>
      accountGroupId
        ? updateAccountGroup(
            assertCompanyId(companyId),
            accountGroupId,
            payload as UpdateAccountGroupPayload,
          )
        : createAccountGroup(
            assertCompanyId(companyId),
            payload as CreateAccountGroupPayload,
          ),
    onSuccess: async () => {
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.all(companyId),
      });
    },
  });
};

export const useToggleAccountGroup = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountGroupId,
      isActive,
    }: {
      accountGroupId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateAccountGroup(assertCompanyId(companyId), accountGroupId)
        : activateAccountGroup(assertCompanyId(companyId), accountGroupId),
    onSuccess: async () => {
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.all(companyId),
      });
    },
  });
};

export const useSaveLedgerAccount = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ledgerAccountId,
      payload,
    }: {
      ledgerAccountId?: string;
      payload: CreateLedgerAccountPayload | UpdateLedgerAccountPayload;
    }) =>
      ledgerAccountId
        ? updateLedgerAccount(
            assertCompanyId(companyId),
            ledgerAccountId,
            payload as UpdateLedgerAccountPayload,
          )
        : createLedgerAccount(
            assertCompanyId(companyId),
            payload as CreateLedgerAccountPayload,
          ),
    onSuccess: async () => {
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.all(companyId),
      });
    },
  });
};

export const useToggleLedgerAccount = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ledgerAccountId,
      isActive,
    }: {
      ledgerAccountId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateLedgerAccount(assertCompanyId(companyId), ledgerAccountId)
        : activateLedgerAccount(assertCompanyId(companyId), ledgerAccountId),
    onSuccess: async () => {
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.all(companyId),
      });
    },
  });
};

export const useSaveParticularAccount = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      particularAccountId,
      payload,
    }: {
      particularAccountId?: string;
      payload:
        | CreateParticularAccountPayload
        | UpdateParticularAccountPayload;
    }) =>
      particularAccountId
        ? updateParticularAccount(
            assertCompanyId(companyId),
            particularAccountId,
            payload as UpdateParticularAccountPayload,
          )
        : createParticularAccount(
            assertCompanyId(companyId),
            payload as CreateParticularAccountPayload,
          ),
    onSuccess: async () => {
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.all(companyId),
      });
    },
  });
};

export const useToggleParticularAccount = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      particularAccountId,
      isActive,
    }: {
      particularAccountId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateParticularAccount(
            assertCompanyId(companyId),
            particularAccountId,
          )
        : activateParticularAccount(
            assertCompanyId(companyId),
            particularAccountId,
          ),
    onSuccess: async () => {
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.all(companyId),
      });
    },
  });
};

export const useCreateVoucherDraft = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVoucherDraftPayload) =>
      createVoucherDraft(assertCompanyId(companyId), payload),
    onSuccess: async (voucher) => {
      writeVoucherDetailCache(queryClient, voucher);
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.vouchersRoot(companyId),
      });
    },
  });
};

export const useUpdateVoucherDraft = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      voucherId,
      payload,
    }: {
      voucherId: string;
      payload: UpdateVoucherDraftPayload;
    }) => updateVoucherDraft(assertCompanyId(companyId), voucherId, payload),
    onSuccess: async (voucher) => {
      writeVoucherDetailCache(queryClient, voucher);
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.vouchersRoot(companyId),
      });
    },
  });
};

export const useAddVoucherLine = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      voucherId,
      payload,
    }: {
      voucherId: string;
      payload: CreateVoucherLinePayload;
    }) => addVoucherLine(assertCompanyId(companyId), voucherId, payload),
    onSuccess: async (voucher) => {
      writeVoucherDetailCache(queryClient, voucher);
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.vouchersRoot(companyId),
      });
    },
  });
};

export const useUpdateVoucherLine = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      voucherId,
      voucherLineId,
      payload,
    }: {
      voucherId: string;
      voucherLineId: string;
      payload: UpdateVoucherLinePayload;
    }) =>
      updateVoucherLine(
        assertCompanyId(companyId),
        voucherId,
        voucherLineId,
        payload,
      ),
    onSuccess: async (voucher) => {
      writeVoucherDetailCache(queryClient, voucher);
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.vouchersRoot(companyId),
      });
    },
  });
};

export const useRemoveVoucherLine = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      voucherId,
      voucherLineId,
    }: {
      voucherId: string;
      voucherLineId: string;
    }) =>
      removeVoucherLine(assertCompanyId(companyId), voucherId, voucherLineId),
    onSuccess: async (voucher) => {
      writeVoucherDetailCache(queryClient, voucher);
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.vouchersRoot(companyId),
      });
    },
  });
};

export const usePostVoucher = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (voucherId: string) =>
      postVoucher(assertCompanyId(companyId), voucherId),
    onSuccess: async (voucher) => {
      writeVoucherDetailCache(queryClient, voucher);
      if (!companyId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: accountingKeys.vouchersRoot(companyId),
      });
    },
  });
};
