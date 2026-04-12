'use client';

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Card, CardContent } from '@real-capita/ui';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { isApiError } from '../../lib/api/client';
import {
  ACCOUNTING_VOUCHER_TYPES,
  type VoucherLineRecord,
} from '../../lib/api/types';
import { formatAccountingAmount } from '../../lib/format';
import { applyApiFormErrors } from '../../lib/forms';
import { useParticularAccounts } from './hooks';
import {
  AccountingQueryErrorBanner,
  BalanceBadge,
  FormErrorText,
} from './shared';
import {
  buildPostingAccountOptionLabel,
  buildVoucherTotalsPreview,
} from './utils';

const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u;
const datePattern = /^\d{4}-\d{2}-\d{2}$/u;

export const voucherHeaderSchema = z.object({
  voucherType: z.enum(ACCOUNTING_VOUCHER_TYPES),
  voucherDate: z
    .string()
    .trim()
    .regex(datePattern, 'Voucher date must use YYYY-MM-DD format.'),
  reference: z
    .string()
    .trim()
    .max(120, 'Reference must be 120 characters or fewer.')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .optional()
    .or(z.literal('')),
});

export const voucherLineSchema = z
  .object({
    particularAccountId: z.string().min(1, 'Posting account is required.'),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be 500 characters or fewer.')
      .optional()
      .or(z.literal('')),
    debitAmount: z
      .string()
      .trim()
      .regex(amountPattern, 'Debit must be a non-negative amount with up to 2 decimals.'),
    creditAmount: z
      .string()
      .trim()
      .regex(
        amountPattern,
        'Credit must be a non-negative amount with up to 2 decimals.',
      ),
  })
  .superRefine((values, context) => {
    const debit = Number(values.debitAmount);
    const credit = Number(values.creditAmount);
    const hasDebit = debit > 0;
    const hasCredit = credit > 0;

    if ((hasDebit && hasCredit) || (!hasDebit && !hasCredit)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter either a debit amount or a credit amount.',
        path: ['debitAmount'],
      });
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter either a debit amount or a credit amount.',
        path: ['creditAmount'],
      });
    }
  });

export type VoucherHeaderFormValues = z.infer<typeof voucherHeaderSchema>;
export type VoucherLineFormValues = z.infer<typeof voucherLineSchema>;

export const VoucherHeaderForm = ({
  defaultValues,
  disabled = false,
  isPending,
  submitLabel,
  submitErrorFallback,
  onSubmit,
}: {
  defaultValues: VoucherHeaderFormValues;
  disabled?: boolean;
  isPending: boolean;
  submitLabel: string;
  submitErrorFallback: string;
  onSubmit: (values: VoucherHeaderFormValues) => Promise<unknown>;
}) => {
  const form = useForm<VoucherHeaderFormValues>({
    resolver: zodResolver(voucherHeaderSchema),
    defaultValues,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset(defaultValues);
    setSubmitError(null);
  }, [defaultValues, form]);

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

      setSubmitError(submitErrorFallback);
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <AccountingQueryErrorBanner message={submitError} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="voucher-type">Voucher type</Label>
          <Select
            disabled={disabled}
            id="voucher-type"
            {...form.register('voucherType')}
          >
            {ACCOUNTING_VOUCHER_TYPES.map((voucherType) => (
              <option key={voucherType} value={voucherType}>
                {voucherType}
              </option>
            ))}
          </Select>
          <FormErrorText message={form.formState.errors.voucherType?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucher-date">Voucher date</Label>
          <Input
            disabled={disabled}
            id="voucher-date"
            type="date"
            {...form.register('voucherDate')}
          />
          <FormErrorText message={form.formState.errors.voucherDate?.message} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="voucher-reference">Reference</Label>
          <Input
            disabled={disabled}
            id="voucher-reference"
            {...form.register('reference')}
          />
          <FormErrorText message={form.formState.errors.reference?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucher-description">Description</Label>
          <Textarea
            disabled={disabled}
            id="voucher-description"
            {...form.register('description')}
          />
          <FormErrorText message={form.formState.errors.description?.message} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button disabled={disabled || isPending} type="submit">
          {isPending ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export const VoucherLineFormPanel = ({
  companyId,
  isPending,
  onClose,
  onSubmit,
  voucherLine,
  voucherLines,
}: {
  companyId: string | undefined;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: VoucherLineFormValues) => Promise<unknown>;
  voucherLine: VoucherLineRecord | null;
  voucherLines: VoucherLineRecord[];
}) => {
  const form = useForm<VoucherLineFormValues>({
    resolver: zodResolver(voucherLineSchema),
    defaultValues: {
      particularAccountId: voucherLine?.particularAccountId ?? '',
      description: voucherLine?.description ?? '',
      debitAmount: voucherLine?.debitAmount ?? '0.00',
      creditAmount: voucherLine?.creditAmount ?? '0.00',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const deferredAccountSearch = useDeferredValue(accountSearch);

  useEffect(() => {
    form.reset({
      particularAccountId: voucherLine?.particularAccountId ?? '',
      description: voucherLine?.description ?? '',
      debitAmount: voucherLine?.debitAmount ?? '0.00',
      creditAmount: voucherLine?.creditAmount ?? '0.00',
    });
    setSubmitError(null);
  }, [form, voucherLine]);

  const postingAccountsQuery = useParticularAccounts(
    companyId,
    {
      page: 1,
      pageSize: 50,
      sortBy: 'name',
      sortOrder: 'asc',
      isActive: true,
      ...(deferredAccountSearch ? { search: deferredAccountSearch } : {}),
    },
    Boolean(companyId),
  );

  const selectedDebitAmount = form.watch('debitAmount');
  const selectedCreditAmount = form.watch('creditAmount');

  const totalsPreview = useMemo(
    () =>
      buildVoucherTotalsPreview(voucherLines, {
        voucherLineId: voucherLine?.id ?? null,
        debitAmount: selectedDebitAmount,
        creditAmount: selectedCreditAmount,
      }),
    [selectedCreditAmount, selectedDebitAmount, voucherLine?.id, voucherLines],
  );

  const accountOptions = useMemo(() => {
    const options = postingAccountsQuery.data?.items ?? [];
    const mappedOptions = options.map((account) => ({
      id: account.id,
      label: buildPostingAccountOptionLabel(account),
    }));

    if (
      voucherLine &&
      !options.some((account) => account.id === voucherLine.particularAccountId)
    ) {
      return [
        {
          id: voucherLine.particularAccountId,
          label: `${voucherLine.particularAccountCode} - ${voucherLine.particularAccountName} (${voucherLine.ledgerAccountCode})`,
        },
        ...mappedOptions,
      ];
    }

    return mappedOptions;
  }, [postingAccountsQuery.data?.items, voucherLine]);

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

      setSubmitError('Unable to save the voucher line.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <AccountingQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="posting-account-search">Find posting account</Label>
        <Input
          id="posting-account-search"
          onChange={(event) => setAccountSearch(event.target.value)}
          placeholder="Search posting accounts by code or name"
          value={accountSearch}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="voucher-line-account">Posting account</Label>
        <Select id="voucher-line-account" {...form.register('particularAccountId')}>
          <option value="">Select posting account</option>
          {accountOptions.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label}
            </option>
          ))}
        </Select>
        <FormErrorText
          message={form.formState.errors.particularAccountId?.message}
        />
      </div>
      {postingAccountsQuery.isError && isApiError(postingAccountsQuery.error) ? (
        <AccountingQueryErrorBanner
          message={postingAccountsQuery.error.apiError.message}
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="voucher-line-description">Line description</Label>
        <Textarea
          id="voucher-line-description"
          {...form.register('description')}
        />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="voucher-line-debit">Debit</Label>
          <Input
            id="voucher-line-debit"
            inputMode="decimal"
            {...form.register('debitAmount')}
          />
          <FormErrorText message={form.formState.errors.debitAmount?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucher-line-credit">Credit</Label>
          <Input
            id="voucher-line-credit"
            inputMode="decimal"
            {...form.register('creditAmount')}
          />
          <FormErrorText message={form.formState.errors.creditAmount?.message} />
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Totals after save
              </p>
              <p className="text-sm text-muted-foreground">
                Preview the resulting voucher balance before committing this line.
              </p>
            </div>
            <BalanceBadge isBalanced={totalsPreview.isBalanced} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Total debit
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatAccountingAmount(totalsPreview.totalDebit)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Total credit
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatAccountingAmount(totalsPreview.totalCredit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending
            ? 'Saving...'
            : voucherLine
              ? 'Save line'
              : 'Add line'}
        </Button>
      </div>
    </form>
  );
};
