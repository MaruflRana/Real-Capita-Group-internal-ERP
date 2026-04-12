import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DatabaseService } from '../database/database.service';
import type { DecimalLike } from './financial-reporting.utils';

type TrialBalanceQueryParams = {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  voucherType?: string;
  ledgerAccountId?: string;
  particularAccountId?: string;
};

type GeneralLedgerQueryParams = {
  companyId: string;
  particularAccountId: string;
  dateFrom: string;
  dateTo: string;
  voucherType?: string;
};

type StatementQueryParams = {
  companyId: string;
  dateCondition: Prisma.Sql;
  accountClassCodes: string[];
};

export type ReportingAccountAggregateRow = {
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  accountClassNaturalBalance: string;
  accountClassSortOrder: number;
  accountGroupId: string;
  accountGroupCode: string;
  accountGroupName: string;
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  particularAccountId: string;
  particularAccountCode: string;
  particularAccountName: string;
  debitTotal: DecimalLike;
  creditTotal: DecimalLike;
};

export type TrialBalanceAggregateRow = ReportingAccountAggregateRow & {
  openingDebit: DecimalLike;
  openingCredit: DecimalLike;
  movementDebit: DecimalLike;
  movementCredit: DecimalLike;
};

export type GeneralLedgerOpeningRow = {
  debitTotal: DecimalLike;
  creditTotal: DecimalLike;
};

export type GeneralLedgerEntryRow = {
  voucherId: string;
  voucherLineId: string;
  voucherDate: Date;
  voucherType: string;
  voucherReference: string | null;
  voucherDescription: string | null;
  voucherPostedAt: Date | null;
  lineNumber: number;
  lineDescription: string | null;
  debitAmount: DecimalLike;
  creditAmount: DecimalLike;
};

@Injectable()
export class FinancialReportingRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async fetchTrialBalanceRows(
    params: TrialBalanceQueryParams,
  ): Promise<TrialBalanceAggregateRow[]> {
    const voucherTypeFilter = params.voucherType
      ? Prisma.sql` AND v."voucherType" = ${params.voucherType}::"VoucherType"`
      : Prisma.empty;
    const ledgerAccountFilter = params.ledgerAccountId
      ? Prisma.sql` AND la."id" = ${params.ledgerAccountId}::uuid`
      : Prisma.empty;
    const particularAccountFilter = params.particularAccountId
      ? Prisma.sql` AND pa."id" = ${params.particularAccountId}::uuid`
      : Prisma.empty;

    return this.databaseService.queryRaw<TrialBalanceAggregateRow>(
      Prisma.sql`
        SELECT
          ac."id" AS "accountClassId",
          ac."code" AS "accountClassCode",
          ac."name" AS "accountClassName",
          ac."naturalBalance" AS "accountClassNaturalBalance",
          ac."sortOrder" AS "accountClassSortOrder",
          ag."id" AS "accountGroupId",
          ag."code" AS "accountGroupCode",
          ag."name" AS "accountGroupName",
          la."id" AS "ledgerAccountId",
          la."code" AS "ledgerAccountCode",
          la."name" AS "ledgerAccountName",
          pa."id" AS "particularAccountId",
          pa."code" AS "particularAccountCode",
          pa."name" AS "particularAccountName",
          COALESCE(
            SUM(
              CASE
                WHEN v."voucherDate" < ${params.dateFrom}::date
                  THEN vl."debitAmount"
                ELSE 0
              END
            ),
            0
          ) AS "openingDebit",
          COALESCE(
            SUM(
              CASE
                WHEN v."voucherDate" < ${params.dateFrom}::date
                  THEN vl."creditAmount"
                ELSE 0
              END
            ),
            0
          ) AS "openingCredit",
          COALESCE(
            SUM(
              CASE
                WHEN v."voucherDate" >= ${params.dateFrom}::date
                 AND v."voucherDate" <= ${params.dateTo}::date
                  THEN vl."debitAmount"
                ELSE 0
              END
            ),
            0
          ) AS "movementDebit",
          COALESCE(
            SUM(
              CASE
                WHEN v."voucherDate" >= ${params.dateFrom}::date
                 AND v."voucherDate" <= ${params.dateTo}::date
                  THEN vl."creditAmount"
                ELSE 0
              END
            ),
            0
          ) AS "movementCredit",
          COALESCE(
            SUM(
              CASE
                WHEN v."voucherDate" <= ${params.dateTo}::date
                  THEN vl."debitAmount"
                ELSE 0
              END
            ),
            0
          ) AS "debitTotal",
          COALESCE(
            SUM(
              CASE
                WHEN v."voucherDate" <= ${params.dateTo}::date
                  THEN vl."creditAmount"
                ELSE 0
              END
            ),
            0
          ) AS "creditTotal"
        FROM "particular_accounts" pa
        INNER JOIN "ledger_accounts" la
          ON la."id" = pa."ledgerAccountId"
        INNER JOIN "account_groups" ag
          ON ag."id" = la."accountGroupId"
        INNER JOIN "account_classes" ac
          ON ac."id" = ag."accountClassId"
        LEFT JOIN "voucher_lines" vl
          ON vl."particularAccountId" = pa."id"
        LEFT JOIN "vouchers" v
          ON v."id" = vl."voucherId"
         AND v."companyId" = pa."companyId"
         AND v."status" = 'POSTED'
         ${voucherTypeFilter}
        WHERE pa."companyId" = ${params.companyId}::uuid
          ${ledgerAccountFilter}
          ${particularAccountFilter}
        GROUP BY
          ac."id",
          ag."id",
          la."id",
          pa."id"
        ORDER BY
          ac."sortOrder" ASC,
          ag."code" ASC,
          la."code" ASC,
          pa."code" ASC
      `,
    );
  }

  async fetchStatementRows(
    params: StatementQueryParams,
  ): Promise<ReportingAccountAggregateRow[]> {
    return this.databaseService.queryRaw<ReportingAccountAggregateRow>(
      Prisma.sql`
        SELECT
          ac."id" AS "accountClassId",
          ac."code" AS "accountClassCode",
          ac."name" AS "accountClassName",
          ac."naturalBalance" AS "accountClassNaturalBalance",
          ac."sortOrder" AS "accountClassSortOrder",
          ag."id" AS "accountGroupId",
          ag."code" AS "accountGroupCode",
          ag."name" AS "accountGroupName",
          la."id" AS "ledgerAccountId",
          la."code" AS "ledgerAccountCode",
          la."name" AS "ledgerAccountName",
          pa."id" AS "particularAccountId",
          pa."code" AS "particularAccountCode",
          pa."name" AS "particularAccountName",
          COALESCE(
            SUM(
              CASE
                WHEN ${params.dateCondition}
                  THEN vl."debitAmount"
                ELSE 0
              END
            ),
            0
          ) AS "debitTotal",
          COALESCE(
            SUM(
              CASE
                WHEN ${params.dateCondition}
                  THEN vl."creditAmount"
                ELSE 0
              END
            ),
            0
          ) AS "creditTotal"
        FROM "particular_accounts" pa
        INNER JOIN "ledger_accounts" la
          ON la."id" = pa."ledgerAccountId"
        INNER JOIN "account_groups" ag
          ON ag."id" = la."accountGroupId"
        INNER JOIN "account_classes" ac
          ON ac."id" = ag."accountClassId"
        LEFT JOIN "voucher_lines" vl
          ON vl."particularAccountId" = pa."id"
        LEFT JOIN "vouchers" v
          ON v."id" = vl."voucherId"
         AND v."companyId" = pa."companyId"
         AND v."status" = 'POSTED'
        WHERE pa."companyId" = ${params.companyId}::uuid
          AND ac."code" IN (${Prisma.join(params.accountClassCodes)})
        GROUP BY
          ac."id",
          ag."id",
          la."id",
          pa."id"
        ORDER BY
          ac."sortOrder" ASC,
          ag."code" ASC,
          la."code" ASC,
          pa."code" ASC
      `,
    );
  }

  async fetchGeneralLedgerOpeningBalance(
    params: GeneralLedgerQueryParams,
  ): Promise<GeneralLedgerOpeningRow | null> {
    const voucherTypeFilter = params.voucherType
      ? Prisma.sql` AND v."voucherType" = ${params.voucherType}::"VoucherType"`
      : Prisma.empty;
    const [row] = await this.databaseService.queryRaw<GeneralLedgerOpeningRow>(
      Prisma.sql`
        SELECT
          COALESCE(SUM(vl."debitAmount"), 0) AS "debitTotal",
          COALESCE(SUM(vl."creditAmount"), 0) AS "creditTotal"
        FROM "voucher_lines" vl
        INNER JOIN "vouchers" v
          ON v."id" = vl."voucherId"
        WHERE v."companyId" = ${params.companyId}::uuid
          AND v."status" = 'POSTED'
          AND vl."particularAccountId" = ${params.particularAccountId}::uuid
          AND v."voucherDate" < ${params.dateFrom}::date
          ${voucherTypeFilter}
      `,
    );

    return row ?? null;
  }

  async fetchGeneralLedgerEntries(
    params: GeneralLedgerQueryParams,
  ): Promise<GeneralLedgerEntryRow[]> {
    const voucherTypeFilter = params.voucherType
      ? Prisma.sql` AND v."voucherType" = ${params.voucherType}::"VoucherType"`
      : Prisma.empty;

    return this.databaseService.queryRaw<GeneralLedgerEntryRow>(
      Prisma.sql`
        SELECT
          v."id" AS "voucherId",
          vl."id" AS "voucherLineId",
          v."voucherDate" AS "voucherDate",
          v."voucherType" AS "voucherType",
          v."reference" AS "voucherReference",
          v."description" AS "voucherDescription",
          v."postedAt" AS "voucherPostedAt",
          vl."lineNumber" AS "lineNumber",
          vl."description" AS "lineDescription",
          vl."debitAmount" AS "debitAmount",
          vl."creditAmount" AS "creditAmount"
        FROM "voucher_lines" vl
        INNER JOIN "vouchers" v
          ON v."id" = vl."voucherId"
        WHERE v."companyId" = ${params.companyId}::uuid
          AND v."status" = 'POSTED'
          AND vl."particularAccountId" = ${params.particularAccountId}::uuid
          AND v."voucherDate" >= ${params.dateFrom}::date
          AND v."voucherDate" <= ${params.dateTo}::date
          ${voucherTypeFilter}
        ORDER BY
          v."voucherDate" ASC,
          v."id" ASC,
          vl."lineNumber" ASC
      `,
    );
  }

  async fetchUnclosedEarnings(companyId: string, asOfDate: string) {
    const [row] = await this.databaseService.queryRaw<{
      debitTotal: DecimalLike;
      creditTotal: DecimalLike;
    }>(
      Prisma.sql`
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN ac."code" = 'EXPENSE'
                 AND v."voucherDate" <= ${asOfDate}::date
                  THEN vl."debitAmount" - vl."creditAmount"
                ELSE 0
              END
            ),
            0
          ) AS "debitTotal",
          COALESCE(
            SUM(
              CASE
                WHEN ac."code" = 'REVENUE'
                 AND v."voucherDate" <= ${asOfDate}::date
                  THEN vl."creditAmount" - vl."debitAmount"
                ELSE 0
              END
            ),
            0
          ) AS "creditTotal"
        FROM "voucher_lines" vl
        INNER JOIN "vouchers" v
          ON v."id" = vl."voucherId"
        INNER JOIN "particular_accounts" pa
          ON pa."id" = vl."particularAccountId"
        INNER JOIN "ledger_accounts" la
          ON la."id" = pa."ledgerAccountId"
        INNER JOIN "account_groups" ag
          ON ag."id" = la."accountGroupId"
        INNER JOIN "account_classes" ac
          ON ac."id" = ag."accountClassId"
        WHERE v."companyId" = ${companyId}::uuid
          AND v."status" = 'POSTED'
          AND ac."code" IN ('REVENUE', 'EXPENSE')
      `,
    );

    return row ?? { debitTotal: 0, creditTotal: 0 };
  }
}
