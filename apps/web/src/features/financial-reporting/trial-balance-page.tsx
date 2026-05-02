'use client';

import { useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { OutputActionGroup } from '../../components/ui/output-actions';
import { EmptyState } from '../../components/ui/empty-state';
import { AppPage } from '../../components/ui/erp-primitives';
import { buildQueryString } from '../../lib/api/query-string';
import { isApiError } from '../../lib/api/client';
import type {
  AccountingVoucherType,
  TrialBalanceQueryParams,
} from '../../lib/api/types';
import { formatAccountingAmount, formatDate } from '../../lib/format';
import { downloadApiCsv, printCurrentPage } from '../../lib/output';
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
} from './shared';
import { TrialBalanceReportTable } from './tables';
import {
  buildFinancialReportCsvFileName,
  formatReportDateRangeLabel,
  getDefaultReportDateRange,
  isDateRangeInvalid,
} from './utils';
import { TrialBalanceVisualSummary } from './analytics';

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
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
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
    setExportError(null);
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
    setExportError(null);
    setAppliedFilters(
      buildTrialBalanceFilters({
        dateFrom: nextDefaultRange.dateFrom,
        dateTo: nextDefaultRange.dateTo,
        voucherType: '',
      }),
    );
  };

  const handleExport = async () => {
    if (!companyId) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      await downloadApiCsv(
        `companies/${companyId}/accounting/reports/trial-balance/export${buildQueryString(appliedFilters)}`,
        buildFinancialReportCsvFileName({
          companySlug: user.currentCompany.slug,
          reportSlug: 'trial-balance',
          segments: [
            appliedFilters.dateFrom,
            'to',
            appliedFilters.dateTo,
            appliedFilters.voucherType
              ? appliedFilters.voucherType.toLowerCase()
              : 'all-vouchers',
          ],
        }),
      );
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the trial balance.',
      );
    } finally {
      setIsExporting(false);
    }
  };
  const report = reportQuery.data;
  const closingDebit = Number(report?.totals.closingDebit ?? 0);
  const closingCredit = Number(report?.totals.closingCredit ?? 0);
  const closingDifference = Math.abs(closingDebit - closingCredit);
  const isClosingBalanced = closingDifference < 0.005;

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
        description="Review posted accounting activity across the chart hierarchy with opening, movement, and closing debit and credit balances for the active company."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Trial Balance"
      />

      <FinancialReportingReadOnlyNotice
        description="This report is read-only and reflects posted vouchers only. It does not create write-back accounting actions or alternate statement logic in the browser."
        title="Read-only reporting"
      />

      <div className="screen-only space-y-6">
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
        {exportError ? (
          <FinancialReportingQueryErrorBanner message={exportError} />
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
      </div>

      {report ? (
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
                  report.dateFrom,
                  report.dateTo,
                ),
              },
              {
                label: 'Voucher scope',
                value: report.voucherType
                  ? report.voucherType
                  : 'All posted voucher types',
              },
              {
                label: 'Period end',
                value: formatDate(report.dateTo),
              },
            ]}
            title="Trial balance print context"
          />

          <FinancialReportingSection
            description="Debit and credit control totals for the selected company, period, and voucher scope."
            title="Executive summary"
          >
            <FinancialReportContextStrip
              items={[
                {
                  label: 'Report period',
                  value: formatReportDateRangeLabel(report.dateFrom, report.dateTo),
                },
                {
                  label: 'Voucher scope',
                  value: report.voucherType ?? 'All posted voucher types',
                },
                {
                  label: 'Balance status',
                  tone: isClosingBalanced ? 'success' : 'warning',
                  value: isClosingBalanced ? 'Balanced' : 'Out of balance',
                },
                {
                  label: 'Closing difference',
                  value: formatAccountingAmount(closingDifference),
                },
              ]}
            />
            <ReportMetricGrid>
              <ReportMetricCard
                label="Opening balance"
                value={
                  <ReportAmountPair
                    credit={report.totals.openingCredit}
                    debit={report.totals.openingDebit}
                  />
                }
              />
              <ReportMetricCard
                label="Period movement"
                value={
                  <ReportAmountPair
                    credit={report.totals.movementCredit}
                    debit={report.totals.movementDebit}
                  />
                }
              />
              <ReportMetricCard
                label="Closing balance"
                value={
                  <ReportAmountPair
                    credit={report.totals.closingCredit}
                    debit={report.totals.closingDebit}
                  />
                }
              />
              <ReportMetricCard
                description={
                  report.voucherType
                    ? `Limited to ${report.voucherType.toLowerCase()} vouchers.`
                    : 'All posted voucher types are included.'
                }
                label="Source of truth"
                value="Posted vouchers only"
              />
            </ReportMetricGrid>
          </FinancialReportingSection>

          <FinancialReportingSection
            description="Opening, period movement, and closing balances are compared without changing backend calculations."
            title="Visual analysis"
          >
            <TrialBalanceVisualSummary report={report} />
          </FinancialReportingSection>

          <FinancialReportingSection
            description="The hierarchy follows the backend report contract directly: account class, account group, ledger account, and posting account where available."
            title="Detailed hierarchy table"
          >
            {report.sections.length === 0 ? (
              <EmptyState
                description="No posted voucher activity matched the selected period and filters."
                title="No balances found"
              />
            ) : (
              <TrialBalanceReportTable
                sections={report.sections}
                totals={report.totals}
              />
            )}
          </FinancialReportingSection>

          <FinancialReportingSection
            description="Concise calculation notes for finance review and print output."
            title="Assumptions and calculation notes"
          >
            <div className="grid gap-3">
              <ReportAssumptionNote>
                Opening values include posted voucher lines before the selected
                start date; movement values include posted voucher lines inside
                the selected period.
              </ReportAssumptionNote>
              <ReportAssumptionNote>
                Closing debit and credit totals are compared as a control
                status. Any mismatch should be reviewed as a posting or data
                issue.
              </ReportAssumptionNote>
              <ReportAssumptionNote>
                This page is read-only and does not post adjustments, create
                closing entries, or alter the accounting ledger.
              </ReportAssumptionNote>
            </div>
          </FinancialReportingSection>
        </>
      ) : null}
    </AppPage>
  );
};
