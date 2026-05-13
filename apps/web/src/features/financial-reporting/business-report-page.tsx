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
import {
  formatAccountingAmount,
  formatDateInputValue,
  formatDateTime,
} from '../../lib/format';
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
import {
  PrintableReportDataTable,
  PrintableReportFooter,
  PrintableReportHeader,
  PrintableReportLayout,
  PrintableReportNote,
  PrintableReportSection,
  PrintableReportSummaryTable,
} from './printable-report';

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
    printOrientation: 'portrait' | 'landscape';
  }
> = {
  overview: {
    title: 'Business Overview Report',
    description:
      'Company-scoped sales, collections, revenue, expenses, and profit/loss trends for management review.',
    reportSlug: 'business-overview',
    defaultBucket: 'month',
    printOrientation: 'landscape',
  },
  daily: {
    title: 'Daily Report',
    description:
      'Daily operational performance across sales contracts, collections, posted revenue, expenses, and voucher activity.',
    reportSlug: 'daily-report',
    defaultBucket: 'day',
    printOrientation: 'portrait',
  },
  weekly: {
    title: 'Weekly Report',
    description:
      'Weekly business movement across sales, collections, posted revenue, expenses, and voucher activity.',
    reportSlug: 'weekly-report',
    defaultBucket: 'week',
    printOrientation: 'portrait',
  },
  monthly: {
    title: 'Monthly Report',
    description:
      'Monthly trend reporting for contracted sales, collected sales, revenue, expenses, and net profit/loss.',
    reportSlug: 'monthly-report',
    defaultBucket: 'month',
    printOrientation: 'landscape',
  },
  yearly: {
    title: 'Yearly Report',
    description:
      'Yearly financial-performance reporting for contracted sales, collections, revenue, expenses, net profit/loss, and report activity counts.',
    reportSlug: 'yearly-report',
    defaultBucket: 'year',
    printOrientation: 'landscape',
  },
};

const getDefaultBusinessReportRange = (mode: BusinessReportMode) => {
  const today = new Date();

  if (mode === 'daily') {
    return {
      dateFrom: formatDateInputValue(
        new Date(today.getFullYear(), today.getMonth(), 1),
      ),
      dateTo: formatDateInputValue(today),
    };
  }

  if (mode === 'weekly') {
    const start = new Date(today);

    start.setDate(today.getDate() - 83);

    return {
      dateFrom: formatDateInputValue(start),
      dateTo: formatDateInputValue(today),
    };
  }

  if (mode === 'yearly') {
    const start = new Date(today.getFullYear() - 4, 0, 1);

    return {
      dateFrom: formatDateInputValue(start),
      dateTo: formatDateInputValue(today),
    };
  }

  return {
    dateFrom: formatDateInputValue(new Date(today.getFullYear(), 0, 1)),
    dateTo: formatDateInputValue(today),
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

const getBusinessReportGroupingLabel = (bucket: BusinessReportBucket) => {
  switch (bucket) {
    case 'year':
      return 'Yearly buckets';
    case 'month':
      return 'Monthly buckets';
    case 'week':
      return 'Weekly buckets';
    case 'day':
      return 'Daily buckets';
  }
};

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

const BusinessPrintableReport = ({
  config,
  generatedAt,
  generatedBy,
  report,
  userCompanyName,
  userCompanySlug,
}: {
  config: (typeof MODE_CONFIG)[BusinessReportMode];
  generatedAt: string;
  generatedBy: string;
  report: BusinessOverviewReportResponseRecord;
  userCompanyName: string;
  userCompanySlug: string;
}) => {
  const periodLabel = formatReportDateRangeLabel(
    report.dateFrom,
    report.dateTo,
  );
  const groupingLabel = getBusinessReportGroupingLabel(report.bucket);
  const hasData = hasBusinessReportData(report);
  const isDemoUatCompany = userCompanySlug === 'real-capita-demo-uat';

  return (
    <PrintableReportLayout
      orientation={config.printOrientation}
      testId={`printable-report-${config.reportSlug}`}
    >
      <PrintableReportHeader
        activeCompany={userCompanyName}
        additionalMetaItems={[
          {
            label: 'Grouping type',
            value: groupingLabel,
          },
        ]}
        companyName={userCompanyName}
        dataSourceNote="CRM/property records and posted accounting vouchers for the selected reporting period."
        generatedAt={generatedAt}
        generatedBy={generatedBy}
        outputLabel={`Browser print / A4 ${config.printOrientation}`}
        periodLabel={periodLabel}
        subtitle="Company-scoped sales, collection, posted revenue, expense, profit/loss, and activity-count summary for finance review."
        title={config.title}
      />

      <PrintableReportSection
        subtitle="Headline values for the selected company and reporting period."
        title="Executive Summary"
      >
        <PrintableReportSummaryTable
          rows={[
            {
              label: 'Contracted sales',
              value: formatAccountingAmount(
                report.totals.contractedSalesAmount,
              ),
              note: 'Sale contract amount by contract date',
            },
            {
              label: 'Collected sales',
              value: formatAccountingAmount(report.totals.collectedSalesAmount),
              note: 'Collection amount by collection date',
            },
            {
              label: 'Revenue',
              value: formatAccountingAmount(report.totals.revenueAmount),
              note: 'Posted voucher revenue movement',
            },
            {
              label: 'Expenses',
              value: formatAccountingAmount(report.totals.expenseAmount),
              note: 'Posted voucher expense movement',
            },
            {
              label: 'Net profit/loss',
              value: formatAccountingAmount(report.totals.netProfitLossAmount),
              note: 'Revenue less expenses from posted voucher data',
            },
            {
              label: 'Voucher workload',
              value: formatCount(report.totals.voucherCount),
              note: `${formatCount(report.totals.postedVoucherCount)} posted / ${formatCount(report.totals.draftVoucherCount)} draft`,
            },
            {
              label: 'Bookings',
              value: formatCount(report.totals.bookingCount),
              note: 'Booking count returned for the selected period',
            },
            {
              label: 'Sale contracts',
              value: formatCount(report.totals.saleContractCount),
              note: 'Sale contract count for the selected period',
            },
            {
              label: 'Collections',
              value: formatCount(report.totals.collectionCount),
              note: 'Collection count returned for the selected period',
            },
          ]}
        />
      </PrintableReportSection>

      <PrintableReportSection
        subtitle={`Period grouping: ${groupingLabel}.`}
        title="Period Breakdown"
      >
        <PrintableReportDataTable
          caption="Amounts use the same filters as the screen report."
          columns={[
            {
              key: 'period',
              header: 'Period',
              render: (bucket) => (
                <div>
                  <strong>{bucket.bucketLabel}</strong>
                  <br />
                  <span>
                    {bucket.bucketStart} to {bucket.bucketEnd}
                  </span>
                </div>
              ),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'contractedSales',
              header: 'Contracted sales',
              render: (bucket) =>
                formatAccountingAmount(bucket.contractedSalesAmount),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'collectedSales',
              header: 'Collected sales',
              render: (bucket) =>
                formatAccountingAmount(bucket.collectedSalesAmount),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'revenue',
              header: 'Revenue',
              render: (bucket) => formatAccountingAmount(bucket.revenueAmount),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'expenses',
              header: 'Expenses',
              render: (bucket) => formatAccountingAmount(bucket.expenseAmount),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'netProfitLoss',
              header: 'Net profit/loss',
              render: (bucket) =>
                formatAccountingAmount(bucket.netProfitLossAmount),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'vouchers',
              header: 'Vouchers',
              render: (bucket) => formatCount(bucket.voucherCount),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'bookings',
              header: 'Bookings',
              render: (bucket) => formatCount(bucket.bookingCount),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'contracts',
              header: 'Sale contracts',
              render: (bucket) => formatCount(bucket.saleContractCount),
            },
            {
              align: 'right',
              className: 'font-mono',
              key: 'collections',
              header: 'Collections',
              render: (bucket) => formatCount(bucket.collectionCount),
            },
          ]}
          emptyLabel="No reportable activity matched this company/date range."
          getRowKey={(bucket) => bucket.bucketKey}
          rows={report.buckets}
        />
      </PrintableReportSection>

      <PrintableReportSection
        subtitle="Calculation notes are included for review traceability."
        title="Notes"
      >
        {!hasData ? (
          <PrintableReportNote>
            No reportable activity matched this company/date range. Zero values
            are shown for the selected filters.
          </PrintableReportNote>
        ) : null}
        {report.assumptions.map((assumption) => (
          <PrintableReportNote key={assumption}>
            {assumption}
          </PrintableReportNote>
        ))}
        {isDemoUatCompany ? (
          <PrintableReportNote>
            The active company is a controlled Demo/UAT workspace. Treat these
            values as synthetic walkthrough data, not production evidence.
          </PrintableReportNote>
        ) : null}
        <PrintableReportNote>
          This printable template intentionally omits screen charts, dashboard
          cards, filters, and navigation chrome. Use browser print settings if
          page numbering is required.
        </PrintableReportNote>
      </PrintableReportSection>

      <PrintableReportFooter
        generatedAt={generatedAt}
        note="Confidential - internal use only. Browser-generated printable report."
        systemName={`Real Capita ERP - ${config.title}`}
      />
    </PrintableReportLayout>
  );
};

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
  const generatedAt = report
    ? formatDateTime(
        new Date(reportQuery.dataUpdatedAt || Date.now()).toISOString(),
      )
    : null;

  return (
    <AppPage>
      <div
        className="printable-report-screen-content space-y-5 xl:space-y-6"
        data-testid="printable-report-screen-content"
      >
        <FinancialReportingPageHeader
          actions={
            report ? (
              <OutputActionGroup
                isExporting={isExporting}
                onExport={() => void handleExport()}
                onPrint={printCurrentPage}
                printLabel="Print Report"
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
              description="Finance-grade headline values for the selected company, period, and grouping."
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
                    value: getBusinessReportGroupingLabel(report.bucket),
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
                      {formatAccountingAmount(
                        report.totals.collectedSalesAmount,
                      )}
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
                      {formatAccountingAmount(
                        report.totals.netProfitLossAmount,
                      )}
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
                  description="No reportable activity matched this company and date range."
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
                  description="Revenue, expenses, and net profit/loss by selected period."
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
                  description="Contracted sales and collected sales by selected period."
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
                      tone: 'collection',
                    },
                  ]}
                  title="Contracted sales vs collections"
                />
              </div>
              <div className="max-w-3xl">
                <DistributionChartCard
                  data={getActivityDistribution(report)}
                  description="Summary counts reflect the selected reporting period."
                  emptyDescription="Bookings, sale contracts, collections, or vouchers are required before the operating mix can render."
                  emptyTitle="No operating counts"
                  insight="Voucher, booking, contract, and collection counts remain visible as text."
                  title="Activity count mix"
                />
              </div>
            </FinancialReportingSection>

            <FinancialReportingSection
              description="Period rows preserve the same company and date grouping used by the charts."
              title="Detailed period table"
            >
              {report.buckets.length === 0 ? (
                <EmptyState
                  description="No period buckets matched the selected filters."
                  title="No report buckets"
                />
              ) : (
                <BusinessReportBreakdownTable buckets={report.buckets} />
              )}
            </FinancialReportingSection>

            <FinancialReportingSection
              description="Calculation rules help reviewers trace what each metric means."
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
      </div>

      {report && generatedAt ? (
        <BusinessPrintableReport
          config={config}
          generatedAt={generatedAt}
          generatedBy={user.email}
          report={report}
          userCompanyName={user.currentCompany.name}
          userCompanySlug={user.currentCompany.slug}
        />
      ) : null}
    </AppPage>
  );
};
