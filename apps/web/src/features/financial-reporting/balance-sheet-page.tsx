'use client';

import { useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { OutputActionGroup } from '../../components/ui/output-actions';
import { EmptyState } from '../../components/ui/empty-state';
import { AppPage } from '../../components/ui/erp-primitives';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import { buildQueryString } from '../../lib/api/query-string';
import type { BalanceSheetQueryParams } from '../../lib/api/types';
import { formatAccountingAmount, formatDateTime } from '../../lib/format';
import { downloadApiCsv, printCurrentPage } from '../../lib/output';
import {
  AsOfDateField,
  ReportFilterActions,
  ReportFilterGrid,
} from './filters';
import { useBalanceSheetReport } from './hooks';
import {
  BalanceStatusBanner,
  FinancialReportingAccessRequiredState,
  FinancialReportingFilterCard,
  FinancialReportContextStrip,
  FinancialReportingPageHeader,
  FinancialReportingPrintContext,
  FinancialReportingQueryErrorBanner,
  FinancialReportingReadOnlyNotice,
  FinancialReportingSection,
  ReportAssumptionNote,
  ReportLoadingState,
  ReportMetricCard,
  ReportMetricGrid,
  ReportRefreshHint,
} from './shared';
import { StatementHierarchyTable } from './tables';
import { BalanceSheetPrintableReport } from './statement-printable';
import { buildFinancialReportCsvFileName, getDefaultAsOfDate } from './utils';
import { BalanceSheetVisualSummary } from './analytics';

const buildBalanceSheetFilters = ({
  asOfDate,
}: {
  asOfDate: string;
}): BalanceSheetQueryParams => ({
  asOfDate,
});

const getBalanceSheetAdjustmentName = ({
  code,
  name,
}: {
  code: string;
  name: string;
}) => (code === 'UNCLOSED_EARNINGS' ? 'Unclosed earnings adjustment' : name);

export const BalanceSheetPage = () => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessAccounting && Boolean(companyId);
  const defaultAsOfDate = getDefaultAsOfDate();

  const [asOfDate, setAsOfDate] = useState(defaultAsOfDate);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<BalanceSheetQueryParams>(
    buildBalanceSheetFilters({ asOfDate: defaultAsOfDate }),
  );

  const reportQuery = useBalanceSheetReport(
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
    if (!asOfDate) {
      setValidationError('An as-of date is required.');
      return;
    }

    setValidationError(null);
    setExportError(null);
    setAppliedFilters(buildBalanceSheetFilters({ asOfDate }));
  };

  const handleReset = () => {
    const nextAsOfDate = getDefaultAsOfDate();

    setAsOfDate(nextAsOfDate);
    setValidationError(null);
    setExportError(null);
    setAppliedFilters(buildBalanceSheetFilters({ asOfDate: nextAsOfDate }));
  };

  const handleExport = async () => {
    if (!companyId) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      await downloadApiCsv(
        `companies/${companyId}/accounting/reports/balance-sheet/export${buildQueryString(appliedFilters)}`,
        buildFinancialReportCsvFileName({
          companySlug: user.currentCompany.slug,
          reportSlug: 'balance-sheet',
          segments: ['as-of', appliedFilters.asOfDate],
        }),
      );
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the balance sheet.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const generatedAt = formatDateTime(
    new Date(reportQuery.dataUpdatedAt || Date.now()).toISOString(),
  );
  const printableStatusMessage =
    reportQuery.isError && isApiError(reportQuery.error)
      ? reportQuery.error.apiError.message
      : reportQuery.isPending
        ? 'The balance sheet is loading. Print after the report data has loaded.'
        : 'Apply a valid as-of date to generate the balance sheet printable statement.';

  return (
    <AppPage>
      <div
        className="printable-report-screen-content space-y-5 xl:space-y-6"
        data-testid="printable-report-screen-content"
      >
        <FinancialReportingPageHeader
          actions={
            reportQuery.data ? (
              <OutputActionGroup
                isExporting={isExporting}
                onExport={() => void handleExport()}
                onPrint={printCurrentPage}
                printLabel="Print Report"
              />
            ) : null
          }
          description="Review assets, liabilities, equity, and any derived equity adjustment used to keep the statement clear and mathematically complete."
          scopeName={user.currentCompany.name}
          scopeSlug={user.currentCompany.slug}
          title="Balance Sheet"
        />

        <FinancialReportingReadOnlyNotice
          description="This statement is read-only. If a derived unclosed earnings adjustment is required because formal closing entries do not exist yet, that adjustment is shown explicitly below."
          title="Read-only reporting"
        />

        <div className="screen-only space-y-6">
          <FinancialReportingFilterCard>
            <ReportFilterGrid>
              <AsOfDateField onChange={setAsOfDate} value={asOfDate} />
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
            <ReportLoadingState label="Loading the balance sheet." />
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
                  label: 'As-of date',
                  value: reportQuery.data.asOfDate,
                },
                {
                  label: 'Balance state',
                  value: reportQuery.data.isBalanced
                    ? 'Balanced'
                    : 'Not balanced',
                },
                {
                  label: 'Derived adjustment',
                  value: `Unclosed earnings adjustment (${formatAccountingAmount(reportQuery.data.totals.unclosedEarnings)})`,
                },
              ]}
              title="Balance sheet print context"
            />

            <FinancialReportingSection
              description="Assets, liabilities, equity, and the balance equation for the selected as-of date."
              title="Executive summary"
            >
              <BalanceStatusBanner isBalanced={reportQuery.data.isBalanced} />
              <FinancialReportContextStrip
                items={[
                  {
                    label: 'As-of date',
                    value: reportQuery.data.asOfDate,
                  },
                  {
                    label: 'Balance equation',
                    value: `${formatAccountingAmount(
                      reportQuery.data.totals.totalAssets,
                    )} = ${formatAccountingAmount(
                      reportQuery.data.totals.totalLiabilitiesAndEquity,
                    )}`,
                  },
                  {
                    label: 'Balance status',
                    tone: reportQuery.data.isBalanced ? 'success' : 'warning',
                    value: reportQuery.data.isBalanced
                      ? 'Balanced'
                      : 'Not balanced',
                  },
                  {
                    label: 'Derived adjustment',
                    value: 'Unclosed earnings adjustment',
                  },
                ]}
              />
              <ReportMetricGrid>
                <ReportMetricCard
                  label="Total assets"
                  value={
                    <span className="font-mono tabular-nums">
                      {formatAccountingAmount(
                        reportQuery.data.totals.totalAssets,
                      )}
                    </span>
                  }
                />
                <ReportMetricCard
                  label="Total liabilities"
                  value={
                    <span className="font-mono tabular-nums">
                      {formatAccountingAmount(
                        reportQuery.data.totals.totalLiabilities,
                      )}
                    </span>
                  }
                />
                <ReportMetricCard
                  label="Total equity"
                  value={
                    <span className="font-mono tabular-nums">
                      {formatAccountingAmount(
                        reportQuery.data.totals.totalEquity,
                      )}
                    </span>
                  }
                />
                <ReportMetricCard
                  label="Liabilities + equity"
                  tone={reportQuery.data.isBalanced ? 'success' : 'warning'}
                  value={
                    <span className="font-mono tabular-nums">
                      {formatAccountingAmount(
                        reportQuery.data.totals.totalLiabilitiesAndEquity,
                      )}
                    </span>
                  }
                />
              </ReportMetricGrid>
            </FinancialReportingSection>

            <FinancialReportingSection
              description="Assets and liabilities plus equity are compared using the same totals as the statement."
              title="Visual analysis"
            >
              <BalanceSheetVisualSummary report={reportQuery.data} />
            </FinancialReportingSection>

            <FinancialReportingSection
              description="Assets, liabilities, and equity sections follow the company reporting hierarchy."
              title="Detailed statement table"
            >
              {reportQuery.data.sections.length === 0 ? (
                <EmptyState
                  description="No balance sheet sections were returned for the selected as-of date."
                  title="No statement balances found"
                />
              ) : (
                <StatementHierarchyTable sections={reportQuery.data.sections} />
              )}
            </FinancialReportingSection>

            <FinancialReportingSection
              description="This adjustment is shown separately because formal closing entries are not yet part of the accounting workflow."
              title="Equity adjustments"
            >
              <ReportMetricGrid>
                <ReportMetricCard
                  description="This total is included in the equity calculation."
                  label="Unclosed earnings adjustment"
                  value={
                    <span className="font-mono tabular-nums">
                      {formatAccountingAmount(
                        reportQuery.data.totals.unclosedEarnings,
                      )}
                    </span>
                  }
                />
              </ReportMetricGrid>

              {reportQuery.data.equityAdjustments.length === 0 ? (
                <EmptyState
                  description="No additional equity adjustment lines were found for this as-of date."
                  title="No derived adjustments"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adjustment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportQuery.data.equityAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.code}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {getBalanceSheetAdjustmentName(adjustment)}
                            </p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              Adjustment code: {adjustment.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-foreground">
                          {formatAccountingAmount(adjustment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </FinancialReportingSection>

            <FinancialReportingSection
              description="Concise statement notes for finance review and print output."
              title="Assumptions and calculation notes"
            >
              <div className="grid gap-3">
                <ReportAssumptionNote>
                  Assets, liabilities, and equity are calculated from posted
                  accounting balances up to and including the selected as-of
                  date.
                </ReportAssumptionNote>
                <ReportAssumptionNote>
                  Because formal closing entries are not yet available, the
                  statement shows unclosed earnings as a named equity adjustment
                  instead of hiding it inside equity.
                </ReportAssumptionNote>
                <ReportAssumptionNote>
                  The balance equation is presented as Assets = Liabilities +
                  Equity for the active company scope.
                </ReportAssumptionNote>
              </div>
            </FinancialReportingSection>
          </>
        ) : null}
      </div>

      <BalanceSheetPrintableReport
        generatedAt={generatedAt}
        generatedBy={user.email}
        report={reportQuery.data ?? null}
        statusMessage={printableStatusMessage}
        userCompanyName={user.currentCompany.name}
      />
    </AppPage>
  );
};
