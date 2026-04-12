import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';
import type {
  BalanceSheetResponseDto,
  FinancialStatementAccountGroupDto,
  FinancialStatementLedgerAccountDto,
  FinancialStatementPostingAccountDto,
  FinancialStatementSectionDto,
  GeneralLedgerQueryDto,
  GeneralLedgerResponseDto,
  ProfitAndLossQueryDto,
  ProfitAndLossResponseDto,
  TrialBalanceAccountGroupDto,
  TrialBalancePostingAccountDto,
  TrialBalanceQueryDto,
  TrialBalanceResponseDto,
  TrialBalanceSectionDto,
} from './dto/financial-reporting.dto';
import {
  assertBalanced,
  assertValidDateRange,
  formatDecimal,
  isZeroAmount,
  parseReportDate,
  signedBalanceToDebitCredit,
  totalsToNaturalAmount,
  totalsToSignedBalance,
  toDecimal,
  zeroDecimal,
} from './financial-reporting.utils';
import {
  FinancialReportingRepository,
  type ReportingAccountAggregateRow,
  type TrialBalanceAggregateRow,
} from './financial-reporting.repository';

type TrialBalanceAmountState = {
  openingDebit: Prisma.Decimal;
  openingCredit: Prisma.Decimal;
  movementDebit: Prisma.Decimal;
  movementCredit: Prisma.Decimal;
  closingDebit: Prisma.Decimal;
  closingCredit: Prisma.Decimal;
};

type TrialBalancePostingAccountState = TrialBalanceAmountState & {
  particularAccountId: string;
  particularAccountCode: string;
  particularAccountName: string;
};

type TrialBalanceLedgerAccountState = TrialBalanceAmountState & {
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  postingAccounts: TrialBalancePostingAccountState[];
};

type TrialBalanceAccountGroupState = TrialBalanceAmountState & {
  accountGroupId: string;
  accountGroupCode: string;
  accountGroupName: string;
  ledgerAccounts: TrialBalanceLedgerAccountState[];
};

type TrialBalanceSectionState = TrialBalanceAmountState & {
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  accountClassNaturalBalance: string;
  accountClassSortOrder: number;
  accountGroups: TrialBalanceAccountGroupState[];
};

type StatementPostingAccountState = {
  particularAccountId: string;
  particularAccountCode: string;
  particularAccountName: string;
  amount: Prisma.Decimal;
};

type StatementLedgerAccountState = {
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  amount: Prisma.Decimal;
  postingAccounts: StatementPostingAccountState[];
};

type StatementAccountGroupState = {
  accountGroupId: string;
  accountGroupCode: string;
  accountGroupName: string;
  amount: Prisma.Decimal;
  ledgerAccounts: StatementLedgerAccountState[];
};

type StatementSectionState = {
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  accountClassNaturalBalance: string;
  accountClassSortOrder: number;
  amount: Prisma.Decimal;
  accountGroups: StatementAccountGroupState[];
};

@Injectable()
export class FinancialReportingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialReportingRepository: FinancialReportingRepository,
  ) {}

  async getTrialBalance(
    companyId: string,
    query: TrialBalanceQueryDto,
  ): Promise<TrialBalanceResponseDto> {
    // Prompt 19 intentionally keeps project/cost-center filtering out of the API.
    // Posted voucher lines do not carry generic dimensional columns in the current
    // accounting schema, so exposing those filters here would produce misleading reports.
    const { dateFrom, dateTo } = this.parseDateRange(query.dateFrom, query.dateTo);

    await this.assertCompanyExists(companyId);

    if (query.ledgerAccountId) {
      await this.assertLedgerAccountExists(companyId, query.ledgerAccountId);
    }

    if (query.particularAccountId) {
      const particularAccount = await this.getParticularAccountRecord(
        companyId,
        query.particularAccountId,
      );

      if (
        query.ledgerAccountId &&
        particularAccount.ledgerAccountId !== query.ledgerAccountId
      ) {
        throw new BadRequestException(
          'The selected posting account must belong to the selected ledger account.',
        );
      }
    }

    const rows = await this.financialReportingRepository.fetchTrialBalanceRows({
      companyId,
      dateFrom,
      dateTo,
      ...(query.voucherType ? { voucherType: query.voucherType } : {}),
      ...(query.ledgerAccountId
        ? { ledgerAccountId: query.ledgerAccountId }
        : {}),
      ...(query.particularAccountId
        ? { particularAccountId: query.particularAccountId }
        : {}),
    });
    const includeZeroRows = Boolean(
      query.ledgerAccountId || query.particularAccountId,
    );
    const relevantRows = includeZeroRows
      ? rows
      : rows.filter((row) => this.hasTrialBalanceActivity(row));
    const sections = this.buildTrialBalanceSections(relevantRows);
    const totals = sections.reduce(
      (result, section) => this.addTrialBalanceAmounts(result, section),
      this.emptyTrialBalanceAmountState(),
    );

    return {
      companyId,
      dateFrom,
      dateTo,
      voucherType: query.voucherType ?? null,
      ledgerAccountId: query.ledgerAccountId ?? null,
      particularAccountId: query.particularAccountId ?? null,
      totals: this.serializeTrialBalanceAmounts(totals),
      sections: sections.map((section) => this.serializeTrialBalanceSection(section)),
    };
  }

  async getGeneralLedger(
    companyId: string,
    query: GeneralLedgerQueryDto,
  ): Promise<GeneralLedgerResponseDto> {
    const { dateFrom, dateTo } = this.parseDateRange(query.dateFrom, query.dateTo);

    await this.assertCompanyExists(companyId);

    const account = await this.getParticularAccountRecord(
      companyId,
      query.particularAccountId,
    );
    const openingRow =
      await this.financialReportingRepository.fetchGeneralLedgerOpeningBalance({
        companyId,
        particularAccountId: query.particularAccountId,
        dateFrom,
        dateTo,
        ...(query.voucherType ? { voucherType: query.voucherType } : {}),
      });
    const lines = await this.financialReportingRepository.fetchGeneralLedgerEntries({
      companyId,
      particularAccountId: query.particularAccountId,
      dateFrom,
      dateTo,
      ...(query.voucherType ? { voucherType: query.voucherType } : {}),
    });

    let runningBalance = totalsToSignedBalance(
      openingRow?.debitTotal,
      openingRow?.creditTotal,
    );
    const lineDtos = lines.map((line) => {
      runningBalance = runningBalance
        .plus(toDecimal(line.debitAmount))
        .minus(toDecimal(line.creditAmount));
      const runningSplit = signedBalanceToDebitCredit(runningBalance);

      return {
        voucherId: line.voucherId,
        voucherLineId: line.voucherLineId,
        voucherDate: line.voucherDate.toISOString().slice(0, 10),
        voucherType: line.voucherType,
        voucherReference: line.voucherReference,
        voucherDescription: line.voucherDescription,
        lineNumber: line.lineNumber,
        lineDescription: line.lineDescription,
        debit: formatDecimal(line.debitAmount),
        credit: formatDecimal(line.creditAmount),
        runningDebit: formatDecimal(runningSplit.debit),
        runningCredit: formatDecimal(runningSplit.credit),
      };
    });
    const movementDebit = lines.reduce(
      (result, line) => result.plus(toDecimal(line.debitAmount)),
      zeroDecimal(),
    );
    const movementCredit = lines.reduce(
      (result, line) => result.plus(toDecimal(line.creditAmount)),
      zeroDecimal(),
    );
    const closingSplit = signedBalanceToDebitCredit(runningBalance);

    return {
      companyId,
      dateFrom,
      dateTo,
      voucherType: query.voucherType ?? null,
      account: {
        accountClassId: account.ledgerAccount.accountGroup.accountClassId,
        accountClassCode: account.ledgerAccount.accountGroup.accountClass.code,
        accountClassName: account.ledgerAccount.accountGroup.accountClass.name,
        accountClassNaturalBalance:
          account.ledgerAccount.accountGroup.accountClass.naturalBalance,
        accountGroupId: account.ledgerAccount.accountGroupId,
        accountGroupCode: account.ledgerAccount.accountGroup.code,
        accountGroupName: account.ledgerAccount.accountGroup.name,
        ledgerAccountId: account.ledgerAccountId,
        ledgerAccountCode: account.ledgerAccount.code,
        ledgerAccountName: account.ledgerAccount.name,
        particularAccountId: account.id,
        particularAccountCode: account.code,
        particularAccountName: account.name,
        isActive: account.isActive,
      },
      openingBalance: this.serializeDebitCredit(
        signedBalanceToDebitCredit(
          totalsToSignedBalance(openingRow?.debitTotal, openingRow?.creditTotal),
        ),
      ),
      totals: {
        debit: formatDecimal(movementDebit),
        credit: formatDecimal(movementCredit),
        closingDebit: formatDecimal(closingSplit.debit),
        closingCredit: formatDecimal(closingSplit.credit),
      },
      lines: lineDtos,
    };
  }

  async getProfitAndLoss(
    companyId: string,
    query: ProfitAndLossQueryDto,
  ): Promise<ProfitAndLossResponseDto> {
    const { dateFrom, dateTo } = this.parseDateRange(query.dateFrom, query.dateTo);

    await this.assertCompanyExists(companyId);

    const rows = await this.financialReportingRepository.fetchStatementRows({
      companyId,
      dateCondition: Prisma.sql`v."voucherDate" >= ${dateFrom}::date AND v."voucherDate" <= ${dateTo}::date`,
      accountClassCodes: ['REVENUE', 'EXPENSE'],
    });
    const sections = this.buildStatementSections(rows, {
      omitZeroAccounts: true,
    });
    const revenueSection =
      sections.find((section) => section.accountClassCode === 'REVENUE') ?? null;
    const expenseSection =
      sections.find((section) => section.accountClassCode === 'EXPENSE') ?? null;
    const totalRevenue = revenueSection?.amount ?? zeroDecimal();
    const totalExpense = expenseSection?.amount ?? zeroDecimal();

    return {
      companyId,
      dateFrom,
      dateTo,
      totals: {
        totalRevenue: formatDecimal(totalRevenue),
        totalExpense: formatDecimal(totalExpense),
        netProfitLoss: formatDecimal(totalRevenue.minus(totalExpense)),
      },
      sections: sections.map((section) => this.serializeStatementSection(section)),
    };
  }

  async getBalanceSheet(
    companyId: string,
    asOfDateValue: string,
  ): Promise<BalanceSheetResponseDto> {
    const asOfDate = parseReportDate(asOfDateValue, 'asOfDate');

    await this.assertCompanyExists(companyId);

    const rows = await this.financialReportingRepository.fetchStatementRows({
      companyId,
      dateCondition: Prisma.sql`v."voucherDate" <= ${asOfDate}::date`,
      accountClassCodes: ['ASSET', 'LIABILITY', 'EQUITY'],
    });
    const sections = this.buildStatementSections(rows, {
      omitZeroAccounts: true,
    });
    const assetsSection =
      sections.find((section) => section.accountClassCode === 'ASSET') ?? null;
    const liabilitiesSection =
      sections.find((section) => section.accountClassCode === 'LIABILITY') ?? null;
    const equitySection =
      sections.find((section) => section.accountClassCode === 'EQUITY') ?? null;

    // Prompt 6 did not introduce year-end closing entries, so revenue and expense
    // balances remain open in the ledger. We surface them as a derived equity
    // adjustment to keep the balance sheet mathematically sound without mutating data.
    const unclosedEarningsRow =
      await this.financialReportingRepository.fetchUnclosedEarnings(
        companyId,
        asOfDate,
      );
    const unclosedEarnings = toDecimal(unclosedEarningsRow.creditTotal).minus(
      toDecimal(unclosedEarningsRow.debitTotal),
    );
    const totalAssets = assetsSection?.amount ?? zeroDecimal();
    const totalLiabilities = liabilitiesSection?.amount ?? zeroDecimal();
    const baseEquity = equitySection?.amount ?? zeroDecimal();
    const totalEquity = baseEquity.plus(unclosedEarnings);
    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquity);

    assertBalanced(
      totalAssets,
      totalLiabilitiesAndEquity,
      'Balance sheet totals are out of balance for the requested as-of date.',
    );

    return {
      companyId,
      asOfDate,
      isBalanced: true,
      totals: {
        totalAssets: formatDecimal(totalAssets),
        totalLiabilities: formatDecimal(totalLiabilities),
        totalEquity: formatDecimal(totalEquity),
        unclosedEarnings: formatDecimal(unclosedEarnings),
        totalLiabilitiesAndEquity: formatDecimal(totalLiabilitiesAndEquity),
      },
      sections: sections.map((section) => this.serializeStatementSection(section)),
      equityAdjustments: [
        {
          code: 'UNCLOSED_EARNINGS',
          name: 'Unclosed earnings',
          amount: formatDecimal(unclosedEarnings),
        },
      ],
    };
  }

  private parseDateRange(dateFromValue: string, dateToValue: string) {
    const dateFrom = parseReportDate(dateFromValue, 'dateFrom');
    const dateTo = parseReportDate(dateToValue, 'dateTo');

    assertValidDateRange(dateFrom, dateTo);

    return {
      dateFrom,
      dateTo,
    };
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }
  }

  private async assertLedgerAccountExists(
    companyId: string,
    ledgerAccountId: string,
  ): Promise<void> {
    const ledgerAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        id: ledgerAccountId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!ledgerAccount) {
      throw new NotFoundException('Ledger account not found.');
    }
  }

  private async getParticularAccountRecord(
    companyId: string,
    particularAccountId: string,
  ) {
    const particularAccount = await this.prisma.particularAccount.findFirst({
      where: {
        id: particularAccountId,
        companyId,
      },
      include: {
        ledgerAccount: {
          include: {
            accountGroup: {
              include: {
                accountClass: true,
              },
            },
          },
        },
      },
    });

    if (!particularAccount) {
      throw new NotFoundException('Particular account not found.');
    }

    return particularAccount;
  }

  private hasTrialBalanceActivity(row: TrialBalanceAggregateRow): boolean {
    return !(
      isZeroAmount(row.openingDebit) &&
      isZeroAmount(row.openingCredit) &&
      isZeroAmount(row.movementDebit) &&
      isZeroAmount(row.movementCredit) &&
      isZeroAmount(row.debitTotal) &&
      isZeroAmount(row.creditTotal)
    );
  }

  private buildTrialBalanceSections(
    rows: TrialBalanceAggregateRow[],
  ): TrialBalanceSectionState[] {
    const sections: TrialBalanceSectionState[] = [];

    for (const row of rows) {
      const leafState = this.createTrialBalanceLeaf(row);
      const section =
        sections.find(
          (candidate) => candidate.accountClassId === row.accountClassId,
        ) ??
        this.pushTrialBalanceSection(
          sections,
          row.accountClassId,
          row.accountClassCode,
          row.accountClassName,
          row.accountClassNaturalBalance,
          row.accountClassSortOrder,
        );
      const accountGroup =
        section.accountGroups.find(
          (candidate) => candidate.accountGroupId === row.accountGroupId,
        ) ??
        this.pushTrialBalanceAccountGroup(
          section.accountGroups,
          row.accountGroupId,
          row.accountGroupCode,
          row.accountGroupName,
        );
      const ledgerAccount =
        accountGroup.ledgerAccounts.find(
          (candidate) => candidate.ledgerAccountId === row.ledgerAccountId,
        ) ??
        this.pushTrialBalanceLedgerAccount(
          accountGroup.ledgerAccounts,
          row.ledgerAccountId,
          row.ledgerAccountCode,
          row.ledgerAccountName,
        );

      ledgerAccount.postingAccounts.push(leafState);
      this.addTrialBalanceAmounts(ledgerAccount, leafState);
      this.addTrialBalanceAmounts(accountGroup, leafState);
      this.addTrialBalanceAmounts(section, leafState);
    }

    return sections;
  }

  private createTrialBalanceLeaf(
    row: TrialBalanceAggregateRow,
  ): TrialBalancePostingAccountState {
    const closingSplit = signedBalanceToDebitCredit(
      totalsToSignedBalance(row.debitTotal, row.creditTotal),
    );

    return {
      particularAccountId: row.particularAccountId,
      particularAccountCode: row.particularAccountCode,
      particularAccountName: row.particularAccountName,
      openingDebit: toDecimal(row.openingDebit),
      openingCredit: toDecimal(row.openingCredit),
      movementDebit: toDecimal(row.movementDebit),
      movementCredit: toDecimal(row.movementCredit),
      closingDebit: closingSplit.debit,
      closingCredit: closingSplit.credit,
    };
  }

  private emptyTrialBalanceAmountState(): TrialBalanceAmountState {
    return {
      openingDebit: zeroDecimal(),
      openingCredit: zeroDecimal(),
      movementDebit: zeroDecimal(),
      movementCredit: zeroDecimal(),
      closingDebit: zeroDecimal(),
      closingCredit: zeroDecimal(),
    };
  }

  private pushTrialBalanceSection(
    sections: TrialBalanceSectionState[],
    accountClassId: string,
    accountClassCode: string,
    accountClassName: string,
    accountClassNaturalBalance: string,
    accountClassSortOrder: number,
  ) {
    const section: TrialBalanceSectionState = {
      accountClassId,
      accountClassCode,
      accountClassName,
      accountClassNaturalBalance,
      accountClassSortOrder,
      accountGroups: [],
      ...this.emptyTrialBalanceAmountState(),
    };

    sections.push(section);

    return section;
  }

  private pushTrialBalanceAccountGroup(
    accountGroups: TrialBalanceAccountGroupState[],
    accountGroupId: string,
    accountGroupCode: string,
    accountGroupName: string,
  ) {
    const accountGroup: TrialBalanceAccountGroupState = {
      accountGroupId,
      accountGroupCode,
      accountGroupName,
      ledgerAccounts: [],
      ...this.emptyTrialBalanceAmountState(),
    };

    accountGroups.push(accountGroup);

    return accountGroup;
  }

  private pushTrialBalanceLedgerAccount(
    ledgerAccounts: TrialBalanceLedgerAccountState[],
    ledgerAccountId: string,
    ledgerAccountCode: string,
    ledgerAccountName: string,
  ) {
    const ledgerAccount: TrialBalanceLedgerAccountState = {
      ledgerAccountId,
      ledgerAccountCode,
      ledgerAccountName,
      postingAccounts: [],
      ...this.emptyTrialBalanceAmountState(),
    };

    ledgerAccounts.push(ledgerAccount);

    return ledgerAccount;
  }

  private addTrialBalanceAmounts<T extends TrialBalanceAmountState>(
    target: T,
    source: TrialBalanceAmountState,
  ): T {
    target.openingDebit = target.openingDebit.plus(source.openingDebit);
    target.openingCredit = target.openingCredit.plus(source.openingCredit);
    target.movementDebit = target.movementDebit.plus(source.movementDebit);
    target.movementCredit = target.movementCredit.plus(source.movementCredit);
    target.closingDebit = target.closingDebit.plus(source.closingDebit);
    target.closingCredit = target.closingCredit.plus(source.closingCredit);

    return target;
  }

  private serializeTrialBalanceAmounts(amounts: TrialBalanceAmountState) {
    return {
      openingDebit: formatDecimal(amounts.openingDebit),
      openingCredit: formatDecimal(amounts.openingCredit),
      movementDebit: formatDecimal(amounts.movementDebit),
      movementCredit: formatDecimal(amounts.movementCredit),
      closingDebit: formatDecimal(amounts.closingDebit),
      closingCredit: formatDecimal(amounts.closingCredit),
    };
  }

  private serializeTrialBalanceSection(
    section: TrialBalanceSectionState,
  ): TrialBalanceSectionDto {
    return {
      accountClassId: section.accountClassId,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      accountClassNaturalBalance: section.accountClassNaturalBalance,
      accountClassSortOrder: section.accountClassSortOrder,
      ...this.serializeTrialBalanceAmounts(section),
      accountGroups: section.accountGroups.map((accountGroup) =>
        this.serializeTrialBalanceAccountGroup(accountGroup),
      ),
    };
  }

  private serializeTrialBalanceAccountGroup(
    accountGroup: TrialBalanceAccountGroupState,
  ): TrialBalanceAccountGroupDto {
    return {
      accountGroupId: accountGroup.accountGroupId,
      accountGroupCode: accountGroup.accountGroupCode,
      accountGroupName: accountGroup.accountGroupName,
      ...this.serializeTrialBalanceAmounts(accountGroup),
      ledgerAccounts: accountGroup.ledgerAccounts.map((ledgerAccount) => ({
        ledgerAccountId: ledgerAccount.ledgerAccountId,
        ledgerAccountCode: ledgerAccount.ledgerAccountCode,
        ledgerAccountName: ledgerAccount.ledgerAccountName,
        ...this.serializeTrialBalanceAmounts(ledgerAccount),
        postingAccounts: ledgerAccount.postingAccounts.map((postingAccount) =>
          this.serializeTrialBalancePostingAccount(postingAccount),
        ),
      })),
    };
  }

  private serializeTrialBalancePostingAccount(
    postingAccount: TrialBalancePostingAccountState,
  ): TrialBalancePostingAccountDto {
    return {
      particularAccountId: postingAccount.particularAccountId,
      particularAccountCode: postingAccount.particularAccountCode,
      particularAccountName: postingAccount.particularAccountName,
      ...this.serializeTrialBalanceAmounts(postingAccount),
    };
  }

  private buildStatementSections(
    rows: ReportingAccountAggregateRow[],
    options: {
      omitZeroAccounts: boolean;
    },
  ): StatementSectionState[] {
    const sections: StatementSectionState[] = [];

    for (const row of rows) {
      const amount = totalsToNaturalAmount(
        row.accountClassNaturalBalance,
        row.debitTotal,
        row.creditTotal,
      );

      if (options.omitZeroAccounts && amount.eq(0)) {
        continue;
      }

      const section =
        sections.find(
          (candidate) => candidate.accountClassId === row.accountClassId,
        ) ??
        this.pushStatementSection(
          sections,
          row.accountClassId,
          row.accountClassCode,
          row.accountClassName,
          row.accountClassNaturalBalance,
          row.accountClassSortOrder,
        );
      const accountGroup =
        section.accountGroups.find(
          (candidate) => candidate.accountGroupId === row.accountGroupId,
        ) ??
        this.pushStatementAccountGroup(
          section.accountGroups,
          row.accountGroupId,
          row.accountGroupCode,
          row.accountGroupName,
        );
      const ledgerAccount =
        accountGroup.ledgerAccounts.find(
          (candidate) => candidate.ledgerAccountId === row.ledgerAccountId,
        ) ??
        this.pushStatementLedgerAccount(
          accountGroup.ledgerAccounts,
          row.ledgerAccountId,
          row.ledgerAccountCode,
          row.ledgerAccountName,
        );
      const postingAccount: StatementPostingAccountState = {
        particularAccountId: row.particularAccountId,
        particularAccountCode: row.particularAccountCode,
        particularAccountName: row.particularAccountName,
        amount,
      };

      ledgerAccount.postingAccounts.push(postingAccount);
      ledgerAccount.amount = ledgerAccount.amount.plus(amount);
      accountGroup.amount = accountGroup.amount.plus(amount);
      section.amount = section.amount.plus(amount);
    }

    return sections;
  }

  private pushStatementSection(
    sections: StatementSectionState[],
    accountClassId: string,
    accountClassCode: string,
    accountClassName: string,
    accountClassNaturalBalance: string,
    accountClassSortOrder: number,
  ) {
    const section: StatementSectionState = {
      accountClassId,
      accountClassCode,
      accountClassName,
      accountClassNaturalBalance,
      accountClassSortOrder,
      amount: zeroDecimal(),
      accountGroups: [],
    };

    sections.push(section);

    return section;
  }

  private pushStatementAccountGroup(
    accountGroups: StatementAccountGroupState[],
    accountGroupId: string,
    accountGroupCode: string,
    accountGroupName: string,
  ) {
    const accountGroup: StatementAccountGroupState = {
      accountGroupId,
      accountGroupCode,
      accountGroupName,
      amount: zeroDecimal(),
      ledgerAccounts: [],
    };

    accountGroups.push(accountGroup);

    return accountGroup;
  }

  private pushStatementLedgerAccount(
    ledgerAccounts: StatementLedgerAccountState[],
    ledgerAccountId: string,
    ledgerAccountCode: string,
    ledgerAccountName: string,
  ) {
    const ledgerAccount: StatementLedgerAccountState = {
      ledgerAccountId,
      ledgerAccountCode,
      ledgerAccountName,
      amount: zeroDecimal(),
      postingAccounts: [],
    };

    ledgerAccounts.push(ledgerAccount);

    return ledgerAccount;
  }

  private serializeStatementSection(
    section: StatementSectionState,
  ): FinancialStatementSectionDto {
    return {
      accountClassId: section.accountClassId,
      accountClassCode: section.accountClassCode,
      accountClassName: section.accountClassName,
      accountClassNaturalBalance: section.accountClassNaturalBalance,
      accountClassSortOrder: section.accountClassSortOrder,
      amount: formatDecimal(section.amount),
      accountGroups: section.accountGroups.map((accountGroup) =>
        this.serializeStatementAccountGroup(accountGroup),
      ),
    };
  }

  private serializeStatementAccountGroup(
    accountGroup: StatementAccountGroupState,
  ): FinancialStatementAccountGroupDto {
    return {
      accountGroupId: accountGroup.accountGroupId,
      accountGroupCode: accountGroup.accountGroupCode,
      accountGroupName: accountGroup.accountGroupName,
      amount: formatDecimal(accountGroup.amount),
      ledgerAccounts: accountGroup.ledgerAccounts.map((ledgerAccount) =>
        this.serializeStatementLedgerAccount(ledgerAccount),
      ),
    };
  }

  private serializeStatementLedgerAccount(
    ledgerAccount: StatementLedgerAccountState,
  ): FinancialStatementLedgerAccountDto {
    return {
      ledgerAccountId: ledgerAccount.ledgerAccountId,
      ledgerAccountCode: ledgerAccount.ledgerAccountCode,
      ledgerAccountName: ledgerAccount.ledgerAccountName,
      amount: formatDecimal(ledgerAccount.amount),
      postingAccounts: ledgerAccount.postingAccounts.map((postingAccount) =>
        this.serializeStatementPostingAccount(postingAccount),
      ),
    };
  }

  private serializeStatementPostingAccount(
    postingAccount: StatementPostingAccountState,
  ): FinancialStatementPostingAccountDto {
    return {
      particularAccountId: postingAccount.particularAccountId,
      particularAccountCode: postingAccount.particularAccountCode,
      particularAccountName: postingAccount.particularAccountName,
      amount: formatDecimal(postingAccount.amount),
    };
  }

  private serializeDebitCredit(balance: {
    debit: Prisma.Decimal;
    credit: Prisma.Decimal;
  }) {
    return {
      debit: formatDecimal(balance.debit),
      credit: formatDecimal(balance.credit),
    };
  }
}
