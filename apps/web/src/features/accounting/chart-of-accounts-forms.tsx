'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Card, CardContent } from '@real-capita/ui';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { isApiError } from '../../lib/api/client';
import type {
  AccountClassRecord,
  AccountGroupRecord,
  LedgerAccountRecord,
  ParticularAccountRecord,
} from '../../lib/api/types';
import { applyApiFormErrors } from '../../lib/forms';
import { AccountingQueryErrorBanner, FormErrorText } from './shared';

export const statusFilterSchema = z.enum(['all', 'active', 'inactive']);

export const accountGroupSchema = z.object({
  accountClassId: z.string().min(1, 'Account class is required.'),
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .optional()
    .or(z.literal('')),
});

export const ledgerAccountSchema = z.object({
  accountGroupId: z.string().min(1, 'Account group is required.'),
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .optional()
    .or(z.literal('')),
});

export const particularAccountSchema = z.object({
  ledgerAccountId: z.string().min(1, 'Ledger account is required.'),
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .optional()
    .or(z.literal('')),
});

export type StatusFilterValue = z.infer<typeof statusFilterSchema>;
export type AccountGroupFormValues = z.infer<typeof accountGroupSchema>;
export type LedgerAccountFormValues = z.infer<typeof ledgerAccountSchema>;
export type ParticularAccountFormValues = z.infer<typeof particularAccountSchema>;

export const getStatusQueryValue = (
  value: StatusFilterValue,
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

export const FilterCard = ({
  searchValue,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  extraFilters,
}: {
  searchValue: string;
  statusFilter: StatusFilterValue;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilterValue) => void;
  extraFilters?: React.ReactNode;
}) => (
  <Card>
    <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1fr_220px_auto]">
      <div className="space-y-2">
        <Label htmlFor="accounting-search">Search</Label>
        <Input
          id="accounting-search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by code, name, or description"
          value={searchValue}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accounting-status">Status</Label>
        <Select
          id="accounting-status"
          onChange={(event) =>
            onStatusFilterChange(statusFilterSchema.parse(event.target.value))
          }
          value={statusFilter}
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </Select>
      </div>
      {extraFilters ? <div>{extraFilters}</div> : <div />}
    </CardContent>
  </Card>
);

export const AccountGroupFormPanel = ({
  accountClasses,
  accountGroup,
  initialAccountClassId,
  isPending,
  onClose,
  onSubmit,
}: {
  accountClasses: AccountClassRecord[];
  accountGroup: AccountGroupRecord | null;
  initialAccountClassId: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: AccountGroupFormValues) => Promise<unknown>;
}) => {
  const form = useForm<AccountGroupFormValues>({
    resolver: zodResolver(accountGroupSchema),
    defaultValues: {
      accountClassId: accountGroup?.accountClassId ?? initialAccountClassId,
      code: accountGroup?.code ?? '',
      name: accountGroup?.name ?? '',
      description: accountGroup?.description ?? '',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      accountClassId: accountGroup?.accountClassId ?? initialAccountClassId,
      code: accountGroup?.code ?? '',
      name: accountGroup?.name ?? '',
      description: accountGroup?.description ?? '',
    });
    setSubmitError(null);
  }, [accountGroup, form, initialAccountClassId]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      if (applyApiFormErrors(form.setError, error)) {
        return;
      }

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError('Unable to save the account group.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <AccountingQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="group-account-class">Account class</Label>
        <Select id="group-account-class" {...form.register('accountClassId')}>
          <option value="">Select account class</option>
          {accountClasses.map((accountClass) => (
            <option key={accountClass.id} value={accountClass.id}>
              {accountClass.code} · {accountClass.name}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.accountClassId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-code">Code</Label>
        <Input id="group-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-name">Name</Label>
        <Input id="group-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group-description">Description</Label>
        <Textarea id="group-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending
            ? 'Saving...'
            : accountGroup
              ? 'Save changes'
              : 'Create account group'}
        </Button>
      </div>
    </form>
  );
};

export const LedgerAccountFormPanel = ({
  accountGroups,
  initialAccountGroupId,
  ledgerAccount,
  isPending,
  onClose,
  onSubmit,
}: {
  accountGroups: AccountGroupRecord[];
  initialAccountGroupId: string;
  ledgerAccount: LedgerAccountRecord | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: LedgerAccountFormValues) => Promise<unknown>;
}) => {
  const form = useForm<LedgerAccountFormValues>({
    resolver: zodResolver(ledgerAccountSchema),
    defaultValues: {
      accountGroupId: ledgerAccount?.accountGroupId ?? initialAccountGroupId,
      code: ledgerAccount?.code ?? '',
      name: ledgerAccount?.name ?? '',
      description: ledgerAccount?.description ?? '',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      accountGroupId: ledgerAccount?.accountGroupId ?? initialAccountGroupId,
      code: ledgerAccount?.code ?? '',
      name: ledgerAccount?.name ?? '',
      description: ledgerAccount?.description ?? '',
    });
    setSubmitError(null);
  }, [form, initialAccountGroupId, ledgerAccount]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      if (applyApiFormErrors(form.setError, error)) {
        return;
      }

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError('Unable to save the ledger account.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <AccountingQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="ledger-account-group">Account group</Label>
        <Select id="ledger-account-group" {...form.register('accountGroupId')}>
          <option value="">Select account group</option>
          {accountGroups.map((accountGroup) => (
            <option key={accountGroup.id} value={accountGroup.id}>
              {accountGroup.code} · {accountGroup.name}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.accountGroupId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ledger-code">Code</Label>
        <Input id="ledger-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ledger-name">Name</Label>
        <Input id="ledger-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ledger-description">Description</Label>
        <Textarea id="ledger-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending
            ? 'Saving...'
            : ledgerAccount
              ? 'Save changes'
              : 'Create ledger account'}
        </Button>
      </div>
    </form>
  );
};

export const ParticularAccountFormPanel = ({
  ledgerAccounts,
  initialLedgerAccountId,
  particularAccount,
  isPending,
  onClose,
  onSubmit,
}: {
  ledgerAccounts: LedgerAccountRecord[];
  initialLedgerAccountId: string;
  particularAccount: ParticularAccountRecord | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: ParticularAccountFormValues) => Promise<unknown>;
}) => {
  const form = useForm<ParticularAccountFormValues>({
    resolver: zodResolver(particularAccountSchema),
    defaultValues: {
      ledgerAccountId:
        particularAccount?.ledgerAccountId ?? initialLedgerAccountId,
      code: particularAccount?.code ?? '',
      name: particularAccount?.name ?? '',
      description: particularAccount?.description ?? '',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      ledgerAccountId:
        particularAccount?.ledgerAccountId ?? initialLedgerAccountId,
      code: particularAccount?.code ?? '',
      name: particularAccount?.name ?? '',
      description: particularAccount?.description ?? '',
    });
    setSubmitError(null);
  }, [form, initialLedgerAccountId, particularAccount]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      if (applyApiFormErrors(form.setError, error)) {
        return;
      }

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError('Unable to save the posting account.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <AccountingQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="particular-ledger-account">Ledger account</Label>
        <Select
          id="particular-ledger-account"
          {...form.register('ledgerAccountId')}
        >
          <option value="">Select ledger account</option>
          {ledgerAccounts.map((ledgerAccount) => (
            <option key={ledgerAccount.id} value={ledgerAccount.id}>
              {ledgerAccount.code} · {ledgerAccount.name}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.ledgerAccountId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="particular-code">Code</Label>
        <Input id="particular-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="particular-name">Name</Label>
        <Input id="particular-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="particular-description">Description</Label>
        <Textarea
          id="particular-description"
          {...form.register('description')}
        />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending
            ? 'Saving...'
            : particularAccount
              ? 'Save changes'
              : 'Create posting account'}
        </Button>
      </div>
    </form>
  );
};
