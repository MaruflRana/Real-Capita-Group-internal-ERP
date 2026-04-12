'use client';

import { useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { isApiError } from '../../lib/api/client';
import type {
  AccountingVoucherType,
  TrialBalanceQueryParams,
} from '../../lib/api/types';
import {
  DateRangeFields,
  ReportFilterActions,
  ReportFilterGrid,
  VoucherTypeField,
} from './filters';
import { useTrialBalanceReport } from './hooks';
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
} from './shared';
import { TrialBalanceReportTable } from './tables';
import { getDefaultReportDateRange, isDateRangeInvalid } from './utils';

const buildTrialBalanceFilters = ({
  dateFrom,
  dateTo,
  voucherType,
}: {
  dateFrom: string;
  dateTo: string;
  voucherType: AccountingVoucherType | '';
}): TrialBalanceQueryParams => ({
  dateFrom,
  dateTo,
  ...(voucherType ? { voucherType } : {}),
});

export const TrialBalancePage = () => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessAccounting && Boolean(companyId);
  const defaultRange = getDefaultReportDateRange();

  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [voucherType, setVoucherType] = useState<AccountingVoucherType | ''>(
    '',
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<TrialBalanceQueryParams>(
    buildTrialBalanceFilters({
      dateFrom: defaultRange.dateFrom,
      dateTo: defaultRange.dateTo,
      voucherType: '',
    }),
  );

  const reportQuery = useTrialBalanceReport(
    companyId,
    appliedFilters,
    isEnabled,
  );

  if (!user) {
    return null;
  }

  if (!canAccessAccounting) {
    return <FinancialReportingAccessRequiredState />;
  }

  const handleApply = () => {
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
      buildTrialBalanceFilters({ dateFrom, dateTo, voucherType }),
    );
  };

  const handleReset = () => {
    const nextDefaultRange = getDefaultReportDateRange();

    setDateFrom(nextDefaultRange.dateFrom);
    setDateTo(nextDefaultRange.dateTo);
    setVoucherType('');
    setValidationError(null);
    setAppliedFilters(
      buildTrialBalanceFilters({
        dateFrom: nextDefaultRange.dateFrom,
        dateTo: nextDefaultRange.dateTo,
        voucherType: '',
      }),
    );
  };

  return (
    <div className="space-y-6">
      <FinancialReportingPageHeader
        description="Review posted accounting activity across the chart hierarchy with opening, movement, and closing debit and credit balances for the active company."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Trial Balance"
      />

      <FinancialReportingReadOnlyNotice
        description="This report is read-only and reflects posted vouchers only. It does not create write-back accounting actions or alternate statement logic in the browser."
        title="Read-only reporting"
      />

      <FinancialReportingFilterCard>
        <ReportFilterGrid>
          <DateRangeFields
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
          <VoucherTypeField onChange={setVoucherType} value={voucherType} />
        </ReportFilterGrid>
        <ReportFilterActions
          isApplying={reportQuery.isFetching}
          onApply={handleApply}
          onReset={handleReset}
        />
      </FinancialReportingFilterCard>

      {validationError ? (
        <FinancialReportingQueryErrorBanner message={validationError} />
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
        <ReportLoadingState label="Loading the company trial balance." />
      ) : null}

      {reportQuery.data ? (
        <FinancialReportingSection
          description="The hierarchy below follows the backend report contract directly: account class, account group, ledger account, and posting account where available."
          title="Report output"
        >
          <ReportMetricGrid>
            <ReportMetricCard
              label="Opening balance"
              value={
                <ReportAmountPair
                  credit={reportQuery.data.totals.openingCredit}
                  debit={reportQuery.data.totals.openingDebit}
                />
              }
            />
            <ReportMetricCard
              label="Period movement"
              value={
                <ReportAmountPair
                  credit={reportQuery.data.totals.movementCredit}
                  debit={reportQuery.data.totals.movementDebit}
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
              description={
                reportQuery.data.voucherType
                  ? `Limited to ${reportQuery.data.voucherType.toLowerCase()} vouchers.`
                  : 'All posted voucher types are included.'
              }
              label="Source of truth"
              value="Posted vouchers only"
            />
          </ReportMetricGrid>

          {reportQuery.data.sections.length === 0 ? (
            <EmptyState
              description="No posted voucher activity matched the selected period and filters."
              title="No balances found"
            />
          ) : (
            <TrialBalanceReportTable
              sections={reportQuery.data.sections}
              totals={reportQuery.data.totals}
            />
          )}
        </FinancialReportingSection>
      ) : null}
    </div>
  );
};
