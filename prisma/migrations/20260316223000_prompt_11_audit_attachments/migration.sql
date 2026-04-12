-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('PENDING_UPLOAD', 'AVAILABLE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('COMPANY', 'USER', 'EMPLOYEE', 'PROJECT', 'UNIT', 'CUSTOMER', 'BOOKING', 'SALE_CONTRACT', 'VOUCHER', 'PAYROLL_RUN');

-- CreateEnum
CREATE TYPE "AuditEventCategory" AS ENUM ('AUTH', 'ADMIN', 'ACCOUNTING', 'CRM_PROPERTY_DESK', 'PAYROLL', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('COMPANY', 'LOCATION', 'DEPARTMENT', 'USER', 'USER_ROLE', 'EMPLOYEE', 'PROJECT', 'UNIT', 'CUSTOMER', 'BOOKING', 'SALE_CONTRACT', 'VOUCHER', 'PAYROLL_RUN', 'ATTACHMENT', 'ATTACHMENT_LINK');

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT,
    "objectEtag" TEXT,
    "uploadedById" UUID NOT NULL,
    "archivedById" UUID,
    "status" "AttachmentStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "uploadCompletedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment_links" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "attachmentId" UUID NOT NULL,
    "entityType" "AttachmentEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "removedById" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "actorUserId" UUID,
    "category" "AuditEventCategory" NOT NULL,
    "eventType" TEXT NOT NULL,
    "targetEntityType" "AuditEntityType",
    "targetEntityId" UUID,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_companyId_status_createdAt_idx" ON "attachments"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "attachments_companyId_uploadedById_createdAt_idx" ON "attachments"("companyId", "uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "attachments_companyId_mimeType_status_idx" ON "attachments"("companyId", "mimeType", "status");

-- CreateIndex
CREATE INDEX "attachments_companyId_originalFileName_idx" ON "attachments"("companyId", "originalFileName");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_id_companyId_key" ON "attachments"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_storageBucket_storageKey_key" ON "attachments"("storageBucket", "storageKey");

-- CreateIndex
CREATE INDEX "attachment_links_companyId_entityType_entityId_isActive_idx" ON "attachment_links"("companyId", "entityType", "entityId", "isActive");

-- CreateIndex
CREATE INDEX "attachment_links_companyId_attachmentId_isActive_idx" ON "attachment_links"("companyId", "attachmentId", "isActive");

-- CreateIndex
CREATE INDEX "attachment_links_companyId_createdById_createdAt_idx" ON "attachment_links"("companyId", "createdById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_links_companyId_attachmentId_entityType_entityId_key" ON "attachment_links"("companyId", "attachmentId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_events_companyId_createdAt_idx" ON "audit_events"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_companyId_category_createdAt_idx" ON "audit_events"("companyId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_companyId_eventType_createdAt_idx" ON "audit_events"("companyId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_companyId_actorUserId_createdAt_idx" ON "audit_events"("companyId", "actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_companyId_targetEntityType_targetEntityId_crea_idx" ON "audit_events"("companyId", "targetEntityType", "targetEntityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_companyId_requestId_idx" ON "audit_events"("companyId", "requestId");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment_links" ADD CONSTRAINT "attachment_links_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment_links" ADD CONSTRAINT "attachment_links_attachmentId_companyId_fkey" FOREIGN KEY ("attachmentId", "companyId") REFERENCES "attachments"("id", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment_links" ADD CONSTRAINT "attachment_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment_links" ADD CONSTRAINT "attachment_links_removedById_fkey" FOREIGN KEY ("removedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "payroll_runs_companyId_costCenterId_payrollYear_payrollMonth_id" RENAME TO "payroll_runs_companyId_costCenterId_payrollYear_payrollMont_idx";
