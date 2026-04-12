'use client';

import Link from 'next/link';
import { startTransition } from 'react';
import { useRouter } from 'next/navigation';

import { buttonVariants, cn } from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { APP_ROUTES, getVoucherDetailRoute } from '../../lib/routes';
import { useCreateVoucherDraft } from './hooks';
import {
  AccountingAccessRequiredState,
  AccountingPageHeader,
  AccountingQueryErrorBanner,
} from './shared';
import {
  VoucherHeaderForm,
  type VoucherHeaderFormValues,
} from './voucher-forms';

const createDefaultValues = (): VoucherHeaderFormValues => ({
  voucherType: 'JOURNAL',
  voucherDate: new Date().toISOString().slice(0, 10),
  reference: '',
  description: '',
});

export const VoucherCreatePage = () => {
  const router = useRouter();
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const createVoucherDraftMutation = useCreateVoucherDraft(companyId);

  const buildPayload = (values: VoucherHeaderFormValues) => ({
    voucherType: values.voucherType,
    voucherDate: values.voucherDate,
    ...(values.reference?.trim()
      ? { reference: values.reference.trim() }
      : {}),
    ...(values.description?.trim()
      ? { description: values.description.trim() }
      : {}),
  });

  if (!user) {
    return null;
  }

  if (!canAccessAccounting) {
    return <AccountingAccessRequiredState />;
  }

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="Create voucher draft"
        description="Start a new voucher with the header information first. After the draft is created, continue in the detail view to add posting lines and post explicitly."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={APP_ROUTES.accountingVouchers}
          >
            Back to vouchers
          </Link>
        }
      />

      {createVoucherDraftMutation.isError &&
      createVoucherDraftMutation.error instanceof Error ? (
        <AccountingQueryErrorBanner
          message={createVoucherDraftMutation.error.message}
        />
      ) : null}

      <div className="rounded-3xl border border-border/70 bg-card/80 p-6">
        <VoucherHeaderForm
          defaultValues={createDefaultValues()}
          isPending={createVoucherDraftMutation.isPending}
          onSubmit={async (values) => {
            const voucher = await createVoucherDraftMutation.mutateAsync(
              buildPayload(values),
            );

            startTransition(() => {
              router.replace(getVoucherDetailRoute(voucher.id));
            });
          }}
          submitErrorFallback="Unable to create the voucher draft."
          submitLabel="Create draft"
        />
      </div>
    </div>
  );
};
