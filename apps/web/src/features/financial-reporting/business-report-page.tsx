'use client';

import { useState } from 'react';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { AppPage } from '../../components/ui/erp-primitives';
import { Label } from '../../components/ui/label';
import { OutputActionGroup } from '../../components/ui/output-actions';
import { Select } from '../../components/ui/select';
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
import type {
  BusinessOverviewReportBucketRecord,
  BusinessOverviewReportQueryParams,
  BusinessOverviewReportResponseRecord,
  BusinessReportBucket,
} from '../../lib/api/types';
import { formatAccountingAmount } from '../../lib/format';
import { downloadApiCsv, printCurrentPage } from '../../lib/output';
import { DistributionChartCard, TrendChartCard } from '../analytics/components';
import {
  DateRangeFields,
  ReportFilterActions,
  ReportFilterGrid,
} from './filters';
import { useBusinessOverviewReport } from './hooks';
import {
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
import {
  buildFinancialReportCsvFileName,
  formatReportDateRangeLabel,
  isDateRangeInvalid,
} from './utils';

export type BusinessReportMode =
  | 'overview'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

const BUSINESS_REPORT_BUCKETS: Array<{
  value: BusinessReportBucket;
  label: string;
}> = [
  { value: 'day', label: 'Daily buckets' },
  { value: 'week', label: 'Weekly buckets' },
  { value: 'month', label: 'Monthly buckets' },
  { value: 'year', label: 'Yearly buckets' },
];

const MODE_CONFIG: Record<
  BusinessReportMode,
  {
    title: string;
    description: string;
    reportSlug: string;
    defaultBucket: BusinessReportBucket;
  }
> = {
  overview: {
    title: 'Business Overview Report',
    description:
      'Company-scoped sales, collections, revenue, expenses, and profit/loss trends from existing CRM/property and posted accounting data.',
    reportSlug: 'business-overview',
    defaultBucket: 'month',
  },
  daily: {
    title: 'Daily Report',
    description:
      'Daily operational performance across sales contracts, collections, posted revenue, expenses, and voucher activity.',
    reportSlug: 'daily-report',
    defaultBucket: 'day',
  },
  weekly: {
    title: 'Weekly Report',
    description:
      'Weekly business movement grouped from existing company records without changing accounting or CRM calculations.',
    reportSlug: 'weekly-report',
    defaultBucket: 'week',
  },
  monthly: {
    title: 'Monthly Report',
    description:
      'Monthly trend reporting for contracted sales, collected sales, revenue, expenses, and net profit/loss.',
    reportSlug: 'monthly-report',
    defaultBucket: 'month',
  },
  yearly: {
    title: 'Yearly Report',
    description:
      'Yearly financial-performance reporting for contracted sales, collections, revenue, expenses, net profit/loss, and report activity counts.',
    reportSlug: 'yearly-report',
    defaultBucket: 'year',
  },
};

const toDateInputString = (value: Date): string =>
  value.toISOString().slice(0, 10);

const getDefaultBusinessReportRange = (mode: BusinessReportMode) => {
  const today = new Date();

  if (mode === 'daily') {
    return {
      dateFrom: toDateInputString(
        new Date(today.getFullYear(), today.getMonth(), 1),
      ),
      dateTo: toDateInputString(today),
    };
  }

  if (mode === 'weekly') {
    const start = new Date(today);

    start.setDate(today.getDate() - 83);

    return {
      dateFrom: toDateInputString(start),
      dateTo: toDateInputString(today),
    };
  }

  if (mode === 'yearly') {
    const start = new Date(today.getFullYear() - 4, 0, 1);

    return {
      dateFrom: toDateInputString(start),
      dateTo: toDateInputString(today),
    };
  }

  return {
    dateFrom: toDateInputString(new Date(today.getFullYear(), 0, 1)),
    dateTo: toDateInputString(today),
  };
};

const buildBusinessReportFilters = ({
  bucket,
  dateFrom,
  dateTo,
}: {
  bucket: BusinessReportBucket;
  dateFrom: string;
  dateTo: string;
}): BusinessOverviewReportQueryParams => ({
  bucket,
  dateFrom,
  dateTo,
});

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const amount = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(amount) ? amount : 0;
};

const formatCount = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);

const hasBusinessReportData = (
  report: BusinessOverviewReportResponseRecord,
) => {
  const totals = report.totals;

  return (
    toNumber(totals.contractedSalesAmount) !== 0 ||
    toNumber(totals.collectedSalesAmount) !== 0 ||
    toNumber(totals.revenueAmount) !== 0 ||
    toNumber(totals.expenseAmount) !== 0 ||
    toNumber(totals.netProfitLossAmount) !== 0 ||
    totals.voucherCount > 0 ||
    totals.bookingCount > 0 ||
    totals.saleContractCount > 0 ||
    totals.collectionCount > 0
  );
};

const getPerformanceTrend = (report: BusinessOverviewReportResponseRecord) =>
  report.buckets.map((bucket) => ({
    key: bucket.bucketKey,
    label: bucket.bucketLabel,
    values: {
      revenue: toNumber(bucket.revenueAmount),
      expenses: toNumber(bucket.expenseAmount),
      profitLoss: toNumber(bucket.netProfitLossAmount),
    },
  }));

const getSalesCollectionsTrend = (
  report: BusinessOverviewReportResponseRecord,
) =>
  report.buckets.map((bucket) => ({
    key: bucket.bucketKey,
    label: bucket.bucketLabel,
    values: {
      contractedSales: toNumber(bucket.contractedSalesAmount),
      collectedSales: toNumber(bucket.collectedSalesAmount),
    },
  }));

const getActivityDistribution = (
  report: BusinessOverviewReportResponseRecord,
) => [
  {
    key: 'bookings',
    label: 'Bookings',
    value: report.totals.bookingCount,
  },
  {
    key: 'contracts',
    label: 'Sale contracts',
    value: report.totals.saleContractCount,
  },
  {
    key: 'collections',
    label: 'Collections',
    value: report.totals.collectionCount,
  },
  {
    key: 'posted-vouchers',
    label: 'Posted vouchers',
    value: report.totals.postedVoucherCount,
  },
  {
    key: 'draft-vouchers',
    label: 'Draft vouchers',
    value: report.totals.draftVoucherCount,
  },
];

const AmountCell = ({ value }: { value: string }) => (
  <span className="whitespace-nowrap font-mono tabular-nums">
    {formatAccountingAmount(value)}
  </span>
);

const BusinessReportBreakdownTable = ({
  buckets,
}: {
  buckets: BusinessOverviewReportBucketRecord[];
}) => (
  <Table className="min-w-[1160px]">
    <TableHeader>
      <TableRow>
        <TableHead className="normal-case tracking-normal">Period</TableHead>
        <TableHead className="normal-case tracking-normal">
          Contracted sales
        </TableHead>
        <TableHead className="normal-case tracking-normal">
          Collected sales
        </TableHead>
        <TableHead className="normal-case tracking-normal">Revenue</TableHead>
        <TableHead className="normal-case tracking-normal">Expenses</TableHead>
        <TableHead className="normal-case tracking-normal">
          Net profit/loss
        </TableHead>
        <TableHead className="normal-case tracking-normal">Vouchers</TableHead>
        <TableHead className="normal-case tracking-normal">Bookings</TableHead>
        <TableHead className="normal-case tracking-normal">Contracts</TableHead>
        <TableHead className="normal-case tracking-normal">
          Collections
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {buckets.map((bucket) => (
        <TableRow key={bucket.bucketKey}>
          <TableCell>
            <div className="min-w-36">
              <p className="font-medium text-foreground">
                {bucket.bucketLabel}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {bucket.bucketStart} to {bucket.bucketEnd}
              </p>
            </div>
          </TableCell>
          <TableCell>
            <AmountCell value={bucket.contractedSalesAmount} />
          </TableCell>
          <TableCell>
            <AmountCell value={bucket.collectedSalesAmount} />
          </TableCell>
          <TableCell>
            <AmountCell value={bucket.revenueAmount} />
          </TableCell>
          <TableCell>
            <AmountCell value={bucket.expenseAmount} />
          </TableCell>
          <TableCell>
            <AmountCell value={bucket.netProfitLossAmount} />
          </TableCell>
          <TableCell>{formatCount(bucket.voucherCount)}</TableCell>
          <TableCell>{formatCount(bucket.bookingCount)}</TableCell>
          <TableCell>{formatCount(bucket.saleContractCount)}</TableCell>
          <TableCell>{formatCount(bucket.collectionCount)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const BusinessReportPage = ({ mode }: { mode: BusinessReportMode }) => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const config = MODE_CONFIG[mode];
  const defaultRange = getDefaultBusinessReportRange(mode);
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [bucket, setBucket] = useState<BusinessReportBucket>(
    config.defaultBucket,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<BusinessOverviewReportQueryParams>(
      buildBusinessReportFilters({
        ...defaultRange,
        bucket: config.defaultBucket,
      }),
    );
  const isEnabled = canAccessAccounting && Boolean(companyId);
  const canChooseBucket = mode === 'overview';
  const reportQuery = useBusinessOverviewReport(
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
      buildBusinessReportFilters({
        bucket: canChooseBucket ? bucket : config.defaultBucket,
        dateFrom,
        dateTo,
      }),
    );
  };

  const handleReset = () => {
    const nextRange = getDefaultBusinessReportRange(mode);

    setDateFrom(nextRange.dateFrom);
    setDateTo(nextRange.dateTo);
    setBucket(config.defaultBucket);
    setValidationError(null);
    setExportError(null);
    setAppliedFilters(
      buildBusinessReportFilters({
        ...nextRange,
        bucket: config.defaultBucket,
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
        `companies/${companyId}/accounting/reports/business-overview/export${buildQueryString(appliedFilters)}`,
        buildFinancialReportCsvFileName({
          companySlug: user.currentCompany.slug,
          reportSlug: config.reportSlug,
          segments: [
            appliedFilters.bucket ?? config.defaultBucket,
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
            : 'Unable to export the business report.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const report = reportQuery.data;
  const hasData = report ? hasBusinessReportData(report) : false;
  const netProfitLoss = toNumber(report?.totals.netProfitLossAmount);

  return (
    <AppPage>
      <FinancialReportingPageHeader
        actions={
          report ? (
            <OutputActionGroup
              isExporting={isExporting}
              onExport={() => void handleExport()}
              onPrint={printCurrentPage}
            />
          ) : null
        }
        description={config.description}
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title={config.title}
      />

      <FinancialReportingReadOnlyNotice
        description="This report is read-only. Contracted sales and collections come from CRM/property records, while revenue, expenses, and profit/loss come from posted accounting vouchers."
        title="Company-scoped business reporting"
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
            {canChooseBucket ? (
              <div className="space-y-2">
                <Label htmlFor="business-report-bucket">Period type</Label>
                <Select
                  id="business-report-bucket"
                  onChange={(event) =>
                    setBucket(event.target.value as BusinessReportBucket)
                  }
                  value={bucket}
                >
                  {BUSINESS_REPORT_BUCKETS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
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
        <ReportRefreshHint isFetching={reportQuery.isFetching && !!report} />

        {reportQuery.isPending && !report ? (
          <ReportLoadingState label="Loading the business report." />
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
                label: 'Grouping',
                value: report.bucket,
              },
              {
                label: 'Net profit/loss',
                value: formatAccountingAmount(
                  report.totals.netProfitLossAmount,
                ),
              },
            ]}
            title={`${config.title} print context`}
          />

          <FinancialReportingSection
            description="Finance-grade headline values for the selected company, period, and grouping. Values are returned by the read-only reporting endpoint."
            title="Executive summary"
          >
            <FinancialReportContextStrip
              items={[
                {
                  label: 'Report period',
                  value: formatReportDateRangeLabel(
                    report.dateFrom,
                    report.dateTo,
                  ),
                },
                {
                  label: 'Grouping',
                  value:
                    report.bucket === 'year'
                      ? 'Yearly buckets'
                      : report.bucket === 'month'
                        ? 'Monthly buckets'
                        : report.bucket === 'week'
                          ? 'Weekly buckets'
                          : 'Daily buckets',
                },
                {
                  label: 'Data source',
                  value: 'CRM/property + posted vouchers',
                },
                {
                  label: 'Result',
                  tone: netProfitLoss >= 0 ? 'success' : 'warning',
                  value: netProfitLoss >= 0 ? 'Profit' : 'Loss',
                },
              ]}
            />
            <ReportMetricGrid>
              <ReportMetricCard
                label="Contracted sales"
                value={
                  <span className="font-mono tabular-nums">
                    {formatAccountingAmount(
                      report.totals.contractedSalesAmount,
                    )}
                  </span>
                }
              />
              <ReportMetricCard
                label="Collected sales"
                value={
                  <span className="font-mono tabular-nums">
                    {formatAccountingAmount(report.totals.collectedSalesAmount)}
                  </span>
                }
              />
              <ReportMetricCard
                label="Revenue"
                value={
                  <span className="font-mono tabular-nums">
                    {formatAccountingAmount(report.totals.revenueAmount)}
                  </span>
                }
              />
              <ReportMetricCard
                label="Expenses"
                value={
                  <span className="font-mono tabular-nums">
                    {formatAccountingAmount(report.totals.expenseAmount)}
                  </span>
                }
              />
              <ReportMetricCard
                label="Net profit/loss"
                tone={netProfitLoss >= 0 ? 'success' : 'warning'}
                value={
                  <span className="font-mono tabular-nums">
                    {formatAccountingAmount(report.totals.netProfitLossAmount)}
                  </span>
                }
              />
              <ReportMetricCard
                label="Voucher workload"
                value={formatCount(report.totals.voucherCount)}
                description={`${formatCount(report.totals.postedVoucherCount)} posted / ${formatCount(report.totals.draftVoucherCount)} draft`}
              />
            </ReportMetricGrid>

            {!hasData ? (
              <EmptyState
                description="No reportable activity matched this company and date range. For a populated supervisor demo, run corepack pnpm seed:demo and then corepack pnpm seed:demo:verify."
                title="No business report activity"
              />
            ) : null}
          </FinancialReportingSection>

          <FinancialReportingSection
            description="Trends use the selected period type and separate contracted sales, collected sales, posted revenue, expenses, and net profit/loss."
            title="Visual analysis"
          >
            <div className="grid gap-5 xl:grid-cols-2">
              <TrendChartCard
                data={getPerformanceTrend(report)}
                description="Revenue, expenses, and net profit/loss by returned report bucket."
                emptyDescription="Posted revenue and expense voucher lines are required before this trend can render."
                emptyTitle="No posted accounting movement"
                format="currency"
                insight="Profit/loss is shown beside revenue and expenses so the period result is not inferred from color alone."
                series={[
                  { key: 'revenue', label: 'Revenue', tone: 'revenue' },
                  { key: 'expenses', label: 'Expenses', tone: 'expense' },
                  {
                    key: 'profitLoss',
                    label: 'Net profit/loss',
                    tone: 'balance',
                  },
                ]}
                title="Revenue, expense, and result trend"
              />
              <TrendChartCard
                data={getSalesCollectionsTrend(report)}
                description="Contracted sales and collected sales by returned report bucket."
                emptyDescription="Sale contracts or collection rows are required before this trend can render."
                emptyTitle="No sales or collection movement"
                format="currency"
                insight="Contracted sales and collections stay separated because they come from different CRM/property source dates."
                series={[
                  {
                    key: 'contractedSales',
                    label: 'Contracted sales',
                    tone: 'sales',
                  },
                  {
                    key: 'collectedSales',
                    label: 'Collected sales',
                    tone: 'revenue',
                  },
                ]}
                title="Contracted sales vs collections"
              />
            </div>
            <div className="max-w-3xl">
              <DistributionChartCard
                data={getActivityDistribution(report)}
                description="Counts returned by the business overview endpoint for the selected period."
                emptyDescription="Bookings, sale contracts, collections, or vouchers are required before the operating mix can render."
                emptyTitle="No operating counts"
                insight="Voucher, booking, contract, and collection counts remain visible as text."
                title="Activity count mix"
              />
            </div>
          </FinancialReportingSection>

          <FinancialReportingSection
            description="Bucket rows are returned by the backend report endpoint and preserve the same company/date grouping used by the charts."
            title="Detailed period table"
          >
            {report.buckets.length === 0 ? (
              <EmptyState
                description="The backend did not return any period buckets for the selected filters."
                title="No report buckets"
              />
            ) : (
              <BusinessReportBreakdownTable buckets={report.buckets} />
            )}
          </FinancialReportingSection>

          <FinancialReportingSection
            description="Calculation rules are included by the backend response so reviewers can trace what each metric means."
            title="Assumptions and calculation notes"
          >
            <div className="grid gap-3">
              {report.assumptions.map((assumption) => (
                <ReportAssumptionNote key={assumption}>
                  {assumption}
                </ReportAssumptionNote>
              ))}
            </div>
          </FinancialReportingSection>
        </>
      ) : null}
    </AppPage>
  );
};
