-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "locationId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_phases" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "phaseId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "blockId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_types" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_statuses" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "phaseId" UUID,
    "blockId" UUID,
    "zoneId" UUID,
    "unitTypeId" UUID NOT NULL,
    "unitStatusId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_companyId_locationId_isActive_idx" ON "projects"("companyId", "locationId", "isActive");

-- CreateIndex
CREATE INDEX "projects_companyId_createdAt_idx" ON "projects"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_companyId_code_key" ON "projects"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "projects_companyId_name_key" ON "projects"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "projects_id_companyId_key" ON "projects"("id", "companyId");

-- CreateIndex
CREATE INDEX "cost_centers_companyId_projectId_isActive_idx" ON "cost_centers"("companyId", "projectId", "isActive");

-- CreateIndex
CREATE INDEX "cost_centers_companyId_createdAt_idx" ON "cost_centers"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_companyId_code_key" ON "cost_centers"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_companyId_name_key" ON "cost_centers"("companyId", "name");

-- CreateIndex
CREATE INDEX "project_phases_projectId_isActive_idx" ON "project_phases"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "project_phases_projectId_createdAt_idx" ON "project_phases"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "project_phases_projectId_code_key" ON "project_phases"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "project_phases_projectId_name_key" ON "project_phases"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "project_phases_id_projectId_key" ON "project_phases"("id", "projectId");

-- CreateIndex
CREATE INDEX "blocks_projectId_phaseId_isActive_idx" ON "blocks"("projectId", "phaseId", "isActive");

-- CreateIndex
CREATE INDEX "blocks_projectId_createdAt_idx" ON "blocks"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_projectId_code_key" ON "blocks"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_projectId_name_key" ON "blocks"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_id_projectId_key" ON "blocks"("id", "projectId");

-- CreateIndex
CREATE INDEX "zones_projectId_blockId_isActive_idx" ON "zones"("projectId", "blockId", "isActive");

-- CreateIndex
CREATE INDEX "zones_projectId_createdAt_idx" ON "zones"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "zones_projectId_code_key" ON "zones"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "zones_projectId_name_key" ON "zones"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "zones_id_projectId_key" ON "zones"("id", "projectId");

-- CreateIndex
CREATE INDEX "unit_types_companyId_isActive_idx" ON "unit_types"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "unit_types_companyId_createdAt_idx" ON "unit_types"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "unit_types_companyId_code_key" ON "unit_types"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "unit_types_companyId_name_key" ON "unit_types"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "unit_statuses_code_key" ON "unit_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "unit_statuses_name_key" ON "unit_statuses"("name");

-- CreateIndex
CREATE INDEX "unit_statuses_sortOrder_idx" ON "unit_statuses"("sortOrder");

-- SeedData
INSERT INTO "unit_statuses" ("id", "code", "name", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
    ('0c84f46d-69eb-4f42-a4bb-90f01fbe7001', 'AVAILABLE', 'Available', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0c84f46d-69eb-4f42-a4bb-90f01fbe7002', 'BOOKED', 'Booked', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0c84f46d-69eb-4f42-a4bb-90f01fbe7003', 'ALLOTTED', 'Allotted', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0c84f46d-69eb-4f42-a4bb-90f01fbe7004', 'SOLD', 'Sold', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0c84f46d-69eb-4f42-a4bb-90f01fbe7005', 'TRANSFERRED', 'Transferred', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('0c84f46d-69eb-4f42-a4bb-90f01fbe7006', 'CANCELLED', 'Cancelled', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "units_projectId_isActive_idx" ON "units"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "units_projectId_phaseId_isActive_idx" ON "units"("projectId", "phaseId", "isActive");

-- CreateIndex
CREATE INDEX "units_projectId_blockId_isActive_idx" ON "units"("projectId", "blockId", "isActive");

-- CreateIndex
CREATE INDEX "units_projectId_zoneId_isActive_idx" ON "units"("projectId", "zoneId", "isActive");

-- CreateIndex
CREATE INDEX "units_projectId_unitTypeId_isActive_idx" ON "units"("projectId", "unitTypeId", "isActive");

-- CreateIndex
CREATE INDEX "units_projectId_unitStatusId_isActive_idx" ON "units"("projectId", "unitStatusId", "isActive");

-- CreateIndex
CREATE INDEX "units_projectId_createdAt_idx" ON "units"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "units_projectId_code_key" ON "units"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_id_companyId_key" ON "locations"("id", "companyId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_locationId_companyId_fkey" FOREIGN KEY ("locationId", "companyId") REFERENCES "locations"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_projectId_companyId_fkey" FOREIGN KEY ("projectId", "companyId") REFERENCES "projects"("id", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_phaseId_projectId_fkey" FOREIGN KEY ("phaseId", "projectId") REFERENCES "project_phases"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_blockId_projectId_fkey" FOREIGN KEY ("blockId", "projectId") REFERENCES "blocks"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_types" ADD CONSTRAINT "unit_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_phaseId_projectId_fkey" FOREIGN KEY ("phaseId", "projectId") REFERENCES "project_phases"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_blockId_projectId_fkey" FOREIGN KEY ("blockId", "projectId") REFERENCES "blocks"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_zoneId_projectId_fkey" FOREIGN KEY ("zoneId", "projectId") REFERENCES "zones"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_unitTypeId_fkey" FOREIGN KEY ("unitTypeId") REFERENCES "unit_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_unitStatusId_fkey" FOREIGN KEY ("unitStatusId") REFERENCES "unit_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
