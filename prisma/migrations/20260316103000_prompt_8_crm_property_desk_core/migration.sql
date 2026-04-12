-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('ACTIVE', 'CONTRACTED');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "bookingDate" DATE NOT NULL,
    "bookingAmount" DECIMAL(18,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_contracts" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "contractDate" DATE NOT NULL,
    "contractAmount" DECIMAL(18,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installment_schedules" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "saleContractId" UUID NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "voucherId" UUID NOT NULL,
    "bookingId" UUID,
    "saleContractId" UUID,
    "installmentScheduleId" UUID,
    "collectionDate" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- SeedData
INSERT INTO "roles" ("id", "code", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES
    (
        '64aa4b14-0cb4-4d6d-95bc-17d2f45a5002',
        'company_sales',
        'Company Sales',
        'CRM and property desk access for customers, leads, bookings, contracts, schedules, and collections within the selected company scope.',
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
CREATE INDEX "customers_companyId_isActive_idx" ON "customers"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "customers_companyId_createdAt_idx" ON "customers"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "customers_id_companyId_key" ON "customers"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_companyId_email_key" ON "customers"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_companyId_phone_key" ON "customers"("companyId", "phone");

-- CreateIndex
CREATE INDEX "leads_companyId_projectId_status_isActive_idx" ON "leads"("companyId", "projectId", "status", "isActive");

-- CreateIndex
CREATE INDEX "leads_companyId_createdAt_idx" ON "leads"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "leads_id_companyId_key" ON "leads"("id", "companyId");

-- CreateIndex
CREATE INDEX "bookings_companyId_customerId_bookingDate_idx" ON "bookings"("companyId", "customerId", "bookingDate");

-- CreateIndex
CREATE INDEX "bookings_companyId_projectId_bookingDate_idx" ON "bookings"("companyId", "projectId", "bookingDate");

-- CreateIndex
CREATE INDEX "bookings_companyId_unitId_idx" ON "bookings"("companyId", "unitId");

-- CreateIndex
CREATE INDEX "bookings_companyId_status_bookingDate_idx" ON "bookings"("companyId", "status", "bookingDate");

-- CreateIndex
CREATE INDEX "bookings_companyId_createdAt_idx" ON "bookings"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_id_companyId_key" ON "bookings"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_active_unit_key" ON "bookings"("unitId") WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "sale_contracts_companyId_contractDate_idx" ON "sale_contracts"("companyId", "contractDate");

-- CreateIndex
CREATE INDEX "sale_contracts_companyId_createdAt_idx" ON "sale_contracts"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sale_contracts_bookingId_key" ON "sale_contracts"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_contracts_bookingId_companyId_key" ON "sale_contracts"("bookingId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_contracts_id_companyId_key" ON "sale_contracts"("id", "companyId");

-- CreateIndex
CREATE INDEX "installment_schedules_companyId_dueDate_idx" ON "installment_schedules"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "installment_schedules_companyId_createdAt_idx" ON "installment_schedules"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "installment_schedules_saleContractId_sequenceNumber_key" ON "installment_schedules"("saleContractId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "installment_schedules_id_companyId_key" ON "installment_schedules"("id", "companyId");

-- CreateIndex
CREATE INDEX "collections_companyId_customerId_collectionDate_idx" ON "collections"("companyId", "customerId", "collectionDate");

-- CreateIndex
CREATE INDEX "collections_companyId_bookingId_collectionDate_idx" ON "collections"("companyId", "bookingId", "collectionDate");

-- CreateIndex
CREATE INDEX "collections_companyId_saleContractId_collectionDate_idx" ON "collections"("companyId", "saleContractId", "collectionDate");

-- CreateIndex
CREATE INDEX "collections_companyId_installmentScheduleId_collectionDate_idx" ON "collections"("companyId", "installmentScheduleId", "collectionDate");

-- CreateIndex
CREATE INDEX "collections_companyId_createdAt_idx" ON "collections"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "collections_id_companyId_key" ON "collections"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "collections_voucherId_key" ON "collections"("voucherId");

-- CreateIndex
CREATE UNIQUE INDEX "units_id_projectId_key" ON "units"("id", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_id_companyId_key" ON "vouchers"("id", "companyId");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_companyId_fkey" FOREIGN KEY ("customerId", "companyId") REFERENCES "customers"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_unitId_projectId_fkey" FOREIGN KEY ("unitId", "projectId") REFERENCES "units"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_contracts" ADD CONSTRAINT "sale_contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_contracts" ADD CONSTRAINT "sale_contracts_bookingId_companyId_fkey" FOREIGN KEY ("bookingId", "companyId") REFERENCES "bookings"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_schedules" ADD CONSTRAINT "installment_schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_schedules" ADD CONSTRAINT "installment_schedules_saleContractId_companyId_fkey" FOREIGN KEY ("saleContractId", "companyId") REFERENCES "sale_contracts"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_customerId_companyId_fkey" FOREIGN KEY ("customerId", "companyId") REFERENCES "customers"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_voucherId_companyId_fkey" FOREIGN KEY ("voucherId", "companyId") REFERENCES "vouchers"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_bookingId_companyId_fkey" FOREIGN KEY ("bookingId", "companyId") REFERENCES "bookings"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_saleContractId_companyId_fkey" FOREIGN KEY ("saleContractId", "companyId") REFERENCES "sale_contracts"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_installmentScheduleId_companyId_fkey" FOREIGN KEY ("installmentScheduleId", "companyId") REFERENCES "installment_schedules"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PropertyDeskConstraints
ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_booking_amount_positive_check"
CHECK ("bookingAmount" > 0);

ALTER TABLE "sale_contracts"
ADD CONSTRAINT "sale_contracts_contract_amount_positive_check"
CHECK ("contractAmount" > 0);

ALTER TABLE "installment_schedules"
ADD CONSTRAINT "installment_schedules_amount_positive_check"
CHECK ("amount" > 0);

ALTER TABLE "collections"
ADD CONSTRAINT "collections_amount_positive_check"
CHECK ("amount" > 0);

-- PropertyDeskFunctions
CREATE OR REPLACE FUNCTION "enforce_booking_creation_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_unit_status_code TEXT;
    booked_status_id UUID;
    target_project_company_id UUID;
    target_project_is_active BOOLEAN;
    target_unit_is_active BOOLEAN;
    target_customer_is_active BOOLEAN;
BEGIN
    SELECT
        p."companyId",
        p."isActive",
        u."isActive",
        us."code"
    INTO
        target_project_company_id,
        target_project_is_active,
        target_unit_is_active,
        current_unit_status_code
    FROM "units" u
    JOIN "projects" p
        ON p."id" = u."projectId"
    JOIN "unit_statuses" us
        ON us."id" = u."unitStatusId"
    WHERE u."id" = NEW."unitId"
      AND u."projectId" = NEW."projectId"
    FOR UPDATE OF u;

    IF target_project_company_id IS NULL THEN
        RAISE EXCEPTION 'Booking must reference an existing unit within the requested project.';
    END IF;

    IF target_project_company_id <> NEW."companyId" THEN
        RAISE EXCEPTION 'Booking unit and company do not match.';
    END IF;

    IF target_project_is_active IS NOT TRUE OR target_unit_is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Only active units in active projects can be booked.';
    END IF;

    IF current_unit_status_code <> 'AVAILABLE' THEN
        RAISE EXCEPTION 'Only AVAILABLE units can be booked.';
    END IF;

    SELECT "isActive"
    INTO target_customer_is_active
    FROM "customers"
    WHERE "id" = NEW."customerId"
      AND "companyId" = NEW."companyId";

    IF target_customer_is_active IS NULL THEN
        RAISE EXCEPTION 'Booking customer must belong to the requested company.';
    END IF;

    IF target_customer_is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Inactive customers cannot create bookings.';
    END IF;

    SELECT "id"
    INTO booked_status_id
    FROM "unit_statuses"
    WHERE "code" = 'BOOKED'
      AND "isActive" IS TRUE;

    IF booked_status_id IS NULL THEN
        RAISE EXCEPTION 'The fixed BOOKED unit status is unavailable.';
    END IF;

    UPDATE "units"
    SET "unitStatusId" = booked_status_id
    WHERE "id" = NEW."unitId";

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_booking_update_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF
        OLD."companyId" <> NEW."companyId"
        OR OLD."projectId" <> NEW."projectId"
        OR OLD."customerId" <> NEW."customerId"
        OR OLD."unitId" <> NEW."unitId"
        OR OLD."bookingDate" <> NEW."bookingDate"
        OR OLD."bookingAmount" <> NEW."bookingAmount"
    THEN
        RAISE EXCEPTION 'Bookings only allow notes updates in this phase.';
    END IF;

    IF OLD."status" <> NEW."status"
       AND NOT (OLD."status" = 'ACTIVE' AND NEW."status" = 'CONTRACTED')
    THEN
        RAISE EXCEPTION 'Bookings only allow notes updates in this phase.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_sale_contract_creation_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    booking_status "BookingStatus";
    booking_unit_id UUID;
    current_unit_status_code TEXT;
    sold_status_id UUID;
BEGIN
    SELECT
        b."status",
        b."unitId",
        us."code"
    INTO
        booking_status,
        booking_unit_id,
        current_unit_status_code
    FROM "bookings" b
    JOIN "units" u
        ON u."id" = b."unitId"
    JOIN "unit_statuses" us
        ON us."id" = u."unitStatusId"
    WHERE b."id" = NEW."bookingId"
      AND b."companyId" = NEW."companyId"
    FOR UPDATE OF b, u;

    IF booking_status IS NULL THEN
        RAISE EXCEPTION 'Sale contract must reference an existing booking in the requested company.';
    END IF;

    IF booking_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Sale contract can only be created from an active booking.';
    END IF;

    IF current_unit_status_code <> 'BOOKED' THEN
        RAISE EXCEPTION 'Sale contract creation requires the linked unit to be BOOKED.';
    END IF;

    SELECT "id"
    INTO sold_status_id
    FROM "unit_statuses"
    WHERE "code" = 'SOLD'
      AND "isActive" IS TRUE;

    IF sold_status_id IS NULL THEN
        RAISE EXCEPTION 'The fixed SOLD unit status is unavailable.';
    END IF;

    UPDATE "units"
    SET "unitStatusId" = sold_status_id
    WHERE "id" = booking_unit_id;

    UPDATE "bookings"
    SET "status" = 'CONTRACTED'
    WHERE "id" = NEW."bookingId";

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_sale_contract_update_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF
        OLD."companyId" <> NEW."companyId"
        OR OLD."bookingId" <> NEW."bookingId"
        OR OLD."contractDate" <> NEW."contractDate"
        OR OLD."contractAmount" <> NEW."contractAmount"
    THEN
        RAISE EXCEPTION 'Sale contracts only allow reference and notes updates in this phase.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_installment_schedule_mutation_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "collections"
        WHERE "installmentScheduleId" = OLD."id"
    ) THEN
        RAISE EXCEPTION 'Installment schedules with linked collections cannot be changed.';
    END IF;

    IF TG_OP = 'UPDATE'
       AND (
           OLD."companyId" <> NEW."companyId"
           OR OLD."saleContractId" <> NEW."saleContractId"
       )
    THEN
        RAISE EXCEPTION 'Installment schedules cannot be moved between contracts.';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_collection_linkage_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    voucher_status "VoucherStatus";
    resolved_booking_id UUID;
    booking_customer_id UUID;
    contract_booking_id UUID;
    schedule_contract_id UUID;
BEGIN
    SELECT "status"
    INTO voucher_status
    FROM "vouchers"
    WHERE "id" = NEW."voucherId"
      AND "companyId" = NEW."companyId";

    IF voucher_status IS NULL THEN
        RAISE EXCEPTION 'Collection must reference a voucher from the same company.';
    END IF;

    IF voucher_status <> 'POSTED' THEN
        RAISE EXCEPTION 'Collection must reference a posted voucher.';
    END IF;

    PERFORM 1
    FROM "customers"
    WHERE "id" = NEW."customerId"
      AND "companyId" = NEW."companyId";

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Collection must reference a customer from the same company.';
    END IF;

    resolved_booking_id := NEW."bookingId";

    IF NEW."saleContractId" IS NOT NULL THEN
        SELECT "bookingId"
        INTO contract_booking_id
        FROM "sale_contracts"
        WHERE "id" = NEW."saleContractId"
          AND "companyId" = NEW."companyId";

        IF contract_booking_id IS NULL THEN
            RAISE EXCEPTION 'Collection sale contract must belong to the same company.';
        END IF;

        IF resolved_booking_id IS NOT NULL
           AND resolved_booking_id <> contract_booking_id
        THEN
            RAISE EXCEPTION 'Collection booking and sale contract do not match.';
        END IF;

        resolved_booking_id := contract_booking_id;
    END IF;

    IF NEW."installmentScheduleId" IS NOT NULL THEN
        SELECT "saleContractId"
        INTO schedule_contract_id
        FROM "installment_schedules"
        WHERE "id" = NEW."installmentScheduleId"
          AND "companyId" = NEW."companyId";

        IF schedule_contract_id IS NULL THEN
            RAISE EXCEPTION 'Collection installment schedule must belong to the same company.';
        END IF;

        IF NEW."saleContractId" IS NOT NULL
           AND NEW."saleContractId" <> schedule_contract_id
        THEN
            RAISE EXCEPTION 'Collection sale contract and installment schedule do not match.';
        END IF;

        IF NEW."saleContractId" IS NULL THEN
            SELECT "bookingId"
            INTO contract_booking_id
            FROM "sale_contracts"
            WHERE "id" = schedule_contract_id
              AND "companyId" = NEW."companyId";

            IF contract_booking_id IS NULL THEN
                RAISE EXCEPTION 'Collection installment schedule contract must belong to the same company.';
            END IF;
        END IF;

        IF resolved_booking_id IS NOT NULL
           AND contract_booking_id IS NOT NULL
           AND resolved_booking_id <> contract_booking_id
        THEN
            RAISE EXCEPTION 'Collection booking and installment schedule do not match.';
        END IF;

        IF resolved_booking_id IS NULL THEN
            resolved_booking_id := contract_booking_id;
        END IF;
    END IF;

    IF resolved_booking_id IS NOT NULL THEN
        SELECT "customerId"
        INTO booking_customer_id
        FROM "bookings"
        WHERE "id" = resolved_booking_id
          AND "companyId" = NEW."companyId";

        IF booking_customer_id IS NULL THEN
            RAISE EXCEPTION 'Collection booking must belong to the same company.';
        END IF;

        IF booking_customer_id <> NEW."customerId" THEN
            RAISE EXCEPTION 'Collection customer does not match the referenced property transaction.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- PropertyDeskTriggers
CREATE TRIGGER "bookings_enforce_creation_rules_trigger"
BEFORE INSERT ON "bookings"
FOR EACH ROW
EXECUTE FUNCTION "enforce_booking_creation_rules"();

CREATE TRIGGER "bookings_enforce_update_rules_trigger"
BEFORE UPDATE ON "bookings"
FOR EACH ROW
EXECUTE FUNCTION "enforce_booking_update_rules"();

CREATE TRIGGER "sale_contracts_enforce_creation_rules_trigger"
BEFORE INSERT ON "sale_contracts"
FOR EACH ROW
EXECUTE FUNCTION "enforce_sale_contract_creation_rules"();

CREATE TRIGGER "sale_contracts_enforce_update_rules_trigger"
BEFORE UPDATE ON "sale_contracts"
FOR EACH ROW
EXECUTE FUNCTION "enforce_sale_contract_update_rules"();

CREATE TRIGGER "installment_schedules_enforce_mutation_rules_trigger"
BEFORE UPDATE OR DELETE ON "installment_schedules"
FOR EACH ROW
EXECUTE FUNCTION "enforce_installment_schedule_mutation_rules"();

CREATE TRIGGER "collections_enforce_linkage_rules_trigger"
BEFORE INSERT OR UPDATE ON "collections"
FOR EACH ROW
EXECUTE FUNCTION "enforce_collection_linkage_rules"();
