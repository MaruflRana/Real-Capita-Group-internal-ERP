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
  BusinessOverviewReportAmountsRecord,
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
import { ExecutiveTrendChartCard } from '../analytics/components';
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
  FinancialReportingSection,
  ReportAssumptionNote,
  ReportLoadingState,
  ReportMetricCard,
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
    title: 'Business Performance Overview',
    description:
      'Management-facing financial performance summary for the selected reporting period — combining key result signals, collection progress, and period evidence below.',
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

const formatPercent = (value: number, base: number): string => {
  if (base === 0) return '0%';
  const pct = (value / base) * 100;
  return `${Math.round(pct)}%`;
};

const getCollectionEfficiencyPercent = (collected: number, contracted: number): number => {
  if (contracted === 0) return 1;
  return collected / contracted;
};

const getOutstandingReceivables = (contracted: number, collected: number): number => {
  const outstanding = contracted - collected;
  return outstanding < 0 ? 0 : outstanding;
};

const CollectionProgressCue = ({
  collected,
  contracted,
}: {
  collected: number;
  contracted: number;
}) => {
  if (contracted === 0) return null;
  const pct = Math.min(collected / contracted, 1);
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-border overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          pct >= 0.5 ? 'bg-status-success' : 'bg-status-warning'
        }`}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
};

const getExecutiveInsight = (report: BusinessOverviewReportResponseRecord): string => {
  const totals = report.totals;
  const netResult = toNumber(totals.netProfitLossAmount);
  const revenue = toNumber(totals.revenueAmount);
  const expenses = toNumber(totals.expenseAmount);
  const contracted = toNumber(totals.contractedSalesAmount);
  const collected = toNumber(totals.collectedSalesAmount);
  const periodLabel = formatReportDateRangeLabel(report.dateFrom, report.dateTo);

  const resultPhrase = netResult >= 0
    ? `a profit of ${formatAccountingAmount(totals.profitAmount)}`
    : `a loss of ${formatAccountingAmount(totals.lossAmount)}`;

  const expenseRatio = revenue > 0 ? formatPercent(expenses, revenue) : 'N/A';
  const collectionPct = contracted > 0 ? formatPercent(collected, contracted) : 'N/A';

  return `The business recorded ${resultPhrase} over ${periodLabel}, with an expense ratio of ${expenseRatio} and ${collectionPct} of contracted sales collected.`;
};



const AmountCell = ({ value }: { value: string }) => (
  <span className="whitespace-nowrap font-mono tabular-nums">
    {formatAccountingAmount(value)}
  </span>
);

const BusinessReportBreakdownTable = ({
  buckets,
  totals,
}: {
  buckets: BusinessOverviewReportBucketRecord[];
  totals: BusinessOverviewReportAmountsRecord;
}) => {
  const sumNetPL = toNumber(totals.netProfitLossAmount);

  return (
    <Table className="min-w-[1160px]">
      <TableHeader>
        <TableRow>
          <TableHead className="normal-case tracking-normal">Period</TableHead>
          <TableHead className="normal-case tracking-normal">Revenue</TableHead>
          <TableHead className="normal-case tracking-normal">Expenses</TableHead>
          <TableHead className="normal-case tracking-normal">Net P/L</TableHead>
          <TableHead className="normal-case tracking-normal">
            Contracted sales
          </TableHead>
          <TableHead className="normal-case tracking-normal">
            Collected sales
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
        {buckets.map((bucket) => {
          const bucketNetPL = toNumber(bucket.netProfitLossAmount);
          const isLossPeriod = bucketNetPL < 0;

          return (
            <TableRow
              key={bucket.bucketKey}
              className={isLossPeriod ? 'bg-rose-50/40' : undefined}
            >
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
                <AmountCell value={bucket.revenueAmount} />
              </TableCell>
              <TableCell>
                <AmountCell value={bucket.expenseAmount} />
              </TableCell>
              <TableCell>
                <span className={`whitespace-nowrap font-mono tabular-nums ${
                  isLossPeriod ? 'text-rose-700 font-semibold' : ''
                }`}>
                  {isLossPeriod ? (
                    <>
                      <span className="mr-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-rose-100/80 text-rose-700">
                        Loss
                      </span>
                      {formatAccountingAmount(bucket.netProfitLossAmount)}
                    </>
                  ) : (
                    formatAccountingAmount(bucket.netProfitLossAmount)
                  )}
                </span>
              </TableCell>
              <TableCell>
                <AmountCell value={bucket.contractedSalesAmount} />
              </TableCell>
              <TableCell>
                <AmountCell value={bucket.collectedSalesAmount} />
              </TableCell>
              <TableCell>{formatCount(bucket.voucherCount)}</TableCell>
              <TableCell>{formatCount(bucket.bookingCount)}</TableCell>
              <TableCell>{formatCount(bucket.saleContractCount)}</TableCell>
              <TableCell>{formatCount(bucket.collectionCount)}</TableCell>
            </TableRow>
          );
        })}
        {/* Totals row */}
        <TableRow className="border-t-2 border-brand-sky/40 bg-brand-skySoft/30 font-semibold">
          <TableCell>
            <div className="min-w-36">
              <p className="font-bold text-foreground">Total</p>
            </div>
          </TableCell>
          <TableCell>
            <span className="whitespace-nowrap font-mono tabular-nums font-semibold">
              {formatAccountingAmount(totals.revenueAmount)}
            </span>
          </TableCell>
          <TableCell>
            <span className="whitespace-nowrap font-mono tabular-nums font-semibold">
              {formatAccountingAmount(totals.expenseAmount)}
            </span>
          </TableCell>
          <TableCell>
            <span className={`whitespace-nowrap font-mono tabular-nums font-semibold ${
              sumNetPL < 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              {formatAccountingAmount(totals.netProfitLossAmount)}
            </span>
          </TableCell>
          <TableCell>
            <span className="whitespace-nowrap font-mono tabular-nums font-semibold">
              {formatAccountingAmount(totals.contractedSalesAmount)}
            </span>
          </TableCell>
          <TableCell>
            <span className="whitespace-nowrap font-mono tabular-nums font-semibold">
              {formatAccountingAmount(totals.collectedSalesAmount)}
            </span>
          </TableCell>
          <TableCell className="font-semibold">{formatCount(totals.voucherCount)}</TableCell>
          <TableCell className="font-semibold">{formatCount(totals.bookingCount)}</TableCell>
          <TableCell className="font-semibold">{formatCount(totals.saleContractCount)}</TableCell>
          <TableCell className="font-semibold">{formatCount(totals.collectionCount)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

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
  const netProfitLoss = toNumber(report.totals.netProfitLossAmount);

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
        subtitle="Company-scoped sales, collection, posted revenue, expense, profit/loss, and activity-count summary."
        title={config.title}
      />

      <PrintableReportSection
        subtitle="Headline values for the selected company and reporting period."
        title="Executive Summary"
      >
        <PrintableReportSummaryTable
          rows={[
            {
              label: 'Business result',
              value: netProfitLoss >= 0
                ? formatAccountingAmount(report.totals.profitAmount)
                : formatAccountingAmount(report.totals.lossAmount),
              note: netProfitLoss >= 0
                ? 'Profit — revenue less expenses from posted vouchers'
                : 'Loss — revenue less expenses from posted vouchers',
            },
            {
              label: 'Revenue',
              value: formatAccountingAmount(report.totals.revenueAmount),
              note: 'Posted voucher revenue movement',
            },
            {
              label: 'Expenses',
              value: formatAccountingAmount(report.totals.expenseAmount),
              note: `Expense ratio: ${formatPercent(toNumber(report.totals.expenseAmount), toNumber(report.totals.revenueAmount))}`,
            },
            {
              label: 'Collection efficiency',
              value: formatPercent(toNumber(report.totals.collectedSalesAmount), toNumber(report.totals.contractedSalesAmount)),
              note: `${formatAccountingAmount(report.totals.collectedSalesAmount)} collected of ${formatAccountingAmount(report.totals.contractedSalesAmount)} contracted`,
            },
            {
              label: 'Contracted sales',
              value: formatAccountingAmount(
                report.totals.contractedSalesAmount,
              ),
              note: 'Sale contract amount by contract date',
            },
            {
              label: 'Outstanding receivables',
              value: formatAccountingAmount(getOutstandingReceivables(
                toNumber(report.totals.contractedSalesAmount),
                toNumber(report.totals.collectedSalesAmount),
              )),
              note: 'Contracted sales minus collected sales',
            },
            {
              label: 'Voucher activity',
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
              header: 'Net P/L',
              render: (bucket) =>
                formatAccountingAmount(bucket.netProfitLossAmount),
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
        subtitle="Calculation notes for review traceability."
        title="Notes"
      >
        <PrintableReportNote>
          Net result is revenue minus expenses from posted accounting vouchers. Contracted sales and collections come from CRM/property records by contract and collection date respectively. Expense ratio is expenses divided by revenue; collection efficiency is collected sales divided by contracted sales. Outstanding receivables equals contracted sales minus collected sales.
        </PrintableReportNote>
        {!hasData ? (
          <PrintableReportNote>
            No reportable activity matched this company/date range. Zero values
            are shown for the selected filters.
          </PrintableReportNote>
        ) : null}
        <PrintableReportNote>
          Detailed basis:
        </PrintableReportNote>
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
              description="Headline financial result, key drivers, and collection progress for the selected reporting period."
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
                    label: 'Result',
                    tone: netProfitLoss >= 0 ? 'success' : 'warning',
                    value: netProfitLoss >= 0 ? 'Profit' : 'Loss',
                  },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Sources: posted vouchers and CRM/property records.
              </p>
              <div className="space-y-4">
                {/* Primary result card */}
                <div
                  className={`rounded-xl border-2 p-5 shadow-sm ${
                    netProfitLoss >= 0
                      ? 'border-emerald-300/70 bg-gradient-to-br from-emerald-50/40 to-brand-skySoft/30'
                      : 'border-rose-300/70 bg-gradient-to-br from-rose-50/40 to-brand-skySoft/30'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Business result
                  </p>
                  <p className={`mt-3 text-2xl font-bold tabular-nums ${
                    netProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    <span className="font-mono">
                      {netProfitLoss >= 0
                        ? formatAccountingAmount(report.totals.profitAmount)
                        : formatAccountingAmount(report.totals.lossAmount)}
                    </span>
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      netProfitLoss >= 0
                        ? 'bg-emerald-100/80 text-emerald-700'
                        : 'bg-rose-100/80 text-rose-700'
                    }`}>
                      {netProfitLoss >= 0 ? 'Profit' : 'Loss'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Revenue minus expenses from posted vouchers
                    </span>
                  </div>
                </div>

                {/* Secondary management metrics */}
                <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
                  <ReportMetricCard
                    label="Revenue"
                    tone="success"
                    value={
                      <span className="font-mono tabular-nums">
                        {formatAccountingAmount(report.totals.revenueAmount)}
                      </span>
                    }
                    description="Posted voucher revenue for the selected period"
                  />
                  <ReportMetricCard
                    label="Expenses"
                    tone={toNumber(report.totals.expenseAmount) / toNumber(report.totals.revenueAmount) > 0.5 ? 'warning' : 'default'}
                    value={
                      <span className="font-mono tabular-nums">
                        {formatAccountingAmount(report.totals.expenseAmount)}
                      </span>
                    }
                    description={`Expense ratio: ${formatPercent(toNumber(report.totals.expenseAmount), toNumber(report.totals.revenueAmount))}`}
                  />
                  <ReportMetricCard
                    label="Collection efficiency"
                    tone={getCollectionEfficiencyPercent(toNumber(report.totals.collectedSalesAmount), toNumber(report.totals.contractedSalesAmount)) < 0.5 ? 'warning' : 'success'}
                    value={
                      <span className="font-mono tabular-nums">
                        {formatPercent(toNumber(report.totals.collectedSalesAmount), toNumber(report.totals.contractedSalesAmount))}
                      </span>
                    }
                    description={
                      <>
                        {formatAccountingAmount(report.totals.collectedSalesAmount)} collected of {formatAccountingAmount(report.totals.contractedSalesAmount)} contracted
                        <CollectionProgressCue
                          collected={toNumber(report.totals.collectedSalesAmount)}
                          contracted={toNumber(report.totals.contractedSalesAmount)}
                        />
                      </>
                    }
                  />
                </div>

                {/* Supporting detail metrics */}
                <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
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
                    label="Outstanding receivables"
                    tone={getOutstandingReceivables(toNumber(report.totals.contractedSalesAmount), toNumber(report.totals.collectedSalesAmount)) > 0 ? 'warning' : 'default'}
                    value={
                      <span className="font-mono tabular-nums">
                        {formatAccountingAmount(getOutstandingReceivables(
                          toNumber(report.totals.contractedSalesAmount),
                          toNumber(report.totals.collectedSalesAmount),
                        ))}
                      </span>
                    }
                    description="Contracted sales minus collected sales"
                  />
                  <ReportMetricCard
                    label="Voucher activity"
                    value={formatCount(report.totals.voucherCount)}
                    description={`${formatCount(report.totals.postedVoucherCount)} posted / ${formatCount(report.totals.draftVoucherCount)} draft`}
                  />
                  <ReportMetricCard
                    label="Periods reported"
                    value={String(report.buckets.length)}
                    description={getBusinessReportGroupingLabel(report.bucket)}
                  />
                </div>
              </div>

              {!hasData ? (
                <EmptyState
                  description="No reportable activity matched this company and date range."
                  title="No business report activity"
                />
              ) : null}
            </FinancialReportingSection>

            <div className="screen-only rounded-lg border border-brand-sky/40 bg-brand-skySoft/60 px-4 py-3">
              <p className="text-sm font-medium leading-6 text-foreground">
                {getExecutiveInsight(report)}
              </p>
            </div>

            <FinancialReportingSection
              description="Revenue, expenses, and net result over the selected reporting period — how financial performance moved across each bucket."
              title="Performance trend"
            >
              <ExecutiveTrendChartCard
                data={getPerformanceTrend(report)}
                description="Revenue and expenses from posted vouchers per period; the net result line shows whether each period was profitable."
                emptyDescription="Posted voucher lines are required before this trend can render."
                emptyTitle="No reportable financial movement"
                format="currency"
                insight="Revenue bars and expense bars show financial magnitude per period; the net result line reveals whether the business was profitable in each period — above zero is profit, below zero is loss."
                series={[
                  { key: 'revenue', label: 'Revenue', tone: 'revenue', type: 'bar' },
                  { key: 'expenses', label: 'Expenses', tone: 'expense', type: 'bar' },
                  {
                    key: 'profitLoss',
                    label: 'Net result',
                    tone: 'balance',
                    type: 'line',
                  },
                ]}
                title="Financial performance trend"
              />
            </FinancialReportingSection>

            <FinancialReportingSection
              description="Detailed period-by-period figures that support the executive summary and trend charts above."
              title="Period breakdown"
            >
              {report.buckets.length === 0 ? (
                <EmptyState
                  description="No period buckets matched the selected filters."
                  title="No report buckets"
                />
              ) : (
                <BusinessReportBreakdownTable buckets={report.buckets} totals={report.totals} />
              )}
            </FinancialReportingSection>

            <FinancialReportingSection
              description="How each figure is derived and what data sources apply."
              title="Calculation notes"
            >
              <p className="text-sm leading-6 text-muted-foreground">
                Net result is revenue minus expenses from posted accounting vouchers. Contracted sales and collections come from CRM/property records by contract and collection date respectively. Expense ratio is expenses divided by revenue; collection efficiency is collected sales divided by contracted sales. Outstanding receivables equals contracted sales minus collected sales.
              </p>
              <details className="mt-3 group">
                <summary className="cursor-pointer text-sm font-medium text-brand-sky hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky/50">
                  Show detailed calculation basis
                </summary>
                <div className="mt-3 grid gap-3">
                  {report.assumptions.map((assumption) => (
                    <ReportAssumptionNote key={assumption}>
                      {assumption}
                    </ReportAssumptionNote>
                  ))}
                </div>
              </details>
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
