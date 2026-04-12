'use client';

import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@real-capita/ui';

import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import type {
  AccountingVoucherStatus,
} from '../../lib/api/types';
import { formatVoucherStatusLabel } from './utils';

export const AccountingPageHeader = ({
  title,
  description,
  scopeName,
  scopeSlug,
  actions,
}: {
  title: string;
  description: string;
  scopeName?: string;
  scopeSlug?: string;
  actions?: ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-col gap-4 border-b border-border/70 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          Accounting
        </p>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6">
            {description}
          </CardDescription>
        </div>
        {scopeName ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{scopeName}</Badge>
            {scopeSlug ? <Badge variant="outline">{scopeSlug}</Badge> : null}
          </div>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </CardHeader>
  </Card>
);

export const AccountingQueryErrorBanner = ({
  message,
}: {
  message: string;
}) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
    {message}
  </div>
);

export const AccountingActiveBadge = ({
  isActive,
}: {
  isActive: boolean;
}) => (
  <Badge variant={isActive ? 'success' : 'warning'}>
    {isActive ? 'Active' : 'Inactive'}
  </Badge>
);

export const VoucherStatusBadge = ({
  status,
}: {
  status: AccountingVoucherStatus;
}) => (
  <Badge variant={status === 'POSTED' ? 'default' : 'outline'}>
    {formatVoucherStatusLabel(status)}
  </Badge>
);

export const BalanceBadge = ({
  isBalanced,
}: {
  isBalanced: boolean;
}) => (
  <Badge variant={isBalanced ? 'success' : 'warning'}>
    {isBalanced ? 'Balanced' : 'Unbalanced'}
  </Badge>
);

export const AccountingAccessRequiredState = () => (
  <EmptyState
    title="Accounting access required"
    description="The active session does not currently include company_admin or company_accountant access in this company scope."
  />
);

export const AccountingSection = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-col gap-4 border-b border-border/70 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-3xl leading-6">
          {description}
        </CardDescription>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </CardHeader>
    <CardContent className="space-y-5 pt-6">{children}</CardContent>
  </Card>
);

export const AccountingReadOnlyNotice = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
    <p className="font-semibold">{title}</p>
    <p className="mt-1">{description}</p>
  </div>
);

export const FormErrorText = ({
  message,
}: {
  message: string | undefined;
}) =>
  message ? <p className="text-sm text-rose-700">{message}</p> : null;
