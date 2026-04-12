-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED', 'POSTED');

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basicAmount" DECIMAL(18,2) NOT NULL,
    "allowanceAmount" DECIMAL(18,2) NOT NULL,
    "deductionAmount" DECIMAL(18,2) NOT NULL,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "costCenterId" UUID,
    "postedVoucherId" UUID,
    "payrollYear" INTEGER NOT NULL,
    "payrollMonth" INTEGER NOT NULL,
    "description" TEXT,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "finalizedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run_lines" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "payrollRunId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "basicAmount" DECIMAL(18,2) NOT NULL,
    "allowanceAmount" DECIMAL(18,2) NOT NULL,
    "deductionAmount" DECIMAL(18,2) NOT NULL,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_run_lines_pkey" PRIMARY KEY ("id")
);

-- SeedData
INSERT INTO "roles" ("id", "code", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES
    (
        '6a7f5c95-9b33-4b9f-96db-0f27418c6001',
        'company_payroll',
        'Company Payroll',
        'Payroll administration access for salary structures, payroll runs, payroll lines, and payroll posting within the selected company scope.',
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

-- CreateIndex
CREATE INDEX "salary_structures_companyId_isActive_idx" ON "salary_structures"("companyId", "isActive");
CREATE INDEX "salary_structures_companyId_createdAt_idx" ON "salary_structures"("companyId", "createdAt");
CREATE UNIQUE INDEX "salary_structures_id_companyId_key" ON "salary_structures"("id", "companyId");
CREATE UNIQUE INDEX "salary_structures_companyId_code_key" ON "salary_structures"("companyId", "code");
CREATE UNIQUE INDEX "salary_structures_companyId_name_key" ON "salary_structures"("companyId", "name");

CREATE INDEX "payroll_runs_companyId_payrollYear_payrollMonth_status_idx" ON "payroll_runs"("companyId", "payrollYear", "payrollMonth", "status");
CREATE INDEX "payroll_runs_companyId_projectId_payrollYear_payrollMonth_idx" ON "payroll_runs"("companyId", "projectId", "payrollYear", "payrollMonth");
CREATE INDEX "payroll_runs_companyId_costCenterId_payrollYear_payrollMonth_idx" ON "payroll_runs"("companyId", "costCenterId", "payrollYear", "payrollMonth");
CREATE INDEX "payroll_runs_companyId_createdAt_idx" ON "payroll_runs"("companyId", "createdAt");
CREATE UNIQUE INDEX "payroll_runs_id_companyId_key" ON "payroll_runs"("id", "companyId");
CREATE UNIQUE INDEX "payroll_runs_postedVoucherId_companyId_key" ON "payroll_runs"("postedVoucherId", "companyId");

CREATE UNIQUE INDEX "payroll_runs_period_scope_active_key"
ON "payroll_runs"(
    "companyId",
    "payrollYear",
    "payrollMonth",
    COALESCE("projectId", '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE("costCenterId", '00000000-0000-0000-0000-000000000000'::uuid)
)
WHERE "status" <> 'CANCELLED';

CREATE INDEX "payroll_run_lines_companyId_payrollRunId_createdAt_idx" ON "payroll_run_lines"("companyId", "payrollRunId", "createdAt");
CREATE INDEX "payroll_run_lines_companyId_employeeId_createdAt_idx" ON "payroll_run_lines"("companyId", "employeeId", "createdAt");
CREATE UNIQUE INDEX "payroll_run_lines_payrollRunId_employeeId_key" ON "payroll_run_lines"("payrollRunId", "employeeId");

CREATE UNIQUE INDEX "cost_centers_id_companyId_key" ON "cost_centers"("id", "companyId");

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_costCenterId_companyId_fkey" FOREIGN KEY ("costCenterId", "companyId") REFERENCES "cost_centers"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_postedVoucherId_companyId_fkey" FOREIGN KEY ("postedVoucherId", "companyId") REFERENCES "vouchers"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payroll_run_lines" ADD CONSTRAINT "payroll_run_lines_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_run_lines" ADD CONSTRAINT "payroll_run_lines_payrollRunId_companyId_fkey" FOREIGN KEY ("payrollRunId", "companyId") REFERENCES "payroll_runs"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_run_lines" ADD CONSTRAINT "payroll_run_lines_employeeId_companyId_fkey" FOREIGN KEY ("employeeId", "companyId") REFERENCES "employees"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PayrollConstraints
ALTER TABLE "salary_structures"
ADD CONSTRAINT "salary_structures_nonnegative_amounts_check"
CHECK (
    "basicAmount" >= 0
    AND "allowanceAmount" >= 0
    AND "deductionAmount" >= 0
    AND "netAmount" >= 0
);

ALTER TABLE "salary_structures"
ADD CONSTRAINT "salary_structures_positive_gross_check"
CHECK ("basicAmount" + "allowanceAmount" > 0);

ALTER TABLE "salary_structures"
ADD CONSTRAINT "salary_structures_net_amount_check"
CHECK ("netAmount" = ("basicAmount" + "allowanceAmount" - "deductionAmount"));

ALTER TABLE "payroll_runs"
ADD CONSTRAINT "payroll_runs_month_check"
CHECK ("payrollMonth" BETWEEN 1 AND 12);

ALTER TABLE "payroll_runs"
ADD CONSTRAINT "payroll_runs_year_check"
CHECK ("payrollYear" BETWEEN 2000 AND 9999);

ALTER TABLE "payroll_run_lines"
ADD CONSTRAINT "payroll_run_lines_nonnegative_amounts_check"
CHECK (
    "basicAmount" >= 0
    AND "allowanceAmount" >= 0
    AND "deductionAmount" >= 0
    AND "netAmount" >= 0
);

ALTER TABLE "payroll_run_lines"
ADD CONSTRAINT "payroll_run_lines_positive_gross_check"
CHECK ("basicAmount" + "allowanceAmount" > 0);

ALTER TABLE "payroll_run_lines"
ADD CONSTRAINT "payroll_run_lines_net_amount_check"
CHECK ("netAmount" = ("basicAmount" + "allowanceAmount" - "deductionAmount"));

-- PayrollExtensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PayrollFunctions
CREATE OR REPLACE FUNCTION "enforce_payroll_run_scope_consistency"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    linked_cost_center_project_id UUID;
BEGIN
    IF NEW."costCenterId" IS NULL OR NEW."projectId" IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT "projectId"
    INTO linked_cost_center_project_id
    FROM "cost_centers"
    WHERE "id" = NEW."costCenterId"
      AND "companyId" = NEW."companyId";

    IF linked_cost_center_project_id IS NOT NULL
       AND linked_cost_center_project_id <> NEW."projectId"
    THEN
        RAISE EXCEPTION 'The selected cost center must belong to the selected project when both are provided.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_payroll_run_update_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    line_count INTEGER;
    linked_voucher_status "VoucherStatus";
BEGIN
    IF OLD."status" = 'POSTED' THEN
        RAISE EXCEPTION 'Posted payroll runs cannot be modified.';
    END IF;

    IF OLD."status" = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cancelled payroll runs cannot be modified.';
    END IF;

    IF OLD."status" = 'FINALIZED' THEN
        IF NEW."companyId" <> OLD."companyId"
           OR NEW."projectId" IS DISTINCT FROM OLD."projectId"
           OR NEW."costCenterId" IS DISTINCT FROM OLD."costCenterId"
           OR NEW."payrollYear" <> OLD."payrollYear"
           OR NEW."payrollMonth" <> OLD."payrollMonth"
           OR NEW."description" IS DISTINCT FROM OLD."description"
        THEN
            RAISE EXCEPTION 'Finalized payroll runs can only be posted or cancelled.';
        END IF;

        IF NEW."status" NOT IN ('FINALIZED', 'POSTED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Finalized payroll runs can only be posted or cancelled.';
        END IF;
    END IF;

    IF OLD."status" = 'DRAFT' AND NEW."status" = 'POSTED' THEN
        RAISE EXCEPTION 'Payroll runs must be finalized before posting.';
    END IF;

    IF NEW."status" = 'FINALIZED' AND OLD."status" <> 'FINALIZED' THEN
        SELECT COUNT(*)
        INTO line_count
        FROM "payroll_run_lines"
        WHERE "payrollRunId" = NEW."id"
          AND "companyId" = NEW."companyId";

        IF line_count = 0 THEN
            RAISE EXCEPTION 'Payroll runs must contain at least one line before finalization.';
        END IF;

        NEW."finalizedAt" := COALESCE(NEW."finalizedAt", CURRENT_TIMESTAMP);
        NEW."cancelledAt" := NULL;
    END IF;

    IF NEW."status" = 'CANCELLED' AND OLD."status" <> 'CANCELLED' THEN
        NEW."cancelledAt" := COALESCE(NEW."cancelledAt", CURRENT_TIMESTAMP);
    END IF;

    IF NEW."status" <> 'POSTED' AND NEW."postedVoucherId" IS NOT NULL THEN
        RAISE EXCEPTION 'Only posted payroll runs can link to accounting vouchers.';
    END IF;

    IF NEW."status" = 'POSTED' THEN
        IF NEW."postedVoucherId" IS NULL THEN
            RAISE EXCEPTION 'Posted payroll runs must link to a posted voucher.';
        END IF;

        SELECT "status"
        INTO linked_voucher_status
        FROM "vouchers"
        WHERE "id" = NEW."postedVoucherId"
          AND "companyId" = NEW."companyId";

        IF linked_voucher_status <> 'POSTED' THEN
            RAISE EXCEPTION 'Posted payroll runs must link to a posted voucher.';
        END IF;

        NEW."postedAt" := COALESCE(NEW."postedAt", CURRENT_TIMESTAMP);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_payroll_run_line_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    source_run_status "PayrollRunStatus";
    target_run_status "PayrollRunStatus";
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT "status"
        INTO source_run_status
        FROM "payroll_runs"
        WHERE "id" = OLD."payrollRunId"
          AND "companyId" = OLD."companyId";

        IF source_run_status <> 'DRAFT' THEN
            RAISE EXCEPTION 'Only draft payroll runs can have lines changed.';
        END IF;

        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE'
       AND (
            OLD."payrollRunId" <> NEW."payrollRunId"
            OR OLD."companyId" <> NEW."companyId"
       )
    THEN
        SELECT "status"
        INTO source_run_status
        FROM "payroll_runs"
        WHERE "id" = OLD."payrollRunId"
          AND "companyId" = OLD."companyId";

        IF source_run_status <> 'DRAFT' THEN
            RAISE EXCEPTION 'Only draft payroll runs can have lines changed.';
        END IF;
    END IF;

    SELECT "status"
    INTO target_run_status
    FROM "payroll_runs"
    WHERE "id" = NEW."payrollRunId"
      AND "companyId" = NEW."companyId";

    IF target_run_status IS NULL THEN
        RAISE EXCEPTION 'Payroll run line must reference an existing payroll run in the same company.';
    END IF;

    IF target_run_status <> 'DRAFT' THEN
        RAISE EXCEPTION 'Only draft payroll runs can have lines changed.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "post_payroll_run"(
    p_payroll_run_id UUID,
    p_company_id UUID,
    p_user_id UUID,
    p_voucher_date DATE,
    p_expense_particular_account_id UUID,
    p_payable_particular_account_id UUID,
    p_deduction_particular_account_id UUID DEFAULT NULL
)
RETURNS TABLE("payrollRunId" UUID, "voucherId" UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    target_run RECORD;
    expense_account RECORD;
    payable_account RECORD;
    deduction_account RECORD;
    line_count INTEGER;
    total_basic DECIMAL(18,2);
    total_allowance DECIMAL(18,2);
    total_deduction DECIMAL(18,2);
    total_net DECIMAL(18,2);
    total_gross DECIMAL(18,2);
    target_voucher_id UUID := gen_random_uuid();
    voucher_reference TEXT;
    voucher_description TEXT;
BEGIN
    SELECT *
    INTO target_run
    FROM "payroll_runs"
    WHERE "id" = p_payroll_run_id
      AND "companyId" = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payroll run not found.';
    END IF;

    IF target_run."status" <> 'FINALIZED' THEN
        RAISE EXCEPTION 'Only finalized payroll runs can be posted to accounting.';
    END IF;

    IF target_run."postedVoucherId" IS NOT NULL THEN
        RAISE EXCEPTION 'Payroll run is already linked to an accounting voucher.';
    END IF;

    SELECT
        COUNT(*),
        COALESCE(SUM("basicAmount"), 0),
        COALESCE(SUM("allowanceAmount"), 0),
        COALESCE(SUM("deductionAmount"), 0),
        COALESCE(SUM("netAmount"), 0)
    INTO
        line_count,
        total_basic,
        total_allowance,
        total_deduction,
        total_net
    FROM "payroll_run_lines"
    WHERE "payrollRunId" = p_payroll_run_id
      AND "companyId" = p_company_id;

    IF line_count = 0 THEN
        RAISE EXCEPTION 'Payroll run cannot be posted without at least one payroll line.';
    END IF;

    total_gross := total_basic + total_allowance;

    IF total_gross <= 0 THEN
        RAISE EXCEPTION 'Payroll run cannot be posted without a positive gross total.';
    END IF;

    IF total_gross <> total_deduction + total_net THEN
        RAISE EXCEPTION 'Payroll run cannot be posted because total gross does not equal total deductions plus total net.';
    END IF;

    SELECT *
    INTO expense_account
    FROM "particular_accounts"
    WHERE "id" = p_expense_particular_account_id;

    IF expense_account IS NULL THEN
        RAISE EXCEPTION 'Payroll posting expense account not found.';
    END IF;

    IF expense_account."companyId" <> p_company_id THEN
        RAISE EXCEPTION 'Payroll posting accounts must belong to the same company as the payroll run.';
    END IF;

    IF expense_account."isActive" IS NOT TRUE THEN
        RAISE EXCEPTION 'Payroll posting accounts must be active.';
    END IF;

    SELECT *
    INTO payable_account
    FROM "particular_accounts"
    WHERE "id" = p_payable_particular_account_id;

    IF payable_account IS NULL THEN
        RAISE EXCEPTION 'Payroll posting payable account not found.';
    END IF;

    IF payable_account."companyId" <> p_company_id THEN
        RAISE EXCEPTION 'Payroll posting accounts must belong to the same company as the payroll run.';
    END IF;

    IF payable_account."isActive" IS NOT TRUE THEN
        RAISE EXCEPTION 'Payroll posting accounts must be active.';
    END IF;

    IF p_deduction_particular_account_id IS NOT NULL THEN
        SELECT *
        INTO deduction_account
        FROM "particular_accounts"
        WHERE "id" = p_deduction_particular_account_id;

        IF deduction_account IS NULL THEN
            RAISE EXCEPTION 'Payroll posting deduction account not found.';
        END IF;

        IF deduction_account."companyId" <> p_company_id THEN
            RAISE EXCEPTION 'Payroll posting accounts must belong to the same company as the payroll run.';
        END IF;

        IF deduction_account."isActive" IS NOT TRUE THEN
            RAISE EXCEPTION 'Payroll posting accounts must be active.';
        END IF;
    END IF;

    IF total_deduction > 0 AND p_deduction_particular_account_id IS NULL THEN
        RAISE EXCEPTION 'A deduction posting account is required when payroll deductions are present.';
    END IF;

    voucher_reference :=
        'PAYROLL-'
        || target_run."payrollYear"
        || '-'
        || LPAD(target_run."payrollMonth"::text, 2, '0');
    voucher_description := COALESCE(
        target_run."description",
        'Payroll run ' || voucher_reference
    );

    INSERT INTO "vouchers" (
        "id",
        "companyId",
        "createdById",
        "voucherType",
        "status",
        "voucherDate",
        "description",
        "reference",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        target_voucher_id,
        p_company_id,
        p_user_id,
        'JOURNAL',
        'DRAFT',
        p_voucher_date,
        voucher_description,
        voucher_reference,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    INSERT INTO "voucher_lines" (
        "id",
        "voucherId",
        "particularAccountId",
        "lineNumber",
        "description",
        "debitAmount",
        "creditAmount",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        gen_random_uuid(),
        target_voucher_id,
        p_expense_particular_account_id,
        1,
        'Payroll gross expense',
        total_gross,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    IF total_deduction > 0 THEN
        INSERT INTO "voucher_lines" (
            "id",
            "voucherId",
            "particularAccountId",
            "lineNumber",
            "description",
            "debitAmount",
            "creditAmount",
            "createdAt",
            "updatedAt"
        )
        VALUES (
            gen_random_uuid(),
            target_voucher_id,
            p_deduction_particular_account_id,
            2,
            'Payroll deductions payable',
            0,
            total_deduction,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    INSERT INTO "voucher_lines" (
        "id",
        "voucherId",
        "particularAccountId",
        "lineNumber",
        "description",
        "debitAmount",
        "creditAmount",
        "createdAt",
        "updatedAt"
    )
    VALUES (
        gen_random_uuid(),
        target_voucher_id,
        p_payable_particular_account_id,
        CASE WHEN total_deduction > 0 THEN 3 ELSE 2 END,
        'Payroll payable',
        0,
        total_net,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    UPDATE "vouchers"
    SET
        "status" = 'POSTED',
        "postedById" = p_user_id,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = target_voucher_id;

    UPDATE "payroll_runs"
    SET
        "status" = 'POSTED',
        "postedVoucherId" = target_voucher_id,
        "postedAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = p_payroll_run_id
      AND "companyId" = p_company_id;

    RETURN QUERY
    SELECT p_payroll_run_id, target_voucher_id;
END;
$$;

-- PayrollTriggers
CREATE TRIGGER "payroll_runs_enforce_scope_consistency_trigger"
BEFORE INSERT OR UPDATE ON "payroll_runs"
FOR EACH ROW
EXECUTE FUNCTION "enforce_payroll_run_scope_consistency"();

CREATE TRIGGER "payroll_runs_enforce_update_rules_trigger"
BEFORE UPDATE ON "payroll_runs"
FOR EACH ROW
EXECUTE FUNCTION "enforce_payroll_run_update_rules"();

CREATE TRIGGER "payroll_run_lines_enforce_rules_trigger"
BEFORE INSERT OR UPDATE OR DELETE ON "payroll_run_lines"
FOR EACH ROW
EXECUTE FUNCTION "enforce_payroll_run_line_rules"();
