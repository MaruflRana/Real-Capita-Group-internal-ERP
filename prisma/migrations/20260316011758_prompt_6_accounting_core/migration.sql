-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('RECEIPT', 'PAYMENT', 'JOURNAL', 'CONTRA');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('DRAFT', 'POSTED');

-- CreateTable
CREATE TABLE "account_classes" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "naturalBalance" "AccountNature" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_groups" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "accountClassId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "accountGroupId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "particular_accounts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "ledgerAccountId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "particular_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "postedById" UUID,
    "voucherType" "VoucherType" NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'DRAFT',
    "voucherDate" DATE NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_lines" (
    "id" UUID NOT NULL,
    "voucherId" UUID NOT NULL,
    "particularAccountId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT,
    "debitAmount" DECIMAL(18,2) NOT NULL,
    "creditAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voucher_lines_pkey" PRIMARY KEY ("id")
);

-- SeedData
INSERT INTO "roles" ("id", "code", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES
    (
        '64aa4b14-0cb4-4d6d-95bc-17d2f45a5001',
        'company_accountant',
        'Company Accountant',
        'Accounting administration access for chart-of-accounts and voucher operations within the selected company scope.',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("code") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "account_classes" ("id", "code", "name", "naturalBalance", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
    (
        '2f2b501c-c4c7-4691-a444-0c0b6d4a6001',
        'ASSET',
        'Assets',
        'DEBIT',
        1,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '2f2b501c-c4c7-4691-a444-0c0b6d4a6002',
        'LIABILITY',
        'Liabilities',
        'CREDIT',
        2,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '2f2b501c-c4c7-4691-a444-0c0b6d4a6003',
        'EQUITY',
        'Equity',
        'CREDIT',
        3,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '2f2b501c-c4c7-4691-a444-0c0b6d4a6004',
        'REVENUE',
        'Revenue',
        'CREDIT',
        4,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '2f2b501c-c4c7-4691-a444-0c0b6d4a6005',
        'EXPENSE',
        'Expenses',
        'DEBIT',
        5,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

-- CreateIndex
CREATE UNIQUE INDEX "account_classes_code_key" ON "account_classes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "account_classes_name_key" ON "account_classes"("name");

-- CreateIndex
CREATE INDEX "account_classes_sortOrder_idx" ON "account_classes"("sortOrder");

-- CreateIndex
CREATE INDEX "account_groups_companyId_accountClassId_isActive_idx" ON "account_groups"("companyId", "accountClassId", "isActive");

-- CreateIndex
CREATE INDEX "account_groups_companyId_createdAt_idx" ON "account_groups"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "account_groups_companyId_code_key" ON "account_groups"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "account_groups_companyId_name_key" ON "account_groups"("companyId", "name");

-- CreateIndex
CREATE INDEX "ledger_accounts_companyId_accountGroupId_isActive_idx" ON "ledger_accounts"("companyId", "accountGroupId", "isActive");

-- CreateIndex
CREATE INDEX "ledger_accounts_companyId_createdAt_idx" ON "ledger_accounts"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_companyId_code_key" ON "ledger_accounts"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_companyId_name_key" ON "ledger_accounts"("companyId", "name");

-- CreateIndex
CREATE INDEX "particular_accounts_companyId_ledgerAccountId_isActive_idx" ON "particular_accounts"("companyId", "ledgerAccountId", "isActive");

-- CreateIndex
CREATE INDEX "particular_accounts_companyId_createdAt_idx" ON "particular_accounts"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "particular_accounts_companyId_code_key" ON "particular_accounts"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "particular_accounts_companyId_name_key" ON "particular_accounts"("companyId", "name");

-- CreateIndex
CREATE INDEX "vouchers_companyId_status_voucherDate_idx" ON "vouchers"("companyId", "status", "voucherDate");

-- CreateIndex
CREATE INDEX "vouchers_companyId_voucherType_voucherDate_idx" ON "vouchers"("companyId", "voucherType", "voucherDate");

-- CreateIndex
CREATE INDEX "vouchers_companyId_createdAt_idx" ON "vouchers"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "voucher_lines_voucherId_lineNumber_idx" ON "voucher_lines"("voucherId", "lineNumber");

-- CreateIndex
CREATE INDEX "voucher_lines_particularAccountId_idx" ON "voucher_lines"("particularAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_lines_voucherId_lineNumber_key" ON "voucher_lines"("voucherId", "lineNumber");

-- AddForeignKey
ALTER TABLE "account_groups" ADD CONSTRAINT "account_groups_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_groups" ADD CONSTRAINT "account_groups_accountClassId_fkey" FOREIGN KEY ("accountClassId") REFERENCES "account_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_accountGroupId_fkey" FOREIGN KEY ("accountGroupId") REFERENCES "account_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "particular_accounts" ADD CONSTRAINT "particular_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "particular_accounts" ADD CONSTRAINT "particular_accounts_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_lines" ADD CONSTRAINT "voucher_lines_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_lines" ADD CONSTRAINT "voucher_lines_particularAccountId_fkey" FOREIGN KEY ("particularAccountId") REFERENCES "particular_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AccountingConstraints
ALTER TABLE "voucher_lines"
ADD CONSTRAINT "voucher_lines_nonnegative_amounts_check"
CHECK ("debitAmount" >= 0 AND "creditAmount" >= 0);

ALTER TABLE "voucher_lines"
ADD CONSTRAINT "voucher_lines_single_sided_amount_check"
CHECK (
    ("debitAmount" > 0 AND "creditAmount" = 0)
    OR ("creditAmount" > 0 AND "debitAmount" = 0)
);

-- AccountingFunctions
CREATE OR REPLACE FUNCTION "enforce_voucher_line_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_voucher_status "VoucherStatus";
    source_voucher_status "VoucherStatus";
    target_company_id UUID;
    target_particular_company_id UUID;
    target_particular_is_active BOOLEAN;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT "status"
        INTO target_voucher_status
        FROM "vouchers"
        WHERE "id" = OLD."voucherId";

        IF target_voucher_status = 'POSTED' THEN
            RAISE EXCEPTION 'Posted vouchers cannot have lines changed.';
        END IF;

        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD."voucherId" <> NEW."voucherId" THEN
        SELECT "status"
        INTO source_voucher_status
        FROM "vouchers"
        WHERE "id" = OLD."voucherId";

        IF source_voucher_status = 'POSTED' THEN
            RAISE EXCEPTION 'Posted vouchers cannot have lines changed.';
        END IF;
    END IF;

    SELECT
        v."status",
        v."companyId",
        pa."companyId",
        pa."isActive"
    INTO
        target_voucher_status,
        target_company_id,
        target_particular_company_id,
        target_particular_is_active
    FROM "vouchers" v
    JOIN "particular_accounts" pa
        ON pa."id" = NEW."particularAccountId"
    WHERE v."id" = NEW."voucherId";

    IF target_voucher_status IS NULL THEN
        RAISE EXCEPTION 'Voucher line must reference an existing voucher and posting account.';
    END IF;

    IF target_voucher_status = 'POSTED' THEN
        RAISE EXCEPTION 'Posted vouchers cannot have lines changed.';
    END IF;

    IF target_company_id <> target_particular_company_id THEN
        RAISE EXCEPTION 'Voucher lines must use posting accounts from the same company.';
    END IF;

    IF target_particular_is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Voucher lines must use active posting accounts.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_voucher_posting_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    line_count INTEGER;
    total_debit DECIMAL(18,2);
    total_credit DECIMAL(18,2);
    inactive_account_count INTEGER;
BEGIN
    IF OLD."status" = 'POSTED' THEN
        RAISE EXCEPTION 'Posted vouchers cannot be modified.';
    END IF;

    IF NEW."status" = 'POSTED' AND OLD."status" <> 'POSTED' THEN
        SELECT
            COUNT(*),
            COALESCE(SUM("debitAmount"), 0),
            COALESCE(SUM("creditAmount"), 0)
        INTO
            line_count,
            total_debit,
            total_credit
        FROM "voucher_lines"
        WHERE "voucherId" = NEW."id";

        IF line_count = 0 THEN
            RAISE EXCEPTION 'Voucher cannot be posted without at least one line.';
        END IF;

        IF total_debit <> total_credit THEN
            RAISE EXCEPTION 'Voucher cannot be posted because total debit and total credit are not equal.';
        END IF;

        SELECT COUNT(*)
        INTO inactive_account_count
        FROM "voucher_lines" vl
        JOIN "particular_accounts" pa
            ON pa."id" = vl."particularAccountId"
        WHERE vl."voucherId" = NEW."id"
          AND pa."isActive" IS NOT TRUE;

        IF inactive_account_count > 0 THEN
            RAISE EXCEPTION 'Voucher cannot be posted with inactive posting accounts.';
        END IF;

        NEW."postedAt" := COALESCE(NEW."postedAt", CURRENT_TIMESTAMP);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "prevent_posted_voucher_delete"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD."status" = 'POSTED' THEN
        RAISE EXCEPTION 'Posted vouchers cannot be deleted.';
    END IF;

    RETURN OLD;
END;
$$;

-- AccountingTriggers
CREATE TRIGGER "voucher_lines_enforce_rules_trigger"
BEFORE INSERT OR UPDATE OR DELETE ON "voucher_lines"
FOR EACH ROW
EXECUTE FUNCTION "enforce_voucher_line_rules"();

CREATE TRIGGER "vouchers_enforce_posting_rules_trigger"
BEFORE UPDATE ON "vouchers"
FOR EACH ROW
EXECUTE FUNCTION "enforce_voucher_posting_rules"();

CREATE TRIGGER "vouchers_prevent_posted_delete_trigger"
BEFORE DELETE ON "vouchers"
FOR EACH ROW
EXECUTE FUNCTION "prevent_posted_voucher_delete"();
