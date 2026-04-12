'use client';

import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { formatAccountingAmount, formatDate } from '../../lib/format';
import type {
  FinancialStatementSectionRecord,
  GeneralLedgerBalanceRecord,
  GeneralLedgerLineRecord,
  GeneralLedgerTotalsRecord,
  TrialBalanceSectionRecord,
} from '../../lib/api/types';
import { formatRunningBalance, formatVoucherTypeLabel } from './utils';

const levelPadding = ['pl-0', 'pl-4', 'pl-8', 'pl-12'] as const;

const HierarchyLabel = ({
  code,
  name,
  level,
  meta,
}: {
  code: string;
  name: string;
  level: 0 | 1 | 2 | 3;
  meta?: React.ReactNode;
}) => (
  <div className={levelPadding[level]}>
    <p className="font-medium text-foreground">{name}</p>
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {code}
      </p>
      {meta}
    </div>
  </div>
);

const TrialBalanceAmountCells = ({
  openingDebit,
  openingCredit,
  movementDebit,
  movementCredit,
  closingDebit,
  closingCredit,
  isEmphasized = false,
}: {
  openingDebit: string;
  openingCredit: string;
  movementDebit: string;
  movementCredit: string;
  closingDebit: string;
  closingCredit: string;
  isEmphasized?: boolean;
}) => {
  const className = [
    'text-right font-mono tabular-nums',
    isEmphasized ? 'font-semibold text-foreground' : 'text-foreground',
  ].join(' ');

  return (
    <>
      <TableCell className={className}>
        {formatAccountingAmount(openingDebit)}
      </TableCell>
      <TableCell className={className}>
        {formatAccountingAmount(openingCredit)}
      </TableCell>
      <TableCell className={className}>
        {formatAccountingAmount(movementDebit)}
      </TableCell>
      <TableCell className={className}>
        {formatAccountingAmount(movementCredit)}
      </TableCell>
      <TableCell className={className}>
        {formatAccountingAmount(closingDebit)}
      </TableCell>
      <TableCell className={className}>
        {formatAccountingAmount(closingCredit)}
      </TableCell>
    </>
  );
};

export const TrialBalanceReportTable = ({
  sections,
  totals,
}: {
  sections: TrialBalanceSectionRecord[];
  totals: {
    openingDebit: string;
    openingCredit: string;
    movementDebit: string;
    movementCredit: string;
    closingDebit: string;
    closingCredit: string;
  };
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Hierarchy</TableHead>
        <TableHead className="text-right">Opening Dr</TableHead>
        <TableHead className="text-right">Opening Cr</TableHead>
        <TableHead className="text-right">Movement Dr</TableHead>
        <TableHead className="text-right">Movement Cr</TableHead>
        <TableHead className="text-right">Closing Dr</TableHead>
        <TableHead className="text-right">Closing Cr</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {sections.map((section) => (
        <>
          <TableRow className="bg-muted/35" key={section.accountClassId}>
            <TableCell>
              <HierarchyLabel
                code={section.accountClassCode}
                level={0}
                meta={
                  <Badge variant="outline">
                    Natural balance{' '}
                    {section.accountClassNaturalBalance.toLowerCase()}
                  </Badge>
                }
                name={section.accountClassName}
              />
            </TableCell>
            <TrialBalanceAmountCells {...section} isEmphasized />
          </TableRow>
          {section.accountGroups.map((group) => (
            <TableRow key={group.accountGroupId}>
              <TableCell>
                <HierarchyLabel
                  code={group.accountGroupCode}
                  level={1}
                  name={group.accountGroupName}
                />
              </TableCell>
              <TrialBalanceAmountCells {...group} />
            </TableRow>
          ))}
          {section.accountGroups.flatMap((group) =>
            group.ledgerAccounts.map((ledger) => (
              <TableRow key={ledger.ledgerAccountId}>
                <TableCell>
                  <HierarchyLabel
                    code={ledger.ledgerAccountCode}
                    level={2}
                    name={ledger.ledgerAccountName}
                  />
                </TableCell>
                <TrialBalanceAmountCells {...ledger} />
              </TableRow>
            )),
          )}
          {section.accountGroups.flatMap((group) =>
            group.ledgerAccounts.flatMap((ledger) =>
              ledger.postingAccounts.map((postingAccount) => (
                <TableRow key={postingAccount.particularAccountId}>
                  <TableCell>
                    <HierarchyLabel
                      code={postingAccount.particularAccountCode}
                      level={3}
                      name={postingAccount.particularAccountName}
                    />
                  </TableCell>
                  <TrialBalanceAmountCells {...postingAccount} />
                </TableRow>
              )),
            ),
          )}
        </>
      ))}
      <TableRow className="bg-primary/5">
        <TableCell className="font-semibold text-foreground">
          Report totals
        </TableCell>
        <TrialBalanceAmountCells {...totals} isEmphasized />
      </TableRow>
    </TableBody>
  </Table>
);

export const StatementHierarchyTable = ({
  sections,
}: {
  sections: FinancialStatementSectionRecord[];
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Hierarchy</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {sections.map((section) => (
        <>
          <TableRow className="bg-muted/35" key={section.accountClassId}>
            <TableCell>
              <HierarchyLabel
                code={section.accountClassCode}
                level={0}
                meta={
                  <Badge variant="outline">
                    Natural balance{' '}
                    {section.accountClassNaturalBalance.toLowerCase()}
                  </Badge>
                }
                name={section.accountClassName}
              />
            </TableCell>
            <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
              {formatAccountingAmount(section.amount)}
            </TableCell>
          </TableRow>
          {section.accountGroups.map((group) => (
            <TableRow key={group.accountGroupId}>
              <TableCell>
                <HierarchyLabel
                  code={group.accountGroupCode}
                  level={1}
                  name={group.accountGroupName}
                />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-foreground">
                {formatAccountingAmount(group.amount)}
              </TableCell>
            </TableRow>
          ))}
          {section.accountGroups.flatMap((group) =>
            group.ledgerAccounts.map((ledger) => (
              <TableRow key={ledger.ledgerAccountId}>
                <TableCell>
                  <HierarchyLabel
                    code={ledger.ledgerAccountCode}
                    level={2}
                    name={ledger.ledgerAccountName}
                  />
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-foreground">
                  {formatAccountingAmount(ledger.amount)}
                </TableCell>
              </TableRow>
            )),
          )}
          {section.accountGroups.flatMap((group) =>
            group.ledgerAccounts.flatMap((ledger) =>
              ledger.postingAccounts.map((postingAccount) => (
                <TableRow key={postingAccount.particularAccountId}>
                  <TableCell>
                    <HierarchyLabel
                      code={postingAccount.particularAccountCode}
                      level={3}
                      name={postingAccount.particularAccountName}
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-foreground">
                    {formatAccountingAmount(postingAccount.amount)}
                  </TableCell>
                </TableRow>
              )),
            ),
          )}
        </>
      ))}
    </TableBody>
  </Table>
);

const GeneralLedgerBalanceCell = ({
  balance,
}: {
  balance: GeneralLedgerBalanceRecord;
}) => (
  <span className="font-mono tabular-nums text-foreground">
    {formatRunningBalance(balance.debit, balance.credit)}
  </span>
);

export const GeneralLedgerLinesTable = ({
  dateFrom,
  openingBalance,
  lines,
  totals,
}: {
  dateFrom: string;
  openingBalance: GeneralLedgerBalanceRecord;
  lines: GeneralLedgerLineRecord[];
  totals: GeneralLedgerTotalsRecord;
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Date</TableHead>
        <TableHead>Voucher</TableHead>
        <TableHead>Description</TableHead>
        <TableHead className="text-right">Debit</TableHead>
        <TableHead className="text-right">Credit</TableHead>
        <TableHead className="text-right">Running balance</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="bg-muted/35">
        <TableCell>{formatDate(dateFrom)}</TableCell>
        <TableCell className="font-medium text-foreground">
          Opening balance
        </TableCell>
        <TableCell className="text-muted-foreground">
          Balance before the selected period.
        </TableCell>
        <TableCell className="text-right font-mono tabular-nums text-foreground">
          {formatAccountingAmount(openingBalance.debit)}
        </TableCell>
        <TableCell className="text-right font-mono tabular-nums text-foreground">
          {formatAccountingAmount(openingBalance.credit)}
        </TableCell>
        <TableCell className="text-right">
          <GeneralLedgerBalanceCell balance={openingBalance} />
        </TableCell>
      </TableRow>
      {lines.map((line) => (
        <TableRow key={line.voucherLineId}>
          <TableCell>{formatDate(line.voucherDate)}</TableCell>
          <TableCell>
            <div>
              <p className="font-medium text-foreground">
                {line.voucherReference || line.voucherId}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {formatVoucherTypeLabel(line.voucherType)}
              </p>
            </div>
          </TableCell>
          <TableCell>
            <div>
              <p className="text-foreground">
                {line.lineDescription ||
                  line.voucherDescription ||
                  'No description'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Voucher ID {line.voucherId}
              </p>
            </div>
          </TableCell>
          <TableCell className="text-right font-mono tabular-nums text-foreground">
            {formatAccountingAmount(line.debit)}
          </TableCell>
          <TableCell className="text-right font-mono tabular-nums text-foreground">
            {formatAccountingAmount(line.credit)}
          </TableCell>
          <TableCell className="text-right">
            <span className="font-mono tabular-nums text-foreground">
              {formatRunningBalance(line.runningDebit, line.runningCredit)}
            </span>
          </TableCell>
        </TableRow>
      ))}
      {lines.length === 0 ? (
        <TableRow>
          <TableCell className="text-muted-foreground" colSpan={6}>
            No posted voucher lines matched the selected period. Opening and
            closing balances still reflect the backend response.
          </TableCell>
        </TableRow>
      ) : null}
      <TableRow className="bg-primary/5">
        <TableCell colSpan={3}>
          <span className="font-semibold text-foreground">Period totals</span>
        </TableCell>
        <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
          {formatAccountingAmount(totals.debit)}
        </TableCell>
        <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
          {formatAccountingAmount(totals.credit)}
        </TableCell>
        <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
          {formatRunningBalance(totals.closingDebit, totals.closingCredit)}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
);
