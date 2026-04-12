'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { isApiError } from '../../lib/api/client';
import type {
  AccountingVoucherType,
  GeneralLedgerQueryParams,
} from '../../lib/api/types';
import { formatAccountingAmount, formatDate } from '../../lib/format';
import {
  DateRangeFields,
  PostingAccountSelector,
  ReportFilterActions,
  ReportFilterGrid,
  VoucherTypeField,
} from './filters';
import { useGeneralLedgerReport, useReportingPostingAccounts } from './hooks';
import {
  FinancialReportingAccessRequiredState,
  FinancialReportingFilterCard,
  FinancialReportingPageHeader,
  FinancialReportingQueryErrorBanner,
  FinancialReportingReadOnlyNotice,
  FinancialReportingSection,
  ReportAmountPair,
  ReportLoadingState,
  ReportMetricCard,
  ReportMetricGrid,
  ReportRefreshHint,
  ReportValueList,
} from './shared';
import { GeneralLedgerLinesTable } from './tables';
import {
  REPORTING_OPTION_PAGE_SIZE,
  getDefaultReportDateRange,
  isDateRangeInvalid,
} from './utils';

const buildGeneralLedgerFilters = ({
  particularAccountId,
  dateFrom,
  dateTo,
  voucherType,
}: {
  particularAccountId: string;
  dateFrom: string;
  dateTo: string;
  voucherType: AccountingVoucherType | '';
}): GeneralLedgerQueryParams => ({
  particularAccountId,
  dateFrom,
  dateTo,
  ...(voucherType ? { voucherType } : {}),
});

export const GeneralLedgerPage = () => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessAccounting && Boolean(companyId);
  const defaultRange = getDefaultReportDateRange();

  const [accountSearch, setAccountSearch] = useState('');
  const deferredAccountSearch = useDeferredValue(accountSearch);
  const [particularAccountId, setParticularAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [voucherType, setVoucherType] = useState<AccountingVoucherType | ''>(
    '',
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] =
    useState<GeneralLedgerQueryParams | null>(null);

  const accountQueryInput = useMemo(
    () => ({
      page: 1,
      pageSize: REPORTING_OPTION_PAGE_SIZE,
      sortBy: 'code',
      sortOrder: 'asc' as const,
      isActive: true,
      ...(deferredAccountSearch ? { search: deferredAccountSearch } : {}),
    }),
    [deferredAccountSearch],
  );

  const postingAccountsQuery = useReportingPostingAccounts(
    companyId,
    accountQueryInput,
    isEnabled,
  );
  const reportQuery = useGeneralLedgerReport(
    companyId,
    appliedFilters ?? {
      particularAccountId: '',
      dateFrom: defaultRange.dateFrom,
      dateTo: defaultRange.dateTo,
    },
    isEnabled && Boolean(appliedFilters),
  );

  if (!user) {
    return null;
  }

  if (!canAccessAccounting) {
    return <FinancialReportingAccessRequiredState />;
  }

  const handleApply = () => {
    if (!particularAccountId) {
      setValidationError(
        'A posting account is required for the general ledger.',
      );
      return;
    }

    if (!dateFrom || !dateTo) {
      setValidationError('Both report dates are required.');
      return;
    }

    if (isDateRangeInvalid(dateFrom, dateTo)) {
      setValidationError('Date from cannot be later than date to.');
      return;
    }

    setValidationError(null);
    setAppliedFilters(
      buildGeneralLedgerFilters({
        particularAccountId,
        dateFrom,
        dateTo,
        voucherType,
      }),
    );
  };

  const handleReset = () => {
    const nextDefaultRange = getDefaultReportDateRange();

    setAccountSearch('');
    setParticularAccountId('');
    setDateFrom(nextDefaultRange.dateFrom);
    setDateTo(nextDefaultRange.dateTo);
    setVoucherType('');
    setValidationError(null);
    setAppliedFilters(null);
  };

  return (
    <div className="space-y-6">
      <FinancialReportingPageHeader
        description="Trace a posting-level account back to posted vouchers with opening balance, period activity, and running balance context."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="General Ledger"
      />

      <FinancialReportingReadOnlyNotice
        description="This ledger view is read-only. It follows the backend reporting contract directly and does not expose voucher edits, postings, or closing actions from this page."
        title="Read-only reporting"
      />

      <FinancialReportingFilterCard>
        <ReportFilterGrid>
          <PostingAccountSelector
            accounts={postingAccountsQuery.data}
            isLoading={postingAccountsQuery.isFetching}
            onSearchChange={setAccountSearch}
            onValueChange={setParticularAccountId}
            search={accountSearch}
            value={particularAccountId}
          />
          <DateRangeFields
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
          <VoucherTypeField onChange={setVoucherType} value={voucherType} />
        </ReportFilterGrid>
        <ReportFilterActions
          disableApply={postingAccountsQuery.isPending}
          isApplying={reportQuery.isFetching}
          onApply={handleApply}
          onReset={handleReset}
        />
      </FinancialReportingFilterCard>

      {validationError ? (
        <FinancialReportingQueryErrorBanner message={validationError} />
      ) : null}
      {postingAccountsQuery.isError &&
      isApiError(postingAccountsQuery.error) ? (
        <FinancialReportingQueryErrorBanner
          message={postingAccountsQuery.error.apiError.message}
        />
      ) : null}
      {reportQuery.isError && isApiError(reportQuery.error) ? (
        <FinancialReportingQueryErrorBanner
          message={reportQuery.error.apiError.message}
        />
      ) : null}
      <ReportRefreshHint
        isFetching={reportQuery.isFetching && !!reportQuery.data}
      />

      {reportQuery.isPending && !reportQuery.data ? (
        <ReportLoadingState label="Loading the posting-account general ledger." />
      ) : null}

      {!appliedFilters && !reportQuery.data ? (
        <EmptyState
          description="Choose an active posting account and apply the date range to load the general ledger."
          title="General ledger filter required"
        />
      ) : null}

      {reportQuery.data ? (
        <FinancialReportingSection
          description="Voucher references, voucher IDs, and line descriptions come directly from the backend ledger response for finance-side traceability."
          title="Ledger output"
        >
          <ReportValueList
            items={[
              {
                label: 'Account class',
                value: `${reportQuery.data.account.accountClassCode} - ${reportQuery.data.account.accountClassName}`,
              },
              {
                label: 'Account group',
                value: `${reportQuery.data.account.accountGroupCode} - ${reportQuery.data.account.accountGroupName}`,
              },
              {
                label: 'Ledger account',
                value: `${reportQuery.data.account.ledgerAccountCode} - ${reportQuery.data.account.ledgerAccountName}`,
              },
              {
                label: 'Posting account',
                value: `${reportQuery.data.account.particularAccountCode} - ${reportQuery.data.account.particularAccountName}`,
              },
            ]}
          />

          <ReportMetricGrid>
            <ReportMetricCard
              label="Opening balance"
              value={
                <ReportAmountPair
                  credit={reportQuery.data.openingBalance.credit}
                  debit={reportQuery.data.openingBalance.debit}
                />
              }
            />
            <ReportMetricCard
              label="Period movement"
              value={
                <ReportAmountPair
                  credit={reportQuery.data.totals.credit}
                  debit={reportQuery.data.totals.debit}
                />
              }
            />
            <ReportMetricCard
              label="Closing balance"
              value={
                <ReportAmountPair
                  credit={reportQuery.data.totals.closingCredit}
                  debit={reportQuery.data.totals.closingDebit}
                />
              }
            />
            <ReportMetricCard
              description={`Period ${formatDate(reportQuery.data.dateFrom)} to ${formatDate(reportQuery.data.dateTo)}.`}
              label="Posted lines"
              value={`${reportQuery.data.lines.length} line${
                reportQuery.data.lines.length === 1 ? '' : 's'
              }`}
            />
          </ReportMetricGrid>

          <GeneralLedgerLinesTable
            dateFrom={reportQuery.data.dateFrom}
            lines={reportQuery.data.lines}
            openingBalance={reportQuery.data.openingBalance}
            totals={reportQuery.data.totals}
          />

          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Current closing balance{' '}
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {formatAccountingAmount(reportQuery.data.totals.closingDebit)} Dr
              / {formatAccountingAmount(reportQuery.data.totals.closingCredit)}{' '}
              Cr
            </span>
          </div>
        </FinancialReportingSection>
      ) : null}
    </div>
  );
};
