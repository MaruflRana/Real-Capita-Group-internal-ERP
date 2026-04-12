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
    FROM "payroll_runs" pr
    WHERE pr."id" = p_payroll_run_id
      AND pr."companyId" = p_company_id
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
        COALESCE(SUM(prl."basicAmount"), 0),
        COALESCE(SUM(prl."allowanceAmount"), 0),
        COALESCE(SUM(prl."deductionAmount"), 0),
        COALESCE(SUM(prl."netAmount"), 0)
    INTO
        line_count,
        total_basic,
        total_allowance,
        total_deduction,
        total_net
    FROM "payroll_run_lines" prl
    WHERE prl."payrollRunId" = p_payroll_run_id
      AND prl."companyId" = p_company_id;

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
    FROM "particular_accounts" pa
    WHERE pa."id" = p_expense_particular_account_id;

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
    FROM "particular_accounts" pa
    WHERE pa."id" = p_payable_particular_account_id;

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
        FROM "particular_accounts" pa
        WHERE pa."id" = p_deduction_particular_account_id;

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

    UPDATE "vouchers" v
    SET
        "status" = 'POSTED',
        "postedById" = p_user_id,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE v."id" = target_voucher_id;

    UPDATE "payroll_runs" pr
    SET
        "status" = 'POSTED',
        "postedVoucherId" = target_voucher_id,
        "postedAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE pr."id" = p_payroll_run_id
      AND pr."companyId" = p_company_id;

    RETURN QUERY
    SELECT p_payroll_run_id, target_voucher_id;
END;
$$;
