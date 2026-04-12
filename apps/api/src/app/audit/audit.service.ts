import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  type AuditEventCategory,
  type AuditEntityType,
} from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import type { DatabaseTransactionClient } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';
import type {
  AuditEventDto,
  AuditEventsListQueryDto,
} from './dto/audit-events.dto';

const AUDIT_EVENT_SORT_FIELDS = ['category', 'createdAt', 'eventType'] as const;

type AuditEventRecord = Prisma.AuditEventGetPayload<{
  include: {
    actorUser: {
      select: {
        email: true;
      };
    };
  };
}>;

export interface CreateAuditEventInput {
  companyId: string;
  actorUserId?: string | null | undefined;
  category: AuditEventCategory;
  eventType: string;
  targetEntityType?: AuditEntityType | null | undefined;
  targetEntityId?: string | null | undefined;
  requestId?: string | null | undefined;
  metadata?: Prisma.InputJsonValue | undefined;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(
    input: CreateAuditEventInput,
    transaction?: DatabaseTransactionClient,
  ): Promise<void> {
    const auditClient = transaction ?? this.prisma;

    await auditClient.auditEvent.create({
      data: {
        companyId: input.companyId,
        actorUserId: input.actorUserId ?? null,
        category: input.category,
        eventType: input.eventType,
        targetEntityType: input.targetEntityType ?? null,
        targetEntityId: input.targetEntityId ?? null,
        requestId: input.requestId ?? null,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      },
    });
  }

  async listAuditEvents(companyId: string, query: AuditEventsListQueryDto) {
    await this.assertCompanyExists(companyId);

    const createdAtFilter = this.buildCreatedAtFilter(query.dateFrom, query.dateTo);
    const where: Prisma.AuditEventWhereInput = {
      companyId,
      ...(query.category ? { category: query.category } : {}),
      ...(query.eventType
        ? {
            eventType: {
              equals: query.eventType,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.targetEntityType ? { targetEntityType: query.targetEntityType } : {}),
      ...(query.targetEntityId ? { targetEntityId: query.targetEntityId } : {}),
      ...(query.requestId
        ? {
            requestId: {
              equals: query.requestId,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      ...(query.search
        ? {
            OR: [
              {
                eventType: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                requestId: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                actorUser: {
                  email: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      AUDIT_EVENT_SORT_FIELDS,
      'createdAt',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.AuditEventOrderByWithRelationInput;
    const [auditEvents, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        include: {
          actorUser: {
            select: {
              email: true,
            },
          },
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.auditEvent.count({
        where,
      }),
    ]);

    return {
      items: auditEvents.map((auditEvent) => this.mapAuditEvent(auditEvent)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getAuditEventDetail(companyId: string, auditEventId: string) {
    await this.assertCompanyExists(companyId);

    const auditEvent = await this.prisma.auditEvent.findFirst({
      where: {
        id: auditEventId,
        companyId,
      },
      include: {
        actorUser: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!auditEvent) {
      throw new NotFoundException('Audit event not found.');
    }

    return this.mapAuditEvent(auditEvent);
  }

  private async assertCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }
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

  private mapAuditEvent(auditEvent: AuditEventRecord): AuditEventDto {
    return {
      id: auditEvent.id,
      companyId: auditEvent.companyId,
      category: auditEvent.category,
      eventType: auditEvent.eventType,
      actorUserId: auditEvent.actorUserId,
      actorEmail: auditEvent.actorUser?.email ?? null,
      targetEntityType: auditEvent.targetEntityType,
      targetEntityId: auditEvent.targetEntityId,
      requestId: auditEvent.requestId,
      metadata:
        auditEvent.metadata && typeof auditEvent.metadata === 'object'
          ? (auditEvent.metadata as Record<string, unknown>)
          : null,
      createdAt: auditEvent.createdAt.toISOString(),
    };
  }
}
