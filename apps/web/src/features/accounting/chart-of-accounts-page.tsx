'use client';

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Button } from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { Label } from '../../components/ui/label';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { SidePanel } from '../../components/ui/side-panel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import type {
  AccountGroupRecord,
  LedgerAccountRecord,
  ParticularAccountRecord,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  type AccountGroupFormValues,
  AccountGroupFormPanel,
  FilterCard,
  type LedgerAccountFormValues,
  LedgerAccountFormPanel,
  ParticularAccountFormPanel,
  type ParticularAccountFormValues,
  type StatusFilterValue,
} from './chart-of-accounts-forms';
import {
  useAccountClasses,
  useAccountGroups,
  useLedgerAccounts,
  useParticularAccounts,
  useSaveAccountGroup,
  useSaveLedgerAccount,
  useSaveParticularAccount,
  useToggleAccountGroup,
  useToggleLedgerAccount,
  useToggleParticularAccount,
} from './hooks';
import {
  AccountingAccessRequiredState,
  AccountingActiveBadge,
  AccountingPageHeader,
  AccountingQueryErrorBanner,
  AccountingSection,
} from './shared';

const PAGE_SIZE = 8;

export const ChartOfAccountsPage = () => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const accountingEnabled = canAccessAccounting && Boolean(companyId);

  const [selectedAccountClassId, setSelectedAccountClassId] = useState<
    string | null
  >(null);
  const [selectedAccountGroupId, setSelectedAccountGroupId] = useState<
    string | null
  >(null);
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<
    string | null
  >(null);

  const [groupPage, setGroupPage] = useState(1);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupStatusFilter, setGroupStatusFilter] =
    useState<StatusFilterValue>('all');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] =
    useState<StatusFilterValue>('all');
  const [particularPage, setParticularPage] = useState(1);
  const [particularSearch, setParticularSearch] = useState('');
  const [particularStatusFilter, setParticularStatusFilter] =
    useState<StatusFilterValue>('all');

  const [groupEditor, setGroupEditor] = useState<AccountGroupRecord | null>(null);
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [ledgerEditor, setLedgerEditor] = useState<LedgerAccountRecord | null>(
    null,
  );
  const [ledgerPanelOpen, setLedgerPanelOpen] = useState(false);
  const [particularEditor, setParticularEditor] =
    useState<ParticularAccountRecord | null>(null);
  const [particularPanelOpen, setParticularPanelOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const deferredGroupSearch = useDeferredValue(groupSearch);
  const deferredLedgerSearch = useDeferredValue(ledgerSearch);
  const deferredParticularSearch = useDeferredValue(particularSearch);

  const accountClassesQuery = useAccountClasses(
    companyId,
    {
      page: 1,
      pageSize: 50,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    },
    accountingEnabled,
  );

  useEffect(() => {
    if (selectedAccountClassId || !accountClassesQuery.data?.items.length) {
      return;
    }

    const [firstAccountClass] = accountClassesQuery.data.items;

    if (firstAccountClass) {
      setSelectedAccountClassId(firstAccountClass.id);
    }
  }, [accountClassesQuery.data?.items, selectedAccountClassId]);

  const groupQueryInput = useMemo(
    () => ({
      page: groupPage,
      pageSize: PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      ...(selectedAccountClassId
        ? { accountClassId: selectedAccountClassId }
        : {}),
      ...(deferredGroupSearch ? { search: deferredGroupSearch } : {}),
      ...(groupStatusFilter !== 'all'
        ? { isActive: groupStatusFilter === 'active' }
        : {}),
    }),
    [
      deferredGroupSearch,
      groupPage,
      groupStatusFilter,
      selectedAccountClassId,
    ],
  );

  const ledgerQueryInput = useMemo(
    () => ({
      page: ledgerPage,
      pageSize: PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      ...(selectedAccountGroupId
        ? { accountGroupId: selectedAccountGroupId }
        : selectedAccountClassId
          ? { accountClassId: selectedAccountClassId }
          : {}),
      ...(deferredLedgerSearch ? { search: deferredLedgerSearch } : {}),
      ...(ledgerStatusFilter !== 'all'
        ? { isActive: ledgerStatusFilter === 'active' }
        : {}),
    }),
    [
      deferredLedgerSearch,
      ledgerPage,
      ledgerStatusFilter,
      selectedAccountClassId,
      selectedAccountGroupId,
    ],
  );

  const particularQueryInput = useMemo(
    () => ({
      page: particularPage,
      pageSize: PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      ...(selectedLedgerAccountId
        ? { ledgerAccountId: selectedLedgerAccountId }
        : selectedAccountGroupId
          ? { accountGroupId: selectedAccountGroupId }
          : selectedAccountClassId
            ? { accountClassId: selectedAccountClassId }
            : {}),
      ...(deferredParticularSearch
        ? { search: deferredParticularSearch }
        : {}),
      ...(particularStatusFilter !== 'all'
        ? { isActive: particularStatusFilter === 'active' }
        : {}),
    }),
    [
      deferredParticularSearch,
      particularPage,
      particularStatusFilter,
      selectedAccountClassId,
      selectedAccountGroupId,
      selectedLedgerAccountId,
    ],
  );

  const accountGroupsQuery = useAccountGroups(
    companyId,
    groupQueryInput,
    accountingEnabled,
  );
  const ledgerAccountsQuery = useLedgerAccounts(
    companyId,
    ledgerQueryInput,
    accountingEnabled,
  );
  const particularAccountsQuery = useParticularAccounts(
    companyId,
    particularQueryInput,
    accountingEnabled,
  );

  const activeGroupOptionsQuery = useAccountGroups(
    companyId,
    {
      page: 1,
      pageSize: 100,
      sortBy: 'name',
      sortOrder: 'asc',
      isActive: true,
      ...(selectedAccountClassId ? { accountClassId: selectedAccountClassId } : {}),
    },
    accountingEnabled,
  );

  const activeLedgerOptionsQuery = useLedgerAccounts(
    companyId,
    {
      page: 1,
      pageSize: 100,
      sortBy: 'name',
      sortOrder: 'asc',
      isActive: true,
      ...(selectedAccountGroupId
        ? { accountGroupId: selectedAccountGroupId }
        : selectedAccountClassId
          ? { accountClassId: selectedAccountClassId }
          : {}),
    },
    accountingEnabled,
  );

  useEffect(() => {
    setGroupPage(1);
  }, [deferredGroupSearch, groupStatusFilter, selectedAccountClassId]);

  useEffect(() => {
    setLedgerPage(1);
  }, [
    deferredLedgerSearch,
    ledgerStatusFilter,
    selectedAccountClassId,
    selectedAccountGroupId,
  ]);

  useEffect(() => {
    setParticularPage(1);
  }, [
    deferredParticularSearch,
    particularStatusFilter,
    selectedAccountClassId,
    selectedAccountGroupId,
    selectedLedgerAccountId,
  ]);

  useEffect(() => {
    if (
      selectedAccountGroupId &&
      !accountGroupsQuery.data?.items.some((item) => item.id === selectedAccountGroupId)
    ) {
      setSelectedAccountGroupId(null);
    }
  }, [accountGroupsQuery.data?.items, selectedAccountGroupId]);

  useEffect(() => {
    if (
      selectedLedgerAccountId &&
      !ledgerAccountsQuery.data?.items.some((item) => item.id === selectedLedgerAccountId)
    ) {
      setSelectedLedgerAccountId(null);
    }
  }, [ledgerAccountsQuery.data?.items, selectedLedgerAccountId]);

  const saveAccountGroupMutation = useSaveAccountGroup(companyId);
  const toggleAccountGroupMutation = useToggleAccountGroup(companyId);
  const saveLedgerAccountMutation = useSaveLedgerAccount(companyId);
  const toggleLedgerAccountMutation = useToggleLedgerAccount(companyId);
  const saveParticularAccountMutation = useSaveParticularAccount(companyId);
  const toggleParticularAccountMutation = useToggleParticularAccount(companyId);

  const selectedAccountClass =
    accountClassesQuery.data?.items.find(
      (accountClass) => accountClass.id === selectedAccountClassId,
    ) ?? null;
  const selectedAccountGroup =
    accountGroupsQuery.data?.items.find(
      (accountGroup) => accountGroup.id === selectedAccountGroupId,
    ) ?? null;
  const selectedLedgerAccount =
    ledgerAccountsQuery.data?.items.find(
      (ledgerAccount) => ledgerAccount.id === selectedLedgerAccountId,
    ) ?? null;

  const activeGroupOptions = activeGroupOptionsQuery.data?.items ?? [];
  const activeLedgerOptions = activeLedgerOptionsQuery.data?.items ?? [];

  if (!user) {
    return null;
  }

  if (!canAccessAccounting) {
    return <AccountingAccessRequiredState />;
  }

  const handleAccountClassSelect = (accountClassId: string) => {
    setSelectedAccountClassId(accountClassId);
    setSelectedAccountGroupId(null);
    setSelectedLedgerAccountId(null);
  };

  const handleMutationError = (error: unknown, fallbackMessage: string) => {
    if (isApiError(error)) {
      setActionError(error.apiError.message);
      return;
    }

    setActionError(fallbackMessage);
  };

  const normalizeOptionalText = (value: string | undefined) => {
    const trimmed = value?.trim();

    return trimmed ? trimmed : undefined;
  };

  const buildAccountGroupPayload = (values: AccountGroupFormValues) => {
    const description = normalizeOptionalText(values.description);

    return description
      ? {
          accountClassId: values.accountClassId,
          code: values.code,
          name: values.name,
          description,
        }
      : {
          accountClassId: values.accountClassId,
          code: values.code,
          name: values.name,
        };
  };

  const buildLedgerAccountPayload = (values: LedgerAccountFormValues) => {
    const description = normalizeOptionalText(values.description);

    return description
      ? {
          accountGroupId: values.accountGroupId,
          code: values.code,
          name: values.name,
          description,
        }
      : {
          accountGroupId: values.accountGroupId,
          code: values.code,
          name: values.name,
        };
  };

  const buildParticularAccountPayload = (
    values: ParticularAccountFormValues,
  ) => {
    const description = normalizeOptionalText(values.description);

    return description
      ? {
          ledgerAccountId: values.ledgerAccountId,
          code: values.code,
          name: values.name,
          description,
        }
      : {
          ledgerAccountId: values.ledgerAccountId,
          code: values.code,
          name: values.name,
        };
  };

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="Chart of Accounts"
        description="Operate the four-level chart-of-accounts hierarchy through stable account class anchors, company-scoped account groups, ledger accounts, and posting-level particular accounts."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
      />

      {actionError ? <AccountingQueryErrorBanner message={actionError} /> : null}

      <AccountingSection
        title="Account class anchors"
        description="Account classes are stable canonical anchors. Select one to focus downstream group, ledger, and posting account management within that branch."
      >
        {accountClassesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading account classes.
          </div>
        ) : accountClassesQuery.isError && isApiError(accountClassesQuery.error) ? (
          <AccountingQueryErrorBanner
            message={accountClassesQuery.error.apiError.message}
          />
        ) : accountClassesQuery.data && accountClassesQuery.data.items.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {accountClassesQuery.data.items.map((accountClass) => {
                const isSelected = accountClass.id === selectedAccountClassId;

                return (
                  <button
                    className={`rounded-3xl border px-5 py-4 text-left transition ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/70 bg-background/80 hover:border-primary/40'
                    }`}
                    key={accountClass.id}
                    onClick={() => handleAccountClassSelect(accountClass.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {accountClass.code}
                        </p>
                        <p className="mt-2 text-base font-semibold text-foreground">
                          {accountClass.name}
                        </p>
                      </div>
                      <AccountingActiveBadge isActive={accountClass.isActive} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        Natural balance {accountClass.naturalBalance.toLowerCase()}
                      </Badge>
                      <Badge variant="outline">
                        Sort {accountClass.sortOrder}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAccountClass ? (
              <div className="rounded-3xl border border-border/70 bg-muted/25 px-5 py-4">
                <p className="text-sm font-semibold text-foreground">
                  Current hierarchy focus
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {selectedAccountClass.code} - {selectedAccountClass.name}
                  </Badge>
                  {selectedAccountGroup ? (
                    <Badge variant="outline">
                      {selectedAccountGroup.code} - {selectedAccountGroup.name}
                    </Badge>
                  ) : null}
                  {selectedLedgerAccount ? (
                    <Badge variant="outline">
                      {selectedLedgerAccount.code} - {selectedLedgerAccount.name}
                    </Badge>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="No account classes available"
            description="The backend did not return any canonical account classes for the active company."
          />
        )}
      </AccountingSection>

      <AccountingSection
        title="Account groups"
        description="Account groups sit directly under the selected account class and define the parent branch for downstream ledger accounts."
        actions={
          <Button
            aria-label="New account group"
            disabled={!selectedAccountClassId}
            onClick={() => {
              setActionError(null);
              setGroupEditor(null);
              setGroupPanelOpen(true);
            }}
          >
            New account group
          </Button>
        }
      >
        <FilterCard
          onSearchChange={setGroupSearch}
          onStatusFilterChange={setGroupStatusFilter}
          searchValue={groupSearch}
          statusFilter={groupStatusFilter}
          extraFilters={
            <div className="space-y-2">
              <Label htmlFor="group-scope">Account class</Label>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground">
                {selectedAccountClass
                  ? `${selectedAccountClass.code} - ${selectedAccountClass.name}`
                  : 'Select an account class'}
              </div>
            </div>
          }
        />

        {accountGroupsQuery.isError && isApiError(accountGroupsQuery.error) ? (
          <AccountingQueryErrorBanner
            message={accountGroupsQuery.error.apiError.message}
          />
        ) : null}
        {accountGroupsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading account groups.
          </div>
        ) : accountGroupsQuery.data && accountGroupsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Class anchor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[300px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountGroupsQuery.data.items.map((accountGroup) => (
                  <TableRow key={accountGroup.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {accountGroup.name}
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {accountGroup.code}
                        </p>
                        {accountGroup.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {accountGroup.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {accountGroup.accountClassName}
                        </p>
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {accountGroup.accountClassCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AccountingActiveBadge isActive={accountGroup.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(accountGroup.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() =>
                            setSelectedAccountGroupId(
                              selectedAccountGroupId === accountGroup.id
                                ? null
                                : accountGroup.id,
                            )
                          }
                          size="sm"
                          variant={
                            selectedAccountGroupId === accountGroup.id
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {selectedAccountGroupId === accountGroup.id
                            ? 'Focused'
                            : 'Focus ledgers'}
                        </Button>
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setGroupEditor(accountGroup);
                            setGroupPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleAccountGroupMutation.isPending}
                          onClick={() =>
                            void toggleAccountGroupMutation
                              .mutateAsync({
                                accountGroupId: accountGroup.id,
                                isActive: accountGroup.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                handleMutationError(
                                  error,
                                  'Unable to update the account group status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {accountGroup.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={accountGroupsQuery.data.meta}
              onPageChange={setGroupPage}
            />
          </>
        ) : (
          <EmptyState
            title="No account groups found"
            description="Create the first account group for the selected class to open the next level of the hierarchy."
          />
        )}
      </AccountingSection>

      <AccountingSection
        title="Ledger accounts"
        description="Ledger accounts sit under an active account group. Use the group focus action above to narrow the ledger list and avoid orphan parent selection."
        actions={
          <Button
            aria-label="New ledger account"
            disabled={activeGroupOptions.length === 0}
            onClick={() => {
              setActionError(null);
              setLedgerEditor(null);
              setLedgerPanelOpen(true);
            }}
          >
            New ledger account
          </Button>
        }
      >
        <FilterCard
          onSearchChange={setLedgerSearch}
          onStatusFilterChange={setLedgerStatusFilter}
          searchValue={ledgerSearch}
          statusFilter={ledgerStatusFilter}
          extraFilters={
            <div className="space-y-2">
              <Label htmlFor="ledger-parent-scope">Parent group focus</Label>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground">
                {selectedAccountGroup
                  ? `${selectedAccountGroup.code} - ${selectedAccountGroup.name}`
                  : 'All groups in the selected account class'}
              </div>
            </div>
          }
        />

        {ledgerAccountsQuery.isError && isApiError(ledgerAccountsQuery.error) ? (
          <AccountingQueryErrorBanner
            message={ledgerAccountsQuery.error.apiError.message}
          />
        ) : null}
        {ledgerAccountsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading ledger accounts.
          </div>
        ) : ledgerAccountsQuery.data && ledgerAccountsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ledger</TableHead>
                  <TableHead>Parent group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[320px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerAccountsQuery.data.items.map((ledgerAccount) => (
                  <TableRow key={ledgerAccount.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {ledgerAccount.name}
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {ledgerAccount.code}
                        </p>
                        {ledgerAccount.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {ledgerAccount.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {ledgerAccount.accountGroupName}
                        </p>
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {ledgerAccount.accountGroupCode} -{' '}
                          {ledgerAccount.accountClassCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AccountingActiveBadge isActive={ledgerAccount.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(ledgerAccount.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() =>
                            setSelectedLedgerAccountId(
                              selectedLedgerAccountId === ledgerAccount.id
                                ? null
                                : ledgerAccount.id,
                            )
                          }
                          size="sm"
                          variant={
                            selectedLedgerAccountId === ledgerAccount.id
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {selectedLedgerAccountId === ledgerAccount.id
                            ? 'Focused'
                            : 'Focus posting'}
                        </Button>
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setLedgerEditor(ledgerAccount);
                            setLedgerPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleLedgerAccountMutation.isPending}
                          onClick={() =>
                            void toggleLedgerAccountMutation
                              .mutateAsync({
                                ledgerAccountId: ledgerAccount.id,
                                isActive: ledgerAccount.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                handleMutationError(
                                  error,
                                  'Unable to update the ledger account status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {ledgerAccount.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={ledgerAccountsQuery.data.meta}
              onPageChange={setLedgerPage}
            />
          </>
        ) : (
          <EmptyState
            title="No ledger accounts found"
            description="Create a ledger account under an active account group before configuring posting-level accounts."
          />
        )}
      </AccountingSection>

      <AccountingSection
        title="Posting-level particular accounts"
        description="Particular accounts are the posting-level accounts used by voucher lines. The focused ledger above keeps this list operational and understandable."
        actions={
          <Button
            aria-label="New posting account"
            disabled={activeLedgerOptions.length === 0}
            onClick={() => {
              setActionError(null);
              setParticularEditor(null);
              setParticularPanelOpen(true);
            }}
          >
            New posting account
          </Button>
        }
      >
        <FilterCard
          onSearchChange={setParticularSearch}
          onStatusFilterChange={setParticularStatusFilter}
          searchValue={particularSearch}
          statusFilter={particularStatusFilter}
          extraFilters={
            <div className="space-y-2">
              <Label htmlFor="particular-parent-scope">Parent ledger focus</Label>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm text-foreground">
                {selectedLedgerAccount
                  ? `${selectedLedgerAccount.code} - ${selectedLedgerAccount.name}`
                  : selectedAccountGroup
                    ? `All ledgers in ${selectedAccountGroup.code}`
                    : 'All ledgers in the selected account class'}
              </div>
            </div>
          }
        />

        {particularAccountsQuery.isError &&
        isApiError(particularAccountsQuery.error) ? (
          <AccountingQueryErrorBanner
            message={particularAccountsQuery.error.apiError.message}
          />
        ) : null}
        {particularAccountsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading posting accounts.
          </div>
        ) : particularAccountsQuery.data &&
          particularAccountsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posting account</TableHead>
                  <TableHead>Ledger / group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {particularAccountsQuery.data.items.map((particularAccount) => (
                  <TableRow key={particularAccount.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {particularAccount.name}
                        </p>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {particularAccount.code}
                        </p>
                        {particularAccount.description ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            {particularAccount.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {particularAccount.ledgerAccountName}
                        </p>
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          {particularAccount.ledgerAccountCode} -{' '}
                          {particularAccount.accountGroupCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AccountingActiveBadge isActive={particularAccount.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(particularAccount.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setParticularEditor(particularAccount);
                            setParticularPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleParticularAccountMutation.isPending}
                          onClick={() =>
                            void toggleParticularAccountMutation
                              .mutateAsync({
                                particularAccountId: particularAccount.id,
                                isActive: particularAccount.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                handleMutationError(
                                  error,
                                  'Unable to update the posting account status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {particularAccount.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={particularAccountsQuery.data.meta}
              onPageChange={setParticularPage}
            />
          </>
        ) : (
          <EmptyState
            title="No posting accounts found"
            description="Posting-level accounts appear here once active ledgers are available and the selected hierarchy branch has been configured."
          />
        )}
      </AccountingSection>

      <SidePanel
        description="Create or update a company-scoped account group under a canonical account class."
        onClose={() => {
          setGroupPanelOpen(false);
          setGroupEditor(null);
        }}
        open={groupPanelOpen}
        title={groupEditor ? 'Edit account group' : 'Create account group'}
      >
        <AccountGroupFormPanel
          accountClasses={accountClassesQuery.data?.items ?? []}
          accountGroup={groupEditor}
          initialAccountClassId={selectedAccountClassId ?? ''}
          isPending={saveAccountGroupMutation.isPending}
          onClose={() => {
            setGroupPanelOpen(false);
            setGroupEditor(null);
          }}
          onSubmit={(values) =>
            saveAccountGroupMutation
              .mutateAsync(
                groupEditor
                  ? {
                      accountGroupId: groupEditor.id,
                      payload: buildAccountGroupPayload(values),
                    }
                  : {
                      payload: buildAccountGroupPayload(values),
                    },
              )
              .then(() => {
                setActionError(null);
                setGroupPanelOpen(false);
                setGroupEditor(null);
              })
          }
        />
      </SidePanel>

      <SidePanel
        description="Create or update a ledger account under an active account group."
        onClose={() => {
          setLedgerPanelOpen(false);
          setLedgerEditor(null);
        }}
        open={ledgerPanelOpen}
        title={ledgerEditor ? 'Edit ledger account' : 'Create ledger account'}
      >
        <LedgerAccountFormPanel
          accountGroups={activeGroupOptions}
          initialAccountGroupId={selectedAccountGroupId ?? ''}
          isPending={saveLedgerAccountMutation.isPending}
          ledgerAccount={ledgerEditor}
          onClose={() => {
            setLedgerPanelOpen(false);
            setLedgerEditor(null);
          }}
          onSubmit={(values) =>
            saveLedgerAccountMutation
              .mutateAsync(
                ledgerEditor
                  ? {
                      ledgerAccountId: ledgerEditor.id,
                      payload: buildLedgerAccountPayload(values),
                    }
                  : {
                      payload: buildLedgerAccountPayload(values),
                    },
              )
              .then(() => {
                setActionError(null);
                setLedgerPanelOpen(false);
                setLedgerEditor(null);
              })
          }
        />
      </SidePanel>

      <SidePanel
        description="Create or update a posting-level particular account under an active ledger account."
        onClose={() => {
          setParticularPanelOpen(false);
          setParticularEditor(null);
        }}
        open={particularPanelOpen}
        title={particularEditor ? 'Edit posting account' : 'Create posting account'}
      >
        <ParticularAccountFormPanel
          initialLedgerAccountId={selectedLedgerAccountId ?? ''}
          isPending={saveParticularAccountMutation.isPending}
          ledgerAccounts={activeLedgerOptions}
          onClose={() => {
            setParticularPanelOpen(false);
            setParticularEditor(null);
          }}
          onSubmit={(values) =>
            saveParticularAccountMutation
              .mutateAsync(
                particularEditor
                  ? {
                      particularAccountId: particularEditor.id,
                      payload: buildParticularAccountPayload(values),
                    }
                  : {
                      payload: buildParticularAccountPayload(values),
                    },
              )
              .then(() => {
                setActionError(null);
                setParticularPanelOpen(false);
                setParticularEditor(null);
              })
          }
          particularAccount={particularEditor}
        />
      </SidePanel>
    </div>
  );
};
