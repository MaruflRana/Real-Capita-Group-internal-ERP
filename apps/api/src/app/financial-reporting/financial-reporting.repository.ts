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

type BusinessReportQueryParams = {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  bucket: 'day' | 'week' | 'month' | 'year';
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

export type BusinessReportAggregateRow = {
  bucketStart: Date;
  bucketEnd: Date;
  contractedSalesAmount: DecimalLike;
  collectedSalesAmount: DecimalLike;
  revenueAmount: DecimalLike;
  expenseAmount: DecimalLike;
  voucherCount: number;
  draftVoucherCount: number;
  postedVoucherCount: number;
  bookingCount: number;
  saleContractCount: number;
  collectionCount: number;
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

  async fetchBusinessReportRows(
    params: BusinessReportQueryParams,
  ): Promise<BusinessReportAggregateRow[]> {
    const { datePart, step } = this.getBusinessReportBucketSql(params.bucket);

    return this.databaseService.queryRaw<BusinessReportAggregateRow>(
      Prisma.sql`
        WITH bucket_series AS (
          SELECT
            gs::date AS "bucketStart",
            LEAST(
              (gs + ${step} - interval '1 day')::date,
              ${params.dateTo}::date
            ) AS "bucketEnd"
          FROM generate_series(
            date_trunc(${datePart}, ${params.dateFrom}::date)::date,
            date_trunc(${datePart}, ${params.dateTo}::date)::date,
            ${step}
          ) AS gs
        ),
        accounting_amounts AS (
          SELECT
            date_trunc(${datePart}, v."voucherDate")::date AS "bucketStart",
            COALESCE(
              SUM(
                CASE
                  WHEN ac."code" = 'REVENUE'
                    THEN vl."creditAmount" - vl."debitAmount"
                  ELSE 0
                END
              ),
              0
            ) AS "revenueAmount",
            COALESCE(
              SUM(
                CASE
                  WHEN ac."code" = 'EXPENSE'
                    THEN vl."debitAmount" - vl."creditAmount"
                  ELSE 0
                END
              ),
              0
            ) AS "expenseAmount"
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
          WHERE v."companyId" = ${params.companyId}::uuid
            AND v."status" = 'POSTED'
            AND ac."code" IN ('REVENUE', 'EXPENSE')
            AND v."voucherDate" >= ${params.dateFrom}::date
            AND v."voucherDate" <= ${params.dateTo}::date
          GROUP BY
            date_trunc(${datePart}, v."voucherDate")::date
        ),
        voucher_counts AS (
          SELECT
            date_trunc(${datePart}, v."voucherDate")::date AS "bucketStart",
            COUNT(*)::int AS "voucherCount",
            COUNT(*) FILTER (WHERE v."status" = 'DRAFT')::int AS "draftVoucherCount",
            COUNT(*) FILTER (WHERE v."status" = 'POSTED')::int AS "postedVoucherCount"
          FROM "vouchers" v
          WHERE v."companyId" = ${params.companyId}::uuid
            AND v."voucherDate" >= ${params.dateFrom}::date
            AND v."voucherDate" <= ${params.dateTo}::date
          GROUP BY
            date_trunc(${datePart}, v."voucherDate")::date
        ),
        booking_counts AS (
          SELECT
            date_trunc(${datePart}, b."bookingDate")::date AS "bucketStart",
            COUNT(*)::int AS "bookingCount"
          FROM "bookings" b
          WHERE b."companyId" = ${params.companyId}::uuid
            AND b."bookingDate" >= ${params.dateFrom}::date
            AND b."bookingDate" <= ${params.dateTo}::date
          GROUP BY
            date_trunc(${datePart}, b."bookingDate")::date
        ),
        sale_contract_amounts AS (
          SELECT
            date_trunc(${datePart}, sc."contractDate")::date AS "bucketStart",
            COALESCE(SUM(sc."contractAmount"), 0) AS "contractedSalesAmount",
            COUNT(*)::int AS "saleContractCount"
          FROM "sale_contracts" sc
          WHERE sc."companyId" = ${params.companyId}::uuid
            AND sc."contractDate" >= ${params.dateFrom}::date
            AND sc."contractDate" <= ${params.dateTo}::date
          GROUP BY
            date_trunc(${datePart}, sc."contractDate")::date
        ),
        collection_amounts AS (
          SELECT
            date_trunc(${datePart}, c."collectionDate")::date AS "bucketStart",
            COALESCE(SUM(c."amount"), 0) AS "collectedSalesAmount",
            COUNT(*)::int AS "collectionCount"
          FROM "collections" c
          WHERE c."companyId" = ${params.companyId}::uuid
            AND c."collectionDate" >= ${params.dateFrom}::date
            AND c."collectionDate" <= ${params.dateTo}::date
          GROUP BY
            date_trunc(${datePart}, c."collectionDate")::date
        )
        SELECT
          bs."bucketStart",
          bs."bucketEnd",
          COALESCE(sc."contractedSalesAmount", 0) AS "contractedSalesAmount",
          COALESCE(ca."collectedSalesAmount", 0) AS "collectedSalesAmount",
          COALESCE(aa."revenueAmount", 0) AS "revenueAmount",
          COALESCE(aa."expenseAmount", 0) AS "expenseAmount",
          COALESCE(vc."voucherCount", 0)::int AS "voucherCount",
          COALESCE(vc."draftVoucherCount", 0)::int AS "draftVoucherCount",
          COALESCE(vc."postedVoucherCount", 0)::int AS "postedVoucherCount",
          COALESCE(bc."bookingCount", 0)::int AS "bookingCount",
          COALESCE(sc."saleContractCount", 0)::int AS "saleContractCount",
          COALESCE(ca."collectionCount", 0)::int AS "collectionCount"
        FROM bucket_series bs
        LEFT JOIN accounting_amounts aa
          ON aa."bucketStart" = bs."bucketStart"
        LEFT JOIN voucher_counts vc
          ON vc."bucketStart" = bs."bucketStart"
        LEFT JOIN booking_counts bc
          ON bc."bucketStart" = bs."bucketStart"
        LEFT JOIN sale_contract_amounts sc
          ON sc."bucketStart" = bs."bucketStart"
        LEFT JOIN collection_amounts ca
          ON ca."bucketStart" = bs."bucketStart"
        ORDER BY
          bs."bucketStart" ASC
      `,
    );
  }

  private getBusinessReportBucketSql(
    bucket: BusinessReportQueryParams['bucket'],
  ) {
    if (bucket === 'day') {
      return {
        datePart: Prisma.sql`'day'`,
        step: Prisma.sql`interval '1 day'`,
      };
    }

    if (bucket === 'week') {
      return {
        datePart: Prisma.sql`'week'`,
        step: Prisma.sql`interval '1 week'`,
      };
    }

    if (bucket === 'year') {
      return {
        datePart: Prisma.sql`'year'`,
        step: Prisma.sql`interval '1 year'`,
      };
    }

    return {
      datePart: Prisma.sql`'month'`,
      step: Prisma.sql`interval '1 month'`,
    };
  }
}
