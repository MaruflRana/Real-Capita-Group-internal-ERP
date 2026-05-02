'use client';

import {
  AnalyticsGrid,
  ComparisonBarChartCard,
  MiniReportTableCard,
  TrendChartCard,
} from '../analytics/components';
import type {
  AnalyticsDataPoint,
  AnalyticsTrendPoint,
} from '../../lib/api/analytics';
import type {
  BalanceSheetResponseRecord,
  GeneralLedgerResponseRecord,
  ProfitAndLossResponseRecord,
  TrialBalanceResponseRecord,
} from '../../lib/api/types';

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const amount = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(amount) ? amount : 0;
};

const debitCreditPoint = (
  key: string,
  label: string,
  debit: number | string,
  credit: number | string,
): AnalyticsTrendPoint => ({
  key,
  label,
  values: {
    debit: toNumber(debit),
    credit: toNumber(credit),
  },
});

export const TrialBalanceVisualSummary = ({
  report,
}: {
  report: TrialBalanceResponseRecord;
}) => {
  const closingComparison: AnalyticsDataPoint[] = [
    {
      key: 'closing-debit',
      label: 'Closing debit',
      value: toNumber(report.totals.closingDebit),
    },
    {
      key: 'closing-credit',
      label: 'Closing credit',
      value: toNumber(report.totals.closingCredit),
    },
  ];

  return (
    <AnalyticsGrid>
      <ComparisonBarChartCard
        data={closingComparison}
        description="Debit and credit totals come directly from the trial balance response."
        emptyDescription="Closing debit and credit totals are zero for the selected filters."
        emptyTitle="No closing balance movement"
        format="currency"
        insight="Closing debit and closing credit remain visible as paired finance values."
        title="Trial balance comparison"
      />
      <TrendChartCard
        data={[
          debitCreditPoint(
            'opening',
            'Opening',
            report.totals.openingDebit,
            report.totals.openingCredit,
          ),
          debitCreditPoint(
            'movement',
            'Movement',
            report.totals.movementDebit,
            report.totals.movementCredit,
          ),
          debitCreditPoint(
            'closing',
            'Closing',
            report.totals.closingDebit,
            report.totals.closingCredit,
          ),
        ]}
        description="Opening, period movement, and closing totals visualized without changing backend calculations."
        emptyDescription="Movement bars need non-zero report totals."
        emptyTitle="No debit/credit movement"
        format="currency"
        insight="Debit and credit movement uses the same backend totals as the statement table."
        series={[
          { key: 'debit', label: 'Debit', tone: 'balance' },
          { key: 'credit', label: 'Credit', tone: 'neutral' },
        ]}
        title="Debit / credit movement"
      />
    </AnalyticsGrid>
  );
};

export const GeneralLedgerVisualSummary = ({
  report,
}: {
  report: GeneralLedgerResponseRecord;
}) => {
  const lineBucket = new Map<string, AnalyticsTrendPoint>();

  report.lines.forEach((line) => {
    const key = line.voucherDate;
    const existing = lineBucket.get(key) ?? {
      key,
      label: key,
      values: {},
    };

    existing.values.debit = (existing.values.debit ?? 0) + toNumber(line.debit);
    existing.values.credit =
      (existing.values.credit ?? 0) + toNumber(line.credit);
    lineBucket.set(key, existing);
  });

  const trend = [...lineBucket.values()].sort((left, right) =>
    left.key.localeCompare(right.key),
  );

  return (
    <AnalyticsGrid>
      <TrendChartCard
        data={[
          debitCreditPoint(
            'opening',
            'Opening',
            report.openingBalance.debit,
            report.openingBalance.credit,
          ),
          debitCreditPoint(
            'period',
            'Period',
            report.totals.debit,
            report.totals.credit,
          ),
          debitCreditPoint(
            'closing',
            'Closing',
            report.totals.closingDebit,
            report.totals.closingCredit,
          ),
        ]}
        description="Opening, period, and closing balances from the backend general-ledger response."
        emptyDescription="Ledger movement bars need non-zero debit or credit totals."
        emptyTitle="No ledger movement"
        format="currency"
        insight="Ledger movement compares debit and credit across opening, period, and closing positions."
        series={[
          { key: 'debit', label: 'Debit', tone: 'balance' },
          { key: 'credit', label: 'Credit', tone: 'neutral' },
        ]}
        title="Ledger movement"
      />
      <TrendChartCard
        data={trend}
        description="Daily posted voucher-line movement for the selected posting account."
        emptyDescription="Ledger line activity appears after posted voucher lines match the selected filters."
        emptyTitle="No ledger lines"
        format="currency"
        insight="Line activity groups the selected ledger's posted debit and credit movement by voucher date."
        series={[
          { key: 'debit', label: 'Debit', tone: 'balance' },
          { key: 'credit', label: 'Credit', tone: 'neutral' },
        ]}
        title="Line activity"
      />
    </AnalyticsGrid>
  );
};

export const ProfitAndLossVisualSummary = ({
  report,
}: {
  report: ProfitAndLossResponseRecord;
}) => {
  const netProfitLoss = toNumber(report.totals.netProfitLoss);

  return (
    <AnalyticsGrid>
      <ComparisonBarChartCard
        data={[
          {
            key: 'revenue',
            label: 'Revenue',
            value: toNumber(report.totals.totalRevenue),
          },
          {
            key: 'expense',
            label: 'Expense',
            value: toNumber(report.totals.totalExpense),
          },
        ]}
        description="Revenue and expense totals are rendered from the existing profit and loss API."
        emptyDescription="Revenue and expense bars need posted activity in the selected period."
        emptyTitle="No P&L movement"
        format="currency"
        insight="Revenue and expense are compared without changing the backend statement totals."
        title="Revenue vs expense"
      />
      <MiniReportTableCard
        description="Net result and top-level statement section totals from the backend response."
        format="currency"
        insight="Section totals stay available as text for reviewers who cannot rely on color."
        rows={[
          {
            key: 'net-profit-loss',
            label: netProfitLoss >= 0 ? 'Net profit' : 'Net loss',
            tone: netProfitLoss >= 0 ? 'revenue' : 'expense',
            value: Math.abs(netProfitLoss),
          },
          ...report.sections.map((section) => ({
            key: section.accountClassCode,
            label: section.accountClassName,
            value: toNumber(section.amount),
          })),
        ]}
        title="Statement status"
      />
    </AnalyticsGrid>
  );
};

export const BalanceSheetVisualSummary = ({
  report,
}: {
  report: BalanceSheetResponseRecord;
}) => (
  <AnalyticsGrid>
    <ComparisonBarChartCard
      data={[
        {
          key: 'assets',
          label: 'Assets',
          value: toNumber(report.totals.totalAssets),
        },
        {
          key: 'liabilities-equity',
          label: 'Liabilities + equity',
          value: toNumber(report.totals.totalLiabilitiesAndEquity),
        },
      ]}
      description="Assets and liabilities plus equity are compared from the backend balance sheet totals."
      emptyDescription="Balance bars need non-zero balance sheet totals."
      emptyTitle="No balance totals"
      format="currency"
      insight="Assets and liabilities plus equity use the same backend balance comparison."
      title="Balance sheet comparison"
    />
    <MiniReportTableCard
      description="Equity status keeps the backend's derived unclosed earnings adjustment visible without changing the statement calculation."
      format="currency"
      insight="The derived unclosed earnings adjustment remains readable as a named statement row."
      rows={[
        {
          key: 'liabilities',
          label: 'Liabilities',
          value: toNumber(report.totals.totalLiabilities),
        },
        {
          key: 'equity',
          label: 'Equity',
          value: toNumber(report.totals.totalEquity),
        },
        {
          key: 'UNCLOSED_EARNINGS',
          label: 'Unclosed earnings adjustment',
          tone: 'balance',
          value: toNumber(report.totals.unclosedEarnings),
        },
      ]}
      title="Equity adjustments"
    />
  </AnalyticsGrid>
);
