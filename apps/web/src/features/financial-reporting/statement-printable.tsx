'use client';

import type {
  BalanceSheetDerivedLineRecord,
  BalanceSheetResponseRecord,
  FinancialStatementSectionRecord,
  GeneralLedgerLineRecord,
  GeneralLedgerResponseRecord,
  TrialBalanceAmountsRecord,
  TrialBalanceResponseRecord,
} from '../../lib/api/types';
import { formatAccountingAmount, formatDate } from '../../lib/format';
import {
  PrintableReportDataTable,
  PrintableReportFooter,
  PrintableReportHeader,
  PrintableReportLayout,
  PrintableReportNote,
  PrintableReportSection,
  PrintableReportSummaryTable,
} from './printable-report';
import {
  formatReportDateRangeLabel,
  formatRunningBalance,
  formatVoucherTypeLabel,
  getStatementSectionCountLabel,
} from './utils';

const SOURCE_OF_TRUTH_NOTE =
  'Existing read-only financial reporting REST response generated from posted vouchers. This print view does not add accounting calculations, backend logic, or browser-side statement adjustments.';

const STATEMENT_PRINT_NOTE =
  'This printable template intentionally omits screen charts, dashboard cards, filters, and navigation chrome. CSV remains the only structured export format; browser print remains the Phase 1 print/PDF-from-browser path.';

const formatAmount = (value: number | string | null | undefined) =>
  formatAccountingAmount(value);

const formatAbsAmount = (value: number | string | null | undefined) =>
  formatAccountingAmount(Math.abs(Number(value ?? 0)));

const isMaterialAmount = (value: number | string | null | undefined) =>
  Math.abs(Number(value ?? 0)) >= 0.005;

const getClosingDifference = (report: TrialBalanceResponseRecord) =>
  Math.abs(
    Number(report.totals.closingDebit) - Number(report.totals.closingCredit),
  );

const getBalanceSheetAdjustmentName = ({
  code,
  name,
}: {
  code: string;
  name: string;
}) => (code === 'UNCLOSED_EARNINGS' ? 'Unclosed earnings adjustment' : name);

const PrintableStatusMessage = ({
  message,
  title = 'Report Status',
}: {
  message: string;
  title?: string;
}) => (
  <PrintableReportSection
    subtitle="Print output is available after the report is ready."
    title={title}
  >
    <PrintableReportNote>{message}</PrintableReportNote>
  </PrintableReportSection>
);

type TrialBalancePrintableRow = TrialBalanceAmountsRecord & {
  accountCode: string;
  accountName: string;
  key: string;
  level: 0 | 1 | 2 | 3;
  rowType: string;
};

const buildTrialBalanceRows = (report: TrialBalanceResponseRecord) => {
  const rows: TrialBalancePrintableRow[] = [];

  for (const section of report.sections) {
    rows.push({
      ...section,
      accountCode: section.accountClassCode,
      accountName: section.accountClassName,
      key: `class-${section.accountClassId}`,
      level: 0,
      rowType: 'Account class',
    });

    for (const group of section.accountGroups) {
      rows.push({
        ...group,
        accountCode: group.accountGroupCode,
        accountName: group.accountGroupName,
        key: `group-${group.accountGroupId}`,
        level: 1,
        rowType: 'Account group',
      });

      for (const ledger of group.ledgerAccounts) {
        rows.push({
          ...ledger,
          accountCode: ledger.ledgerAccountCode,
          accountName: ledger.ledgerAccountName,
          key: `ledger-${ledger.ledgerAccountId}`,
          level: 2,
          rowType: 'Ledger account',
        });

        for (const postingAccount of ledger.postingAccounts) {
          rows.push({
            ...postingAccount,
            accountCode: postingAccount.particularAccountCode,
            accountName: postingAccount.particularAccountName,
            key: `posting-${postingAccount.particularAccountId}`,
            level: 3,
            rowType: 'Posting account',
          });
        }
      }
    }
  }

  rows.push({
    ...report.totals,
    accountCode: 'TOTAL',
    accountName: 'Report totals',
    key: 'report-total',
    level: 0,
    rowType: 'Report total',
  });

  return rows;
};

const PrintableAccountCell = ({
  code,
  level,
  name,
}: {
  code: string;
  level: 0 | 1 | 2 | 3;
  name: string;
}) => (
  <div
    className={`printable-statement-account printable-statement-level-${level}`}
  >
    <strong>{name}</strong>
    <span>{code}</span>
  </div>
);

const PrintableTextValue = ({ value }: { value: string }) => (
  <span className="printable-report-summary-text">{value}</span>
);

export const TrialBalancePrintableReport = ({
  generatedAt,
  generatedBy,
  report,
  statusMessage,
  userCompanyName,
}: {
  generatedAt: string;
  generatedBy: string;
  report: TrialBalanceResponseRecord | null;
  statusMessage: string;
  userCompanyName: string;
}) => {
  const closingDifference = report ? getClosingDifference(report) : 0;
  const isBalanced = closingDifference < 0.005;

  return (
    <PrintableReportLayout
      orientation="landscape"
      testId="printable-report-trial-balance"
    >
      <PrintableReportHeader
        activeCompany={userCompanyName}
        additionalMetaItems={[
          {
            label: 'Voucher scope',
            value: report?.voucherType ?? 'All posted voucher types',
          },
          {
            label: 'Balance status',
            value: report
              ? isBalanced
                ? 'Balanced'
                : 'Out of balance'
              : 'Pending report data',
          },
          {
            label: 'Closing difference',
            value: report ? formatAmount(closingDifference) : 'N/A',
          },
        ]}
        companyName={userCompanyName}
        dataSourceNote={SOURCE_OF_TRUTH_NOTE}
        generatedAt={generatedAt}
        generatedBy={generatedBy}
        outputLabel="Browser print / A4 landscape"
        periodLabel={
          report
            ? formatReportDateRangeLabel(report.dateFrom, report.dateTo)
            : 'Report filters pending'
        }
        subtitle="Opening, movement, and closing debit/credit balances by account hierarchy."
        title="Trial Balance"
      />

      {report ? (
        <>
          <PrintableReportSection
            subtitle="Debit and credit control totals returned by the reporting API."
            title="Debit/Credit Summary"
          >
            <PrintableReportSummaryTable
              rows={[
                {
                  label: 'Opening debit',
                  value: formatAmount(report.totals.openingDebit),
                },
                {
                  label: 'Opening credit',
                  value: formatAmount(report.totals.openingCredit),
                },
                {
                  label: 'Movement debit',
                  value: formatAmount(report.totals.movementDebit),
                },
                {
                  label: 'Movement credit',
                  value: formatAmount(report.totals.movementCredit),
                },
                {
                  label: 'Closing debit',
                  value: formatAmount(report.totals.closingDebit),
                },
                {
                  label: 'Closing credit',
                  value: formatAmount(report.totals.closingCredit),
                },
                {
                  label: 'Balance status',
                  value: isBalanced ? 'Balanced' : 'Out of balance',
                  note: `Closing difference ${formatAmount(closingDifference)}`,
                },
              ]}
            />
          </PrintableReportSection>

          <PrintableReportSection
            subtitle="Rows are flattened from the backend account hierarchy for print readability."
            title="Trial Balance Statement"
          >
            <PrintableReportDataTable
              caption="Opening values include posted voucher lines before the selected start date; movement values include posted voucher lines inside the selected period."
              columns={[
                {
                  key: 'rowType',
                  header: 'Type',
                  render: (row) => row.rowType,
                },
                {
                  key: 'account',
                  header: 'Account code / name',
                  render: (row) => (
                    <PrintableAccountCell
                      code={row.accountCode}
                      level={row.level}
                      name={row.accountName}
                    />
                  ),
                },
                {
                  align: 'right',
                  className: 'font-mono whitespace-nowrap',
                  key: 'openingDebit',
                  header: 'Opening Dr',
                  render: (row) => formatAmount(row.openingDebit),
                },
                {
                  align: 'right',
                  className: 'font-mono whitespace-nowrap',
                  key: 'openingCredit',
                  header: 'Opening Cr',
                  render: (row) => formatAmount(row.openingCredit),
                },
                {
                  align: 'right',
                  className: 'font-mono whitespace-nowrap',
                  key: 'movementDebit',
                  header: 'Movement Dr',
                  render: (row) => formatAmount(row.movementDebit),
                },
                {
                  align: 'right',
                  className: 'font-mono whitespace-nowrap',
                  key: 'movementCredit',
                  header: 'Movement Cr',
                  render: (row) => formatAmount(row.movementCredit),
                },
                {
                  align: 'right',
                  className: 'font-mono whitespace-nowrap',
                  key: 'closingDebit',
                  header: 'Closing Dr',
                  render: (row) => formatAmount(row.closingDebit),
                },
                {
                  align: 'right',
                  className: 'font-mono whitespace-nowrap',
                  key: 'closingCredit',
                  header: 'Closing Cr',
                  render: (row) => formatAmount(row.closingCredit),
                },
              ]}
              emptyLabel="No posted voucher activity matched the selected period and filters."
              getRowKey={(row) => row.key}
              rows={buildTrialBalanceRows(report)}
            />
          </PrintableReportSection>
        </>
      ) : (
        <PrintableStatusMessage message={statusMessage} />
      )}

      <PrintableReportSection
        subtitle="Concise assumptions for finance review."
        title="Notes"
      >
        <PrintableReportNote>
          Trial balance output reflects posted vouchers only and preserves the
          backend report totals exactly.
        </PrintableReportNote>
        <PrintableReportNote>
          Closing debit and credit totals are compared as a control status. Any
          mismatch should be reviewed as a posting or data issue.
        </PrintableReportNote>
        <PrintableReportNote>{STATEMENT_PRINT_NOTE}</PrintableReportNote>
      </PrintableReportSection>

      <PrintableReportFooter
        generatedAt={generatedAt}
        note="Confidential - internal use only. Browser-generated printable statement."
        systemName="Real Capita ERP - Trial Balance"
      />
    </PrintableReportLayout>
  );
};

type GeneralLedgerPrintableRow = {
  credit: string;
  date: string;
  debit: string;
  description: string;
  key: string;
  runningBalance: string;
  voucher: string;
};

const buildGeneralLedgerRows = (
  report: GeneralLedgerResponseRecord,
): GeneralLedgerPrintableRow[] => [
  {
    credit: report.openingBalance.credit,
    date: formatDate(report.dateFrom),
    debit: report.openingBalance.debit,
    description: 'Balance before the selected period.',
    key: 'opening-balance',
    runningBalance: formatRunningBalance(
      report.openingBalance.debit,
      report.openingBalance.credit,
    ),
    voucher: 'Opening balance',
  },
  ...report.lines.map((line: GeneralLedgerLineRecord) => ({
    credit: line.credit,
    date: formatDate(line.voucherDate),
    debit: line.debit,
    description:
      line.lineDescription || line.voucherDescription || 'No description',
    key: line.voucherLineId,
    runningBalance: formatRunningBalance(line.runningDebit, line.runningCredit),
    voucher: `${line.voucherReference || line.voucherId} / ${formatVoucherTypeLabel(
      line.voucherType,
    )}`,
  })),
  {
    credit: report.totals.credit,
    date: formatDate(report.dateTo),
    debit: report.totals.debit,
    description: 'Period movement and closing balance returned by the report.',
    key: 'period-total',
    runningBalance: formatRunningBalance(
      report.totals.closingDebit,
      report.totals.closingCredit,
    ),
    voucher: 'Period totals',
  },
];

export const GeneralLedgerPrintableReport = ({
  generatedAt,
  generatedBy,
  report,
  statusMessage,
  userCompanyName,
}: {
  generatedAt: string;
  generatedBy: string;
  report: GeneralLedgerResponseRecord | null;
  statusMessage: string;
  userCompanyName: string;
}) => (
  <PrintableReportLayout
    orientation="landscape"
    testId="printable-report-general-ledger"
  >
    <PrintableReportHeader
      activeCompany={userCompanyName}
      additionalMetaItems={[
        {
          label: 'Posting account',
          value: report
            ? `${report.account.particularAccountCode} - ${report.account.particularAccountName}`
            : 'Not selected',
          wide: true,
        },
        {
          label: 'Voucher scope',
          value: report?.voucherType ?? 'All posted voucher types',
        },
      ]}
      companyName={userCompanyName}
      dataSourceNote={SOURCE_OF_TRUTH_NOTE}
      generatedAt={generatedAt}
      generatedBy={generatedBy}
      outputLabel="Browser print / A4 landscape"
      periodLabel={
        report
          ? formatReportDateRangeLabel(report.dateFrom, report.dateTo)
          : 'Select a posting account'
      }
      subtitle="Posting-account ledger with opening balance, period movement, and running balance."
      title="General Ledger"
    />

    {report ? (
      <>
        <PrintableReportSection
          subtitle="Selected account context and movement totals."
          title="Ledger Summary"
        >
          <PrintableReportSummaryTable
            rows={[
              {
                label: 'Account class',
                value: (
                  <PrintableTextValue
                    value={`${report.account.accountClassCode} - ${report.account.accountClassName}`}
                  />
                ),
              },
              {
                label: 'Account group',
                value: (
                  <PrintableTextValue
                    value={`${report.account.accountGroupCode} - ${report.account.accountGroupName}`}
                  />
                ),
              },
              {
                label: 'Ledger account',
                value: (
                  <PrintableTextValue
                    value={`${report.account.ledgerAccountCode} - ${report.account.ledgerAccountName}`}
                  />
                ),
              },
              {
                label: 'Posting account',
                value: (
                  <PrintableTextValue
                    value={`${report.account.particularAccountCode} - ${report.account.particularAccountName}`}
                  />
                ),
              },
              {
                label: 'Opening balance',
                value: formatRunningBalance(
                  report.openingBalance.debit,
                  report.openingBalance.credit,
                ),
              },
              {
                label: 'Period debit',
                value: formatAmount(report.totals.debit),
              },
              {
                label: 'Period credit',
                value: formatAmount(report.totals.credit),
              },
              {
                label: 'Closing balance',
                value: formatRunningBalance(
                  report.totals.closingDebit,
                  report.totals.closingCredit,
                ),
              },
            ]}
          />
        </PrintableReportSection>

        <PrintableReportSection
          subtitle="Voucher references, descriptions, and running balances come directly from the backend ledger response."
          title="Ledger Transactions"
        >
          <PrintableReportDataTable
            caption="Opening and period-total rows are included for ledger continuity."
            columns={[
              {
                key: 'date',
                header: 'Date',
                render: (row) => row.date,
              },
              {
                key: 'voucher',
                header: 'Voucher / reference',
                render: (row) => row.voucher,
              },
              {
                key: 'description',
                header: 'Description',
                render: (row) => row.description,
              },
              {
                align: 'right',
                className: 'font-mono whitespace-nowrap',
                key: 'debit',
                header: 'Debit',
                render: (row) => formatAmount(row.debit),
              },
              {
                align: 'right',
                className: 'font-mono whitespace-nowrap',
                key: 'credit',
                header: 'Credit',
                render: (row) => formatAmount(row.credit),
              },
              {
                align: 'right',
                className: 'font-mono whitespace-nowrap',
                key: 'runningBalance',
                header: 'Running balance',
                render: (row) => row.runningBalance,
              },
            ]}
            emptyLabel="No posted voucher lines matched the selected period. Opening and closing balances still reflect the backend response."
            getRowKey={(row) => row.key}
            rows={buildGeneralLedgerRows(report)}
          />
        </PrintableReportSection>
      </>
    ) : (
      <PrintableStatusMessage
        message={statusMessage}
        title="Ledger Report Not Ready"
      />
    )}

    <PrintableReportSection
      subtitle="Concise assumptions for finance review."
      title="Notes"
    >
      <PrintableReportNote>
        Select a posting account to generate this ledger report. Period movement
        and running balances include only posted voucher lines for the selected
        account, date range, and optional voucher type.
      </PrintableReportNote>
      <PrintableReportNote>{STATEMENT_PRINT_NOTE}</PrintableReportNote>
    </PrintableReportSection>

    <PrintableReportFooter
      generatedAt={generatedAt}
      note="Confidential - internal use only. Browser-generated printable statement."
      systemName="Real Capita ERP - General Ledger"
    />
  </PrintableReportLayout>
);

type StatementPrintableRow = {
  accountCode: string;
  accountName: string;
  amount: string;
  key: string;
  level: 0 | 1 | 2 | 3;
  rowType: string;
  sectionName: string;
};

const buildStatementRows = (
  sections: FinancialStatementSectionRecord[],
): StatementPrintableRow[] => {
  const rows: StatementPrintableRow[] = [];

  for (const section of sections) {
    rows.push({
      accountCode: section.accountClassCode,
      accountName: section.accountClassName,
      amount: section.amount,
      key: `class-${section.accountClassId}`,
      level: 0,
      rowType: 'Section total',
      sectionName: section.accountClassName,
    });

    for (const group of section.accountGroups) {
      rows.push({
        accountCode: group.accountGroupCode,
        accountName: group.accountGroupName,
        amount: group.amount,
        key: `group-${group.accountGroupId}`,
        level: 1,
        rowType: 'Account group',
        sectionName: section.accountClassName,
      });

      for (const ledger of group.ledgerAccounts) {
        rows.push({
          accountCode: ledger.ledgerAccountCode,
          accountName: ledger.ledgerAccountName,
          amount: ledger.amount,
          key: `ledger-${ledger.ledgerAccountId}`,
          level: 2,
          rowType: 'Ledger account',
          sectionName: section.accountClassName,
        });

        for (const postingAccount of ledger.postingAccounts) {
          rows.push({
            accountCode: postingAccount.particularAccountCode,
            accountName: postingAccount.particularAccountName,
            amount: postingAccount.amount,
            key: `posting-${postingAccount.particularAccountId}`,
            level: 3,
            rowType: 'Posting account',
            sectionName: section.accountClassName,
          });
        }
      }
    }
  }

  return rows;
};

const statementColumns = [
  {
    key: 'section',
    header: 'Section',
    render: (row: StatementPrintableRow) => row.sectionName,
  },
  {
    key: 'rowType',
    header: 'Type',
    render: (row: StatementPrintableRow) => row.rowType,
  },
  {
    key: 'account',
    header: 'Account code / name',
    render: (row: StatementPrintableRow) => (
      <PrintableAccountCell
        code={row.accountCode}
        level={row.level}
        name={row.accountName}
      />
    ),
  },
  {
    align: 'right' as const,
    className: 'font-mono whitespace-nowrap',
    key: 'amount',
    header: 'Amount',
    render: (row: StatementPrintableRow) => formatAmount(row.amount),
  },
];

export const ProfitAndLossPrintableReport = ({
  generatedAt,
  generatedBy,
  report,
  statusMessage,
  userCompanyName,
}: {
  generatedAt: string;
  generatedBy: string;
  report: {
    dateFrom: string;
    dateTo: string;
    sections: FinancialStatementSectionRecord[];
    totals: {
      netProfitLoss: string;
      totalExpense: string;
      totalRevenue: string;
    };
  } | null;
  statusMessage: string;
  userCompanyName: string;
}) => {
  const netProfitLoss = Number(report?.totals.netProfitLoss ?? 0);
  const resultLabel = netProfitLoss >= 0 ? 'Net profit' : 'Net loss';

  return (
    <PrintableReportLayout
      orientation="portrait"
      testId="printable-report-profit-loss"
    >
      <PrintableReportHeader
        activeCompany={userCompanyName}
        additionalMetaItems={[
          {
            label: 'Statement result',
            value: report ? resultLabel : 'Pending report data',
          },
          {
            label: 'Hierarchy scope',
            value: report
              ? getStatementSectionCountLabel(report.sections)
              : 'Pending report data',
          },
        ]}
        companyName={userCompanyName}
        dataSourceNote={SOURCE_OF_TRUTH_NOTE}
        generatedAt={generatedAt}
        generatedBy={generatedBy}
        outputLabel="Browser print / A4 portrait"
        periodLabel={
          report
            ? formatReportDateRangeLabel(report.dateFrom, report.dateTo)
            : 'Report filters pending'
        }
        subtitle="Revenue, expenses, and net result from posted voucher activity."
        title="Profit & Loss"
      />

      {report ? (
        <>
          <PrintableReportSection
            subtitle="Totals returned by the read-only profit and loss endpoint."
            title="Revenue And Expense Summary"
          >
            <PrintableReportSummaryTable
              rows={[
                {
                  label: 'Total revenue',
                  value: formatAmount(report.totals.totalRevenue),
                },
                {
                  label: 'Total expense',
                  value: formatAmount(report.totals.totalExpense),
                },
                {
                  label: resultLabel,
                  value: formatAbsAmount(report.totals.netProfitLoss),
                  note:
                    netProfitLoss >= 0
                      ? 'Revenue exceeds expenses for the selected period.'
                      : 'Expenses exceed revenue for the selected period.',
                },
              ]}
            />
          </PrintableReportSection>

          <PrintableReportSection
            subtitle="Revenue and expense sections are grouped from the backend statement response."
            title="Profit And Loss Statement"
          >
            <PrintableReportDataTable
              caption="Amounts preserve the backend statement signs and section totals."
              columns={statementColumns}
              emptyLabel="No posted revenue or expense activity matched the selected date range."
              getRowKey={(row) => row.key}
              rows={buildStatementRows(report.sections)}
            />
          </PrintableReportSection>
        </>
      ) : (
        <PrintableStatusMessage message={statusMessage} />
      )}

      <PrintableReportSection
        subtitle="Concise assumptions for finance review."
        title="Notes"
      >
        <PrintableReportNote>
          Revenue and expenses are derived from posted voucher lines in the
          matching account classes for the selected period.
        </PrintableReportNote>
        <PrintableReportNote>
          The net result is labeled as net profit when revenue exceeds expenses
          and as net loss when expenses exceed revenue.
        </PrintableReportNote>
        <PrintableReportNote>{STATEMENT_PRINT_NOTE}</PrintableReportNote>
      </PrintableReportSection>

      <PrintableReportFooter
        generatedAt={generatedAt}
        note="Confidential - internal use only. Browser-generated printable statement."
        systemName="Real Capita ERP - Profit & Loss"
      />
    </PrintableReportLayout>
  );
};

export const BalanceSheetPrintableReport = ({
  generatedAt,
  generatedBy,
  report,
  statusMessage,
  userCompanyName,
}: {
  generatedAt: string;
  generatedBy: string;
  report: BalanceSheetResponseRecord | null;
  statusMessage: string;
  userCompanyName: string;
}) => {
  const hasUnclosedEarnings = isMaterialAmount(report?.totals.unclosedEarnings);
  const adjustmentRows =
    report?.equityAdjustments.map(
      (adjustment: BalanceSheetDerivedLineRecord) => ({
        amount: adjustment.amount,
        key: adjustment.code,
        name: getBalanceSheetAdjustmentName(adjustment),
      }),
    ) ?? [];

  return (
    <PrintableReportLayout
      orientation="portrait"
      testId="printable-report-balance-sheet"
    >
      <PrintableReportHeader
        activeCompany={userCompanyName}
        additionalMetaItems={[
          {
            label: 'As-of date',
            value: report ? formatDate(report.asOfDate) : 'Pending as-of date',
          },
          {
            label: 'Balance status',
            value: report
              ? report.isBalanced
                ? 'Balanced'
                : 'Not balanced'
              : 'Pending report data',
          },
          {
            label: 'Equation',
            value: report
              ? `${formatAmount(report.totals.totalAssets)} = ${formatAmount(
                  report.totals.totalLiabilitiesAndEquity,
                )}`
              : 'Pending report data',
          },
        ]}
        companyName={userCompanyName}
        dataSourceNote={SOURCE_OF_TRUTH_NOTE}
        generatedAt={generatedAt}
        generatedBy={generatedBy}
        outputLabel="Browser print / A4 portrait"
        periodLabel={
          report ? formatDate(report.asOfDate) : 'As-of date pending'
        }
        subtitle="Assets, liabilities, equity, and the balance equation as of the selected date."
        title="Balance Sheet"
      />

      {report ? (
        <>
          <PrintableReportSection
            subtitle="Assets = Liabilities + Equity, using the backend totals."
            title="Equation Summary"
          >
            <PrintableReportSummaryTable
              rows={[
                {
                  label: 'Total assets',
                  value: formatAmount(report.totals.totalAssets),
                },
                {
                  label: 'Total liabilities',
                  value: formatAmount(report.totals.totalLiabilities),
                },
                {
                  label: 'Total equity',
                  value: formatAmount(report.totals.totalEquity),
                },
                {
                  label: 'Liabilities + equity',
                  value: formatAmount(report.totals.totalLiabilitiesAndEquity),
                },
                {
                  label: 'Balance status',
                  value: report.isBalanced ? 'Balanced' : 'Not balanced',
                  note: 'Assets = Liabilities + Equity',
                },
                ...(hasUnclosedEarnings
                  ? [
                      {
                        label: 'Unclosed earnings adjustment',
                        value: formatAmount(report.totals.unclosedEarnings),
                        note: 'Derived equity adjustment returned by the backend.',
                      },
                    ]
                  : []),
              ]}
            />
          </PrintableReportSection>

          <PrintableReportSection
            subtitle="Assets, liabilities, and equity rows are grouped from the backend statement response."
            title="Balance Sheet Statement"
          >
            <PrintableReportDataTable
              caption="Amounts preserve the backend statement totals and section groupings."
              columns={statementColumns}
              emptyLabel="No balance sheet sections were returned for the selected as-of date."
              getRowKey={(row) => row.key}
              rows={buildStatementRows(report.sections)}
            />
          </PrintableReportSection>

          {adjustmentRows.length > 0 ? (
            <PrintableReportSection
              subtitle="Derived equity adjustments are shown with user-facing labels."
              title="Equity Adjustments"
            >
              <PrintableReportDataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Adjustment',
                    render: (row) => row.name,
                  },
                  {
                    align: 'right',
                    className: 'font-mono whitespace-nowrap',
                    key: 'amount',
                    header: 'Amount',
                    render: (row) => formatAmount(row.amount),
                  },
                ]}
                getRowKey={(row) => row.key}
                rows={adjustmentRows}
              />
            </PrintableReportSection>
          ) : null}
        </>
      ) : (
        <PrintableStatusMessage message={statusMessage} />
      )}

      <PrintableReportSection
        subtitle="Concise assumptions for finance review."
        title="Notes"
      >
        <PrintableReportNote>
          Assets, liabilities, and equity are calculated from posted accounting
          balances up to and including the selected as-of date.
        </PrintableReportNote>
        <PrintableReportNote>
          If formal closing entries are absent, the backend may expose unclosed
          earnings as a named equity adjustment instead of hiding it inside
          equity totals.
        </PrintableReportNote>
        <PrintableReportNote>{STATEMENT_PRINT_NOTE}</PrintableReportNote>
      </PrintableReportSection>

      <PrintableReportFooter
        generatedAt={generatedAt}
        note="Confidential - internal use only. Browser-generated printable statement."
        systemName="Real Capita ERP - Balance Sheet"
      />
    </PrintableReportLayout>
  );
};
