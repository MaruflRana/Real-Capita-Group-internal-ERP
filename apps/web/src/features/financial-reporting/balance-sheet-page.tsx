'use client';

import { useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import type { BalanceSheetQueryParams } from '../../lib/api/types';
import { formatAccountingAmount } from '../../lib/format';
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
  FinancialReportingPageHeader,
  FinancialReportingQueryErrorBanner,
  FinancialReportingReadOnlyNotice,
  FinancialReportingSection,
  ReportLoadingState,
  ReportMetricCard,
  ReportMetricGrid,
  ReportRefreshHint,
} from './shared';
import { StatementHierarchyTable } from './tables';
import { getDefaultAsOfDate } from './utils';

const buildBalanceSheetFilters = ({
  asOfDate,
}: {
  asOfDate: string;
}): BalanceSheetQueryParams => ({
  asOfDate,
});

export const BalanceSheetPage = () => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessAccounting && Boolean(companyId);
  const defaultAsOfDate = getDefaultAsOfDate();

  const [asOfDate, setAsOfDate] = useState(defaultAsOfDate);
  const [validationError, setValidationError] = useState<string | null>(null);
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
    setAppliedFilters(buildBalanceSheetFilters({ asOfDate }));
  };

  const handleReset = () => {
    const nextAsOfDate = getDefaultAsOfDate();

    setAsOfDate(nextAsOfDate);
    setValidationError(null);
    setAppliedFilters(buildBalanceSheetFilters({ asOfDate: nextAsOfDate }));
  };

  return (
    <div className="space-y-6">
      <FinancialReportingPageHeader
        description="Review assets, liabilities, equity, and any derived equity adjustment the backend includes to keep the statement honest and mathematically complete."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Balance Sheet"
      />

      <FinancialReportingReadOnlyNotice
        description="This statement is read-only. If the backend includes a derived unclosed earnings adjustment because formal closing entries do not exist yet, that adjustment is shown explicitly below."
        title="Read-only reporting"
      />

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

      {reportQuery.data ? (
        <>
          <BalanceStatusBanner isBalanced={reportQuery.data.isBalanced} />

          <FinancialReportingSection
            description="Assets, liabilities, and equity sections below are rendered directly from the backend hierarchy. Totals remain company-scoped and as-of-date scoped."
            title="Statement output"
          >
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
            description="Prompt 19 derives this adjustment on the backend because formal closing entries are not yet part of the accounting workflow. The frontend presents that fact directly instead of hiding it inside equity totals."
            title="Equity adjustments"
          >
            <ReportMetricGrid>
              <ReportMetricCard
                description="This total is included in the backend equity calculation."
                label="Unclosed earnings"
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
                description="The backend did not return any additional equity adjustment lines for this as-of date."
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
                            {adjustment.name}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {adjustment.code}
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
        </>
      ) : null}
    </div>
  );
};
