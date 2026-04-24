'use client';

import { useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { OutputActionGroup } from '../../components/ui/output-actions';
import { EmptyState } from '../../components/ui/empty-state';
import { isApiError } from '../../lib/api/client';
import { buildQueryString } from '../../lib/api/query-string';
import type { ProfitAndLossQueryParams } from '../../lib/api/types';
import { formatAccountingAmount } from '../../lib/format';
import { downloadApiCsv, printCurrentPage } from '../../lib/output';
import {
  DateRangeFields,
  ReportFilterActions,
  ReportFilterGrid,
} from './filters';
import { useProfitAndLossReport } from './hooks';
import {
  FinancialReportingAccessRequiredState,
  FinancialReportingFilterCard,
  FinancialReportingPageHeader,
  FinancialReportingPrintContext,
  FinancialReportingQueryErrorBanner,
  FinancialReportingReadOnlyNotice,
  FinancialReportingSection,
  ReportLoadingState,
  ReportMetricCard,
  ReportMetricGrid,
  ReportRefreshHint,
} from './shared';
import { StatementHierarchyTable } from './tables';
import {
  buildFinancialReportCsvFileName,
  formatReportDateRangeLabel,
  getDefaultReportDateRange,
  getStatementSectionCountLabel,
  isDateRangeInvalid,
} from './utils';

const buildProfitAndLossFilters = ({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}): ProfitAndLossQueryParams => ({
  dateFrom,
  dateTo,
});

export const ProfitAndLossPage = () => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessAccounting && Boolean(companyId);
  const defaultRange = getDefaultReportDateRange();

  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<ProfitAndLossQueryParams>(buildProfitAndLossFilters(defaultRange));

  const reportQuery = useProfitAndLossReport(
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
    setAppliedFilters(buildProfitAndLossFilters({ dateFrom, dateTo }));
  };

  const handleReset = () => {
    const nextDefaultRange = getDefaultReportDateRange();

    setDateFrom(nextDefaultRange.dateFrom);
    setDateTo(nextDefaultRange.dateTo);
    setValidationError(null);
    setExportError(null);
    setAppliedFilters(buildProfitAndLossFilters(nextDefaultRange));
  };

  const handleExport = async () => {
    if (!companyId) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      await downloadApiCsv(
        `companies/${companyId}/accounting/reports/profit-loss/export${buildQueryString(appliedFilters)}`,
        buildFinancialReportCsvFileName({
          companySlug: user.currentCompany.slug,
          reportSlug: 'profit-loss',
          segments: [appliedFilters.dateFrom, 'to', appliedFilters.dateTo],
        }),
      );
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the profit and loss statement.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const netProfitLoss = Number(reportQuery.data?.totals.netProfitLoss ?? 0);

  return (
    <div className="space-y-6">
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
        description="Review posted revenue and expense activity through the live chart hierarchy without introducing browser-side statement templates or write-back actions."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Profit & Loss"
      />

      <FinancialReportingReadOnlyNotice
        description="This statement is read-only and mirrors the backend grouping exactly. Revenue, expense, and net profit/loss values come from posted vouchers only."
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
          <ReportLoadingState label="Loading the profit and loss statement." />
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
                label: 'Source of truth',
                value: 'Posted vouchers only',
              },
              {
                label: 'Net profit/loss',
                value: formatAccountingAmount(reportQuery.data.totals.netProfitLoss),
              },
            ]}
            title="Profit and loss print context"
          />

          <FinancialReportingSection
            description="Sections, groups, ledgers, and posting accounts are rendered directly from the backend statement response so finance users see the real reporting hierarchy."
            title="Statement output"
          >
            <ReportMetricGrid>
              <ReportMetricCard
                label="Total revenue"
                value={
                  <span className="font-mono tabular-nums">
                    {formatAccountingAmount(reportQuery.data.totals.totalRevenue)}
                  </span>
                }
              />
              <ReportMetricCard
                label="Total expense"
                value={
                  <span className="font-mono tabular-nums">
                    {formatAccountingAmount(reportQuery.data.totals.totalExpense)}
                  </span>
                }
              />
              <ReportMetricCard
                label="Net profit/loss"
                tone={netProfitLoss >= 0 ? 'success' : 'warning'}
                value={
                  <span className="font-mono tabular-nums">
                    {formatAccountingAmount(
                      reportQuery.data.totals.netProfitLoss,
                    )}
                  </span>
                }
              />
              <ReportMetricCard
                description="Each top-level section total comes directly from the backend statement."
                label="Hierarchy scope"
                value={getStatementSectionCountLabel(reportQuery.data.sections)}
              />
            </ReportMetricGrid>

            {reportQuery.data.sections.length === 0 ? (
              <EmptyState
                description="No posted revenue or expense activity matched the selected date range."
                title="No statement activity found"
              />
            ) : (
              <StatementHierarchyTable sections={reportQuery.data.sections} />
            )}
          </FinancialReportingSection>
        </>
      ) : null}
    </div>
  );
};
