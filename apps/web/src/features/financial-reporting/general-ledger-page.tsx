'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { OutputActionGroup } from '../../components/ui/output-actions';
import { EmptyState } from '../../components/ui/empty-state';
import { AppPage } from '../../components/ui/erp-primitives';
import { isApiError } from '../../lib/api/client';
import { buildQueryString } from '../../lib/api/query-string';
import type {
  AccountingVoucherType,
  GeneralLedgerQueryParams,
} from '../../lib/api/types';
import { formatAccountingAmount, formatDate } from '../../lib/format';
import { downloadApiCsv, printCurrentPage } from '../../lib/output';
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
  FinancialReportContextStrip,
  FinancialReportingPageHeader,
  FinancialReportingPrintContext,
  FinancialReportingQueryErrorBanner,
  FinancialReportingReadOnlyNotice,
  FinancialReportingSection,
  ReportAmountPair,
  ReportAssumptionNote,
  ReportLoadingState,
  ReportMetricCard,
  ReportMetricGrid,
  ReportRefreshHint,
  ReportValueList,
} from './shared';
import { GeneralLedgerLinesTable } from './tables';
import {
  buildFinancialReportCsvFileName,
  REPORTING_OPTION_PAGE_SIZE,
  formatReportDateRangeLabel,
  formatRunningBalance,
  getDefaultReportDateRange,
  isDateRangeInvalid,
} from './utils';
import { GeneralLedgerVisualSummary } from './analytics';

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
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
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
    setExportError(null);
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
    setExportError(null);
    setAppliedFilters(null);
  };

  const handleExport = async () => {
    if (!companyId || !appliedFilters || !reportQuery.data) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      await downloadApiCsv(
        `companies/${companyId}/accounting/reports/general-ledger/export${buildQueryString(appliedFilters)}`,
        buildFinancialReportCsvFileName({
          companySlug: user.currentCompany.slug,
          reportSlug: 'general-ledger',
          segments: [
            reportQuery.data.account.particularAccountCode,
            appliedFilters.dateFrom,
            'to',
            appliedFilters.dateTo,
          ],
        }),
      );
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the general ledger.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppPage>
      <FinancialReportingPageHeader
        actions={
          reportQuery.data ? (
            <OutputActionGroup
              isExporting={isExporting}
              onExport={() => void handleExport()}
              onPrint={printCurrentPage}
            />
          ) : null
        }
        description="Trace a posting-level account back to posted vouchers with opening balance, period activity, and running balance context."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="General Ledger"
      />

      <FinancialReportingReadOnlyNotice
        description="This ledger view is read-only. It follows the backend reporting contract directly and does not expose voucher edits, postings, or closing actions from this page."
        title="Read-only reporting"
      />

      <div className="screen-only space-y-6">
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
        {exportError ? (
          <FinancialReportingQueryErrorBanner message={exportError} />
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
      </div>

      {reportQuery.data ? (
        <>
          <FinancialReportingPrintContext
            items={[
              {
                label: 'Company',
                value: user.currentCompany.name,
              },
              {
                label: 'Period',
                value: formatReportDateRangeLabel(
                  reportQuery.data.dateFrom,
                  reportQuery.data.dateTo,
                ),
              },
              {
                label: 'Posting account',
                value: `${reportQuery.data.account.particularAccountCode} - ${reportQuery.data.account.particularAccountName}`,
              },
              {
                label: 'Voucher scope',
                value:
                  reportQuery.data.voucherType ?? 'All posted voucher types',
              },
            ]}
            title="General ledger print context"
          />

          <FinancialReportingSection
            description="Posting-account identity, period movement, and closing balance for the selected ledger scope."
            title="Executive summary"
          >
            <FinancialReportContextStrip
              items={[
                {
                  label: 'Report period',
                  value: formatReportDateRangeLabel(
                    reportQuery.data.dateFrom,
                    reportQuery.data.dateTo,
                  ),
                },
                {
                  label: 'Posting account',
                  value: reportQuery.data.account.particularAccountCode,
                },
                {
                  label: 'Voucher scope',
                  value:
                    reportQuery.data.voucherType ?? 'All posted voucher types',
                },
                {
                  label: 'Closing balance',
                  value: formatRunningBalance(
                    reportQuery.data.totals.closingDebit,
                    reportQuery.data.totals.closingCredit,
                  ),
                },
              ]}
            />

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
          </FinancialReportingSection>

          <FinancialReportingSection
            description="Debit and credit movement is shown across opening, period, closing, and voucher-date activity."
            title="Visual analysis"
          >
            <GeneralLedgerVisualSummary report={reportQuery.data} />
          </FinancialReportingSection>

          <FinancialReportingSection
            description="Voucher references, voucher IDs, descriptions, and running balances come directly from the backend ledger response."
            title="Detailed transaction table"
          >
            <GeneralLedgerLinesTable
              dateFrom={reportQuery.data.dateFrom}
              lines={reportQuery.data.lines}
              openingBalance={reportQuery.data.openingBalance}
              totals={reportQuery.data.totals}
            />

            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Current closing balance{' '}
              <span className="font-mono font-semibold text-foreground tabular-nums">
                {formatAccountingAmount(reportQuery.data.totals.closingDebit)}{' '}
                Dr /{' '}
                {formatAccountingAmount(reportQuery.data.totals.closingCredit)}{' '}
                Cr
              </span>
            </div>
          </FinancialReportingSection>

          <FinancialReportingSection
            description="Concise ledger notes for finance review and print output."
            title="Assumptions and calculation notes"
          >
            <div className="grid gap-3">
              <ReportAssumptionNote>
                Opening balance is calculated from posted voucher lines before
                the selected start date for this posting account.
              </ReportAssumptionNote>
              <ReportAssumptionNote>
                Period movement and running balances include only posted voucher
                lines that match the selected posting account, date range, and
                optional voucher type.
              </ReportAssumptionNote>
              <ReportAssumptionNote>
                This page is read-only and keeps voucher context visible for
                traceability; voucher editing and posting remain outside this
                report.
              </ReportAssumptionNote>
            </div>
          </FinancialReportingSection>
        </>
      ) : null}
    </AppPage>
  );
};
