import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttachmentStatus, Prisma } from '@prisma/client';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
import { ROLE_COMPANY_ADMIN } from '../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AttachmentEntityReferenceService } from './attachment-entity-reference.service';
import {
  ATTACHMENT_DOWNLOAD_URL_TTL_SECONDS,
  ATTACHMENT_SORT_FIELDS,
  ATTACHMENT_UPLOAD_URL_TTL_SECONDS,
} from './attachments.constants';
import type {
  AttachmentDetailDto,
  AttachmentDownloadAccessDto,
  AttachmentLinkDto,
  AttachmentSummaryDto,
  AttachmentsListQueryDto,
  CreateAttachmentLinkDto,
  CreateAttachmentUploadIntentDto,
} from './dto/attachments.dto';

type AttachmentRecord = Prisma.AttachmentGetPayload<{
  include: {
    uploadedBy: {
      select: {
        email: true;
      };
    };
    archivedBy: {
      select: {
        email: true;
      };
    };
    links: {
      include: {
        createdBy: {
          select: {
            email: true;
          };
        };
        removedBy: {
          select: {
            email: true;
          };
        };
      };
      orderBy: {
        createdAt: 'asc';
      };
    };
  };
}>;

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly entityReferenceService: AttachmentEntityReferenceService,
  ) {}

  async listAttachments(
    companyId: string,
    authenticatedUser: AuthenticatedUser,
    query: AttachmentsListQueryDto,
  ) {
    await this.entityReferenceService.assertCompanyExists(companyId);
    await this.assertListQueryAccess(companyId, authenticatedUser, query);

    const where = this.buildListWhere(companyId, authenticatedUser, query);
    const sortField = resolveSortField(
      query.sortBy,
      ATTACHMENT_SORT_FIELDS,
      'createdAt',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.AttachmentOrderByWithRelationInput;
    const [attachments, total] = await Promise.all([
      this.prisma.attachment.findMany({
        where,
        include: this.attachmentInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.attachment.count({
        where,
      }),
    ]);

    return {
      items: attachments.map((attachment) => this.mapAttachmentSummary(attachment)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getAttachmentDetail(
    companyId: string,
    attachmentId: string,
    authenticatedUser: AuthenticatedUser,
  ): Promise<AttachmentDetailDto> {
    const attachment = await this.getAttachmentRecord(companyId, attachmentId);

    this.assertAttachmentReadable(authenticatedUser, attachment);

    return this.mapAttachmentDetail(attachment);
  }

  async createAttachmentUploadIntent(
    companyId: string,
    authenticatedUser: AuthenticatedUser,
    requestId: string | undefined,
    createAttachmentUploadIntentDto: CreateAttachmentUploadIntentDto,
  ) {
    await this.entityReferenceService.assertCompanyExists(companyId);
    await this.storageService.ensureBucketExists();

    const normalizedFileName = createAttachmentUploadIntentDto.originalFileName.trim();
    const normalizedMimeType = createAttachmentUploadIntentDto.mimeType.trim().toLowerCase();
    const sizeBytes = this.parseSizeBytes(createAttachmentUploadIntentDto.sizeBytes);
    const expiresAt = new Date(
      Date.now() + ATTACHMENT_UPLOAD_URL_TTL_SECONDS * 1000,
    );

    const attachment = await this.databaseService.withTransaction(async (transaction) => {
      const createdAttachment = await transaction.attachment.create({
        data: {
          companyId,
          storageBucket: this.storageService.getBucketName(),
          storageKey: this.buildStorageKey(companyId, normalizedFileName),
          originalFileName: normalizedFileName,
          mimeType: normalizedMimeType,
          sizeBytes,
          checksumSha256: createAttachmentUploadIntentDto.checksumSha256 ?? null,
          uploadedById: authenticatedUser.id,
        },
        include: this.attachmentInclude,
      });

      await this.auditService.recordEvent(
        {
          companyId,
          actorUserId: authenticatedUser.id,
          category: 'ATTACHMENT',
          eventType: AUDIT_EVENT_TYPES.attachmentUploadInitiated,
          targetEntityType: 'ATTACHMENT',
          targetEntityId: createdAttachment.id,
          requestId,
          metadata: {
            originalFileName: normalizedFileName,
            mimeType: normalizedMimeType,
            sizeBytes: sizeBytes.toString(),
            storageKey: createdAttachment.storageKey,
          },
        },
        transaction,
      );

      return createdAttachment;
    });

    const uploadUrl = await this.storageService.createPresignedUploadUrl({
      key: attachment.storageKey,
      contentType: attachment.mimeType,
      expiresInSeconds: ATTACHMENT_UPLOAD_URL_TTL_SECONDS,
    });

    return {
      attachment: this.mapAttachmentDetail(attachment),
      uploadMethod: 'PUT',
      uploadUrl,
      requiredHeaders: {
        'Content-Type': attachment.mimeType,
      },
      expiresAt: expiresAt.toISOString(),
    };
  }

  async finalizeAttachmentUpload(
    companyId: string,
    attachmentId: string,
    authenticatedUser: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<AttachmentDetailDto> {
    const attachment = await this.getAttachmentRecord(companyId, attachmentId);

    this.assertAttachmentReadable(authenticatedUser, attachment);

    if (attachment.status === AttachmentStatus.ARCHIVED) {
      throw new BadRequestException('Archived attachments cannot be finalized.');
    }

    if (attachment.status === AttachmentStatus.AVAILABLE) {
      return this.mapAttachmentDetail(attachment);
    }

    const objectMetadata = await this.getStorageObjectMetadata(attachment.storageKey);

    if (BigInt(objectMetadata.contentLength) !== attachment.sizeBytes) {
      throw new BadRequestException(
        'Uploaded object size does not match the attachment metadata.',
      );
    }

    if (
      objectMetadata.contentType &&
      objectMetadata.contentType.toLowerCase() !== attachment.mimeType.toLowerCase()
    ) {
      throw new BadRequestException(
        'Uploaded object content type does not match the attachment metadata.',
      );
    }

    await this.databaseService.withTransaction(async (transaction) => {
      await transaction.attachment.update({
        where: {
          id: attachment.id,
        },
        data: {
          status: AttachmentStatus.AVAILABLE,
          uploadCompletedAt: new Date(),
          objectEtag: objectMetadata.objectEtag,
        },
      });

      await this.auditService.recordEvent(
        {
          companyId,
          actorUserId: authenticatedUser.id,
          category: 'ATTACHMENT',
          eventType: AUDIT_EVENT_TYPES.attachmentUploadFinalized,
          targetEntityType: 'ATTACHMENT',
          targetEntityId: attachment.id,
          requestId,
          metadata: {
            objectEtag: objectMetadata.objectEtag,
            storageKey: attachment.storageKey,
          },
        },
        transaction,
      );
    });

    return this.getAttachmentDetail(companyId, attachmentId, authenticatedUser);
  }

  async createAttachmentLink(
    companyId: string,
    attachmentId: string,
    authenticatedUser: AuthenticatedUser,
    requestId: string | undefined,
    createAttachmentLinkDto: CreateAttachmentLinkDto,
  ): Promise<AttachmentDetailDto> {
    this.entityReferenceService.assertEntityAccess(
      authenticatedUser,
      createAttachmentLinkDto.entityType,
    );
    await this.entityReferenceService.assertEntityReference(
      companyId,
      createAttachmentLinkDto.entityType,
      createAttachmentLinkDto.entityId,
    );

    const attachment = await this.getAttachmentRecord(companyId, attachmentId);

    this.assertAttachmentManageable(authenticatedUser, attachment);

    if (attachment.status !== AttachmentStatus.AVAILABLE) {
      throw new BadRequestException(
        'Attachment links can only be created for finalized available attachments.',
      );
    }

    await this.databaseService.withTransaction(async (transaction) => {
      const existingLink = await transaction.attachmentLink.findUnique({
        where: {
          companyId_attachmentId_entityType_entityId: {
            companyId,
            attachmentId,
            entityType: createAttachmentLinkDto.entityType,
            entityId: createAttachmentLinkDto.entityId,
          },
        },
      });

      const link =
        existingLink?.isActive
          ? existingLink
          : existingLink
            ? await transaction.attachmentLink.update({
                where: {
                  id: existingLink.id,
                },
                data: {
                  isActive: true,
                  removedAt: null,
                  removedById: null,
                },
              })
            : await transaction.attachmentLink.create({
                data: {
                  companyId,
                  attachmentId,
                  entityType: createAttachmentLinkDto.entityType,
                  entityId: createAttachmentLinkDto.entityId,
                  createdById: authenticatedUser.id,
                },
              });

      if (!existingLink?.isActive) {
        await this.auditService.recordEvent(
          {
            companyId,
            actorUserId: authenticatedUser.id,
            category: 'ATTACHMENT',
            eventType: AUDIT_EVENT_TYPES.attachmentLinked,
            targetEntityType: 'ATTACHMENT_LINK',
            targetEntityId: link.id,
            requestId,
            metadata: {
              attachmentId,
              entityType: createAttachmentLinkDto.entityType,
              entityId: createAttachmentLinkDto.entityId,
            },
          },
          transaction,
        );
      }
    });

    return this.getAttachmentDetail(companyId, attachmentId, authenticatedUser);
  }

  async removeAttachmentLink(
    companyId: string,
    attachmentId: string,
    attachmentLinkId: string,
    authenticatedUser: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<AttachmentDetailDto> {
    const attachment = await this.getAttachmentRecord(companyId, attachmentId);

    this.assertAttachmentManageable(authenticatedUser, attachment);

    const attachmentLink = attachment.links.find((link) => link.id === attachmentLinkId);

    if (!attachmentLink) {
      throw new NotFoundException('Attachment link not found.');
    }

    if (!attachmentLink.isActive) {
      throw new BadRequestException('Attachment link is already inactive.');
    }

    await this.databaseService.withTransaction(async (transaction) => {
      await transaction.attachmentLink.update({
        where: {
          id: attachmentLink.id,
        },
        data: {
          isActive: false,
          removedAt: new Date(),
          removedById: authenticatedUser.id,
        },
      });

      await this.auditService.recordEvent(
        {
          companyId,
          actorUserId: authenticatedUser.id,
          category: 'ATTACHMENT',
          eventType: AUDIT_EVENT_TYPES.attachmentLinkRemoved,
          targetEntityType: 'ATTACHMENT_LINK',
          targetEntityId: attachmentLink.id,
          requestId,
          metadata: {
            attachmentId,
            entityType: attachmentLink.entityType,
            entityId: attachmentLink.entityId,
          },
        },
        transaction,
      );
    });

    return this.getAttachmentDetail(companyId, attachmentId, authenticatedUser);
  }

  async archiveAttachment(
    companyId: string,
    attachmentId: string,
    authenticatedUser: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<AttachmentDetailDto> {
    const attachment = await this.getAttachmentRecord(companyId, attachmentId);

    this.assertAttachmentManageable(authenticatedUser, attachment);

    if (attachment.status === AttachmentStatus.ARCHIVED) {
      return this.mapAttachmentDetail(attachment);
    }

    await this.databaseService.withTransaction(async (transaction) => {
      await transaction.attachment.update({
        where: {
          id: attachment.id,
        },
        data: {
          status: AttachmentStatus.ARCHIVED,
          archivedAt: new Date(),
          archivedById: authenticatedUser.id,
        },
      });

      await this.auditService.recordEvent(
        {
          companyId,
          actorUserId: authenticatedUser.id,
          category: 'ATTACHMENT',
          eventType: AUDIT_EVENT_TYPES.attachmentArchived,
          targetEntityType: 'ATTACHMENT',
          targetEntityId: attachment.id,
          requestId,
          metadata: {
            storageKey: attachment.storageKey,
          },
        },
        transaction,
      );
    });

    return this.getAttachmentDetail(companyId, attachmentId, authenticatedUser);
  }

  async createAttachmentDownloadAccess(
    companyId: string,
    attachmentId: string,
    authenticatedUser: AuthenticatedUser,
  ): Promise<AttachmentDownloadAccessDto> {
    const attachment = await this.getAttachmentRecord(companyId, attachmentId);

    this.assertAttachmentReadable(authenticatedUser, attachment);

    if (attachment.status !== AttachmentStatus.AVAILABLE) {
      throw new BadRequestException(
        'Secure download access is available only for finalized attachments.',
      );
    }

    const expiresAt = new Date(
      Date.now() + ATTACHMENT_DOWNLOAD_URL_TTL_SECONDS * 1000,
    );
    const downloadUrl = await this.storageService.createPresignedDownloadUrl({
      key: attachment.storageKey,
      contentDispositionFileName: attachment.originalFileName,
      expiresInSeconds: ATTACHMENT_DOWNLOAD_URL_TTL_SECONDS,
    });

    return {
      attachmentId: attachment.id,
      fileName: attachment.originalFileName,
      mimeType: attachment.mimeType,
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private readonly attachmentInclude = {
    uploadedBy: {
      select: {
        email: true,
      },
    },
    archivedBy: {
      select: {
        email: true,
      },
    },
    links: {
      include: {
        createdBy: {
          select: {
            email: true,
          },
        },
        removedBy: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    },
  } satisfies Prisma.AttachmentInclude;

  private async assertListQueryAccess(
    companyId: string,
    authenticatedUser: AuthenticatedUser,
    query: AttachmentsListQueryDto,
  ): Promise<void> {
    if (Boolean(query.entityType) !== Boolean(query.entityId)) {
      throw new BadRequestException(
        'entityType and entityId must be provided together when filtering attachments by linked entity.',
      );
    }

    if (query.entityType && query.entityId) {
      this.entityReferenceService.assertEntityAccess(
        authenticatedUser,
        query.entityType,
      );
      await this.entityReferenceService.assertEntityReference(
        companyId,
        query.entityType,
        query.entityId,
      );
    }

    if (
      !authenticatedUser.roles.includes(ROLE_COMPANY_ADMIN) &&
      (!query.entityType || !query.entityId)
    ) {
      throw new BadRequestException(
        'Non-admin attachment listing requires an explicit entityType and entityId filter.',
      );
    }
  }

  private buildListWhere(
    companyId: string,
    authenticatedUser: AuthenticatedUser,
    query: AttachmentsListQueryDto,
  ): Prisma.AttachmentWhereInput {
    const createdAtFilter = this.buildCreatedAtFilter(query.dateFrom, query.dateTo);
    const where: Prisma.AttachmentWhereInput = {
      companyId,
      ...(query.status ? { status: query.status } : {}),
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      ...(query.mimeType
        ? {
            mimeType: {
              equals: query.mimeType.trim().toLowerCase(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.uploadedByUserId ? { uploadedById: query.uploadedByUserId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                originalFileName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                storageKey: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.entityType && query.entityId
        ? {
            links: {
              some: {
                entityType: query.entityType,
                entityId: query.entityId,
                isActive: true,
              },
            },
          }
        : {}),
    };

    if (authenticatedUser.roles.includes(ROLE_COMPANY_ADMIN)) {
      return where;
    }

    const accessibleEntityTypes =
      this.entityReferenceService.getAccessibleEntityTypes(authenticatedUser);

    return {
      AND: [
        where,
        {
          links: {
            every: {
              OR: [
                {
                  isActive: false,
                },
                {
                  entityType: {
                    in: accessibleEntityTypes,
                  },
                },
              ],
            },
          },
        },
      ],
    };
  }

  private async getAttachmentRecord(
    companyId: string,
    attachmentId: string,
  ): Promise<AttachmentRecord> {
    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        companyId,
      },
      include: this.attachmentInclude,
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found.');
    }

    return attachment;
  }

  private assertAttachmentReadable(
    authenticatedUser: AuthenticatedUser,
    attachment: AttachmentRecord,
  ): void {
    if (authenticatedUser.roles.includes(ROLE_COMPANY_ADMIN)) {
      return;
    }

    const activeLinks = attachment.links.filter((link) => link.isActive);

    if (activeLinks.length === 0) {
      if (attachment.uploadedById === authenticatedUser.id) {
        return;
      }

      throw new ForbiddenException(
        'You do not have access to the requested attachment.',
      );
    }

    const accessibleEntityTypes = new Set(
      this.entityReferenceService.getAccessibleEntityTypes(authenticatedUser),
    );

    if (activeLinks.every((link) => accessibleEntityTypes.has(link.entityType))) {
      return;
    }

    throw new ForbiddenException(
      'You do not have access to the requested attachment.',
    );
  }

  private assertAttachmentManageable(
    authenticatedUser: AuthenticatedUser,
    attachment: AttachmentRecord,
  ): void {
    this.assertAttachmentReadable(authenticatedUser, attachment);
  }

  private async getStorageObjectMetadata(key: string) {
    try {
      const objectMetadata = await this.storageService.headObject(key);

      if (objectMetadata.ContentLength === undefined) {
        throw new BadRequestException(
          'Uploaded object size could not be verified from storage.',
        );
      }

      return {
        contentLength: objectMetadata.ContentLength,
        contentType: objectMetadata.ContentType ?? null,
        objectEtag: objectMetadata.ETag?.replace(/"/g, '') ?? null,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Uploaded object was not found in storage. Complete the direct upload before finalization.',
      );
    }
  }

  private parseSizeBytes(value: string): bigint {
    const parsedValue = BigInt(value);

    if (parsedValue <= 0n) {
      throw new BadRequestException('sizeBytes must be greater than zero.');
    }

    return parsedValue;
  }

  private buildStorageKey(companyId: string, originalFileName: string): string {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const safeFileName =
      originalFileName
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 120) || 'file';

    return `attachments/${companyId}/${datePrefix}/${randomUUID()}-${safeFileName}`;
  }

  private mapAttachmentSummary(attachment: AttachmentRecord): AttachmentSummaryDto {
    return {
      id: attachment.id,
      companyId: attachment.companyId,
      storageBucket: attachment.storageBucket,
      storageKey: attachment.storageKey,
      originalFileName: attachment.originalFileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes.toString(),
      checksumSha256: attachment.checksumSha256,
      objectEtag: attachment.objectEtag,
      uploadedById: attachment.uploadedById,
      uploadedByEmail: attachment.uploadedBy.email,
      archivedById: attachment.archivedById,
      archivedByEmail: attachment.archivedBy?.email ?? null,
      status: attachment.status,
      activeLinkCount: attachment.links.filter((link) => link.isActive).length,
      links: attachment.links.map((link) => this.mapAttachmentLink(link)),
      uploadCompletedAt: attachment.uploadCompletedAt?.toISOString() ?? null,
      archivedAt: attachment.archivedAt?.toISOString() ?? null,
      createdAt: attachment.createdAt.toISOString(),
      updatedAt: attachment.updatedAt.toISOString(),
    };
  }

  private mapAttachmentDetail(attachment: AttachmentRecord): AttachmentDetailDto {
    return this.mapAttachmentSummary(attachment);
  }

  private mapAttachmentLink(
    attachmentLink: AttachmentRecord['links'][number],
  ): AttachmentLinkDto {
    return {
      id: attachmentLink.id,
      companyId: attachmentLink.companyId,
      attachmentId: attachmentLink.attachmentId,
      entityType: attachmentLink.entityType,
      entityId: attachmentLink.entityId,
      createdById: attachmentLink.createdById,
      createdByEmail: attachmentLink.createdBy.email,
      removedById: attachmentLink.removedById,
      removedByEmail: attachmentLink.removedBy?.email ?? null,
      isActive: attachmentLink.isActive,
      removedAt: attachmentLink.removedAt?.toISOString() ?? null,
      createdAt: attachmentLink.createdAt.toISOString(),
      updatedAt: attachmentLink.updatedAt.toISOString(),
    };
  }

  private buildCreatedAtFilter(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) {
      return undefined;
    }

    const gte = dateFrom
      ? this.parseCalendarDateBoundary(dateFrom, 'start')
      : undefined;
    const lte = dateTo ? this.parseCalendarDateBoundary(dateTo, 'end') : undefined;

    if (gte && lte && gte > lte) {
      throw new BadRequestException('dateFrom must be less than or equal to dateTo.');
    }

    return {
      ...(gte ? { gte } : {}),
      ...(lte ? { lte } : {}),
    };
  }

  private parseCalendarDateBoundary(
    value: string,
    boundary: 'start' | 'end',
  ): Date {
    const suffix =
      boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z';
    const parsedDate = new Date(`${value}${suffix}`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(
        `${boundary === 'start' ? 'dateFrom' : 'dateTo'} must be a valid calendar date.`,
      );
    }

    return parsedDate;
  }
}
