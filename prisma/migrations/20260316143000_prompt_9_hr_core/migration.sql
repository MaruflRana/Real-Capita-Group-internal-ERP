-- CreateEnum
CREATE TYPE "AttendanceLogDirection" AS ENUM ('IN', 'OUT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "departmentId" UUID,
    "locationId" UUID,
    "userId" UUID,
    "managerEmployeeId" UUID,
    "employeeCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_devices" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "locationId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_users" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "attendanceDeviceId" UUID NOT NULL,
    "deviceEmployeeCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "deviceUserId" UUID NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "direction" "AttendanceLogDirection" NOT NULL DEFAULT 'UNKNOWN',
    "externalLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "leaveTypeId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "decisionNote" TEXT,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- SeedData
INSERT INTO "roles" ("id", "code", "name", "description", "isActive", "createdAt", "updatedAt")
VALUES
    (
        '2f33ef1d-56ab-4982-a84c-bc7a31c4130a',
        'company_hr',
        'Company HR',
        'HR administration access for employees, attendance, leave types, and leave requests within the selected company scope.',
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
CREATE INDEX "employees_companyId_departmentId_isActive_idx" ON "employees"("companyId", "departmentId", "isActive");

-- CreateIndex
CREATE INDEX "employees_companyId_locationId_isActive_idx" ON "employees"("companyId", "locationId", "isActive");

-- CreateIndex
CREATE INDEX "employees_companyId_managerEmployeeId_isActive_idx" ON "employees"("companyId", "managerEmployeeId", "isActive");

-- CreateIndex
CREATE INDEX "employees_companyId_createdAt_idx" ON "employees"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "employees_id_companyId_key" ON "employees"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_employeeCode_key" ON "employees"("companyId", "employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_userId_key" ON "employees"("companyId", "userId");

-- CreateIndex
CREATE INDEX "attendance_devices_companyId_locationId_isActive_idx" ON "attendance_devices"("companyId", "locationId", "isActive");

-- CreateIndex
CREATE INDEX "attendance_devices_companyId_createdAt_idx" ON "attendance_devices"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_devices_id_companyId_key" ON "attendance_devices"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_devices_companyId_code_key" ON "attendance_devices"("companyId", "code");

-- CreateIndex
CREATE INDEX "device_users_companyId_employeeId_isActive_idx" ON "device_users"("companyId", "employeeId", "isActive");

-- CreateIndex
CREATE INDEX "device_users_companyId_attendanceDeviceId_isActive_idx" ON "device_users"("companyId", "attendanceDeviceId", "isActive");

-- CreateIndex
CREATE INDEX "device_users_companyId_createdAt_idx" ON "device_users"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "device_users_id_companyId_key" ON "device_users"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "device_users_active_device_employee_code_key"
ON "device_users"("attendanceDeviceId", LOWER("deviceEmployeeCode"))
WHERE "isActive" IS TRUE;

-- CreateIndex
CREATE UNIQUE INDEX "device_users_active_employee_device_key"
ON "device_users"("employeeId", "attendanceDeviceId")
WHERE "isActive" IS TRUE;

-- CreateIndex
CREATE INDEX "attendance_logs_companyId_loggedAt_idx" ON "attendance_logs"("companyId", "loggedAt");

-- CreateIndex
CREATE INDEX "attendance_logs_companyId_deviceUserId_loggedAt_idx" ON "attendance_logs"("companyId", "deviceUserId", "loggedAt");

-- CreateIndex
CREATE INDEX "attendance_logs_companyId_createdAt_idx" ON "attendance_logs"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_id_companyId_key" ON "attendance_logs"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_companyId_externalLogId_key" ON "attendance_logs"("companyId", "externalLogId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_deviceUserId_loggedAt_direction_key" ON "attendance_logs"("deviceUserId", "loggedAt", "direction");

-- CreateIndex
CREATE INDEX "leave_types_companyId_isActive_idx" ON "leave_types"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "leave_types_companyId_createdAt_idx" ON "leave_types"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_id_companyId_key" ON "leave_types"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_companyId_code_key" ON "leave_types"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_companyId_name_key" ON "leave_types"("companyId", "name");

-- CreateIndex
CREATE INDEX "leave_requests_companyId_employeeId_startDate_idx" ON "leave_requests"("companyId", "employeeId", "startDate");

-- CreateIndex
CREATE INDEX "leave_requests_companyId_leaveTypeId_startDate_idx" ON "leave_requests"("companyId", "leaveTypeId", "startDate");

-- CreateIndex
CREATE INDEX "leave_requests_companyId_status_startDate_idx" ON "leave_requests"("companyId", "status", "startDate");

-- CreateIndex
CREATE INDEX "leave_requests_companyId_createdAt_idx" ON "leave_requests"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "leave_requests_id_companyId_key" ON "leave_requests"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_id_companyId_key" ON "departments"("id", "companyId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_companyId_fkey" FOREIGN KEY ("departmentId", "companyId") REFERENCES "departments"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_locationId_companyId_fkey" FOREIGN KEY ("locationId", "companyId") REFERENCES "locations"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_managerEmployeeId_companyId_fkey" FOREIGN KEY ("managerEmployeeId", "companyId") REFERENCES "employees"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_devices" ADD CONSTRAINT "attendance_devices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_devices" ADD CONSTRAINT "attendance_devices_locationId_companyId_fkey" FOREIGN KEY ("locationId", "companyId") REFERENCES "locations"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_users" ADD CONSTRAINT "device_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_users" ADD CONSTRAINT "device_users_employeeId_companyId_fkey" FOREIGN KEY ("employeeId", "companyId") REFERENCES "employees"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_users" ADD CONSTRAINT "device_users_attendanceDeviceId_companyId_fkey" FOREIGN KEY ("attendanceDeviceId", "companyId") REFERENCES "attendance_devices"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_deviceUserId_companyId_fkey" FOREIGN KEY ("deviceUserId", "companyId") REFERENCES "device_users"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employeeId_companyId_fkey" FOREIGN KEY ("employeeId", "companyId") REFERENCES "employees"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leaveTypeId_companyId_fkey" FOREIGN KEY ("leaveTypeId", "companyId") REFERENCES "leave_types"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- HrConstraints
ALTER TABLE "employees"
ADD CONSTRAINT "employees_manager_not_self_check"
CHECK ("managerEmployeeId" IS NULL OR "managerEmployeeId" <> "id");

ALTER TABLE "leave_requests"
ADD CONSTRAINT "leave_requests_date_range_check"
CHECK ("startDate" <= "endDate");

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "leave_requests"
ADD CONSTRAINT "leave_requests_active_overlap_excl"
EXCLUDE USING gist (
    "employeeId" WITH =,
    daterange("startDate", "endDate", '[]') WITH &&
)
WHERE ("status" IN ('SUBMITTED', 'APPROVED'));

-- HrFunctions
CREATE OR REPLACE FUNCTION "enforce_employee_user_company_consistency"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW."userId" IS NULL THEN
        RETURN NEW;
    END IF;

    PERFORM 1
    FROM "user_roles"
    WHERE "userId" = NEW."userId"
      AND "companyId" = NEW."companyId";

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee linked user must already have access to the same company.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "enforce_leave_request_update_rules"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD."status" IN ('APPROVED', 'REJECTED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Processed leave requests cannot be changed.';
    END IF;

    IF OLD."status" = 'SUBMITTED' THEN
        IF
            OLD."companyId" <> NEW."companyId"
            OR OLD."employeeId" <> NEW."employeeId"
            OR OLD."leaveTypeId" <> NEW."leaveTypeId"
            OR OLD."startDate" <> NEW."startDate"
            OR OLD."endDate" <> NEW."endDate"
            OR OLD."reason" IS DISTINCT FROM NEW."reason"
        THEN
            RAISE EXCEPTION 'Submitted leave requests only allow approve, reject, or cancel actions in this phase.';
        END IF;

        IF NEW."status" NOT IN ('APPROVED', 'REJECTED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Submitted leave requests only allow approve, reject, or cancel actions in this phase.';
        END IF;
    END IF;

    IF OLD."status" = 'DRAFT'
       AND NEW."status" NOT IN ('DRAFT', 'SUBMITTED', 'CANCELLED')
    THEN
        RAISE EXCEPTION 'Draft leave requests can only be submitted or cancelled in this phase.';
    END IF;

    RETURN NEW;
END;
$$;

-- HrTriggers
CREATE TRIGGER "employees_enforce_user_company_consistency_trigger"
BEFORE INSERT OR UPDATE ON "employees"
FOR EACH ROW
EXECUTE FUNCTION "enforce_employee_user_company_consistency"();

CREATE TRIGGER "leave_requests_enforce_update_rules_trigger"
BEFORE UPDATE ON "leave_requests"
FOR EACH ROW
EXECUTE FUNCTION "enforce_leave_request_update_rules"();
