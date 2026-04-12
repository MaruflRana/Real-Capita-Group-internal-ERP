'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { Button } from '@real-capita/ui';

import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { ReportLoadingState } from './shared';
import { formatVoucherTypeLabel, getPostingAccountOptionLabel } from './utils';

import type {
  AccountingVoucherType,
  PaginatedResponse,
  ParticularAccountRecord,
} from '../../lib/api/types';

const VOUCHER_TYPE_OPTIONS: AccountingVoucherType[] = [
  'RECEIPT',
  'PAYMENT',
  'JOURNAL',
  'CONTRA',
];

export const ReportFilterGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-4 xl:grid-cols-4">{children}</div>
);

export const DateRangeFields = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: Dispatch<SetStateAction<string>>;
  onDateToChange: Dispatch<SetStateAction<string>>;
}) => (
  <>
    <div className="space-y-2">
      <Label htmlFor="report-date-from">Date from</Label>
      <Input
        id="report-date-from"
        onChange={(event) => onDateFromChange(event.target.value)}
        type="date"
        value={dateFrom}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="report-date-to">Date to</Label>
      <Input
        id="report-date-to"
        onChange={(event) => onDateToChange(event.target.value)}
        type="date"
        value={dateTo}
      />
    </div>
  </>
);

export const AsOfDateField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
}) => (
  <div className="space-y-2">
    <Label htmlFor="report-as-of-date">As-of date</Label>
    <Input
      id="report-as-of-date"
      onChange={(event) => onChange(event.target.value)}
      type="date"
      value={value}
    />
  </div>
);

export const VoucherTypeField = ({
  value,
  onChange,
}: {
  value: AccountingVoucherType | '';
  onChange: Dispatch<SetStateAction<AccountingVoucherType | ''>>;
}) => (
  <div className="space-y-2">
    <Label htmlFor="report-voucher-type">Voucher type</Label>
    <Select
      id="report-voucher-type"
      onChange={(event) =>
        onChange(event.target.value as AccountingVoucherType | '')
      }
      value={value}
    >
      <option value="">All posted voucher types</option>
      {VOUCHER_TYPE_OPTIONS.map((voucherType) => (
        <option key={voucherType} value={voucherType}>
          {formatVoucherTypeLabel(voucherType)}
        </option>
      ))}
    </Select>
  </div>
);

export const PostingAccountSelector = ({
  accounts,
  isLoading,
  search,
  onSearchChange,
  value,
  onValueChange,
}: {
  accounts: PaginatedResponse<ParticularAccountRecord> | undefined;
  isLoading: boolean;
  search: string;
  onSearchChange: Dispatch<SetStateAction<string>>;
  value: string;
  onValueChange: Dispatch<SetStateAction<string>>;
}) => (
  <>
    <div className="space-y-2 xl:col-span-2">
      <Label htmlFor="general-ledger-account-search">
        Posting account search
      </Label>
      <Input
        id="general-ledger-account-search"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by account code, name, ledger, or group"
        value={search}
      />
    </div>
    <div className="space-y-2 xl:col-span-2">
      <Label htmlFor="general-ledger-account-select">Posting account</Label>
      <Select
        id="general-ledger-account-select"
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      >
        <option value="">Select a posting account</option>
        {(accounts?.items ?? []).map((account) => (
          <option key={account.id} value={account.id}>
            {getPostingAccountOptionLabel(account)}
          </option>
        ))}
      </Select>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Refreshing account options.
        </p>
      ) : null}
    </div>
  </>
);

export const ReportFilterActions = ({
  onApply,
  onReset,
  isApplying,
  disableApply = false,
}: {
  onApply: () => void;
  onReset: () => void;
  isApplying: boolean;
  disableApply?: boolean;
}) => (
  <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
    <Button disabled={disableApply} onClick={onApply} type="button">
      Apply filters
    </Button>
    <Button onClick={onReset} type="button" variant="outline">
      Reset
    </Button>
    {isApplying ? (
      <span className="text-sm text-muted-foreground">Loading report.</span>
    ) : null}
  </div>
);

export const ReportFilterLoadingFallback = ({ label }: { label: string }) => (
  <ReportLoadingState label={label} />
);
