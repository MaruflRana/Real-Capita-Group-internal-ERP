import {
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import {
  isUniqueConstraintError,
  toConflictException,
} from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { LeaveTypeRecord } from './hr-reference.service';
import { HrReferenceService } from './hr-reference.service';
import type {
  CreateLeaveTypeDto,
  LeaveTypeDto,
  LeaveTypesListQueryDto,
  UpdateLeaveTypeDto,
} from './dto/leave-types.dto';
import {
  normalizeCode,
  normalizeOptionalString,
  normalizeRequiredString,
} from './hr.utils';

const LEAVE_TYPE_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;

@Injectable()
export class LeaveTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: HrReferenceService,
  ) {}

  async listLeaveTypes(companyId: string, query: LeaveTypesListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.LeaveTypeWhereInput = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                code: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(query.sortBy, LEAVE_TYPE_SORT_FIELDS, 'code');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.LeaveTypeOrderByWithRelationInput;
    const [leaveTypes, total] = await Promise.all([
      this.prisma.leaveType.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.leaveType.count({
        where,
      }),
    ]);

    return {
      items: leaveTypes.map((leaveType) => this.mapLeaveType(leaveType)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getLeaveTypeDetail(companyId: string, leaveTypeId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const leaveType = await this.referenceService.getLeaveTypeRecord(
      companyId,
      leaveTypeId,
    );

    return this.mapLeaveType(leaveType);
  }

  async createLeaveType(companyId: string, createLeaveTypeDto: CreateLeaveTypeDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const normalizedInput = {
      code: normalizeCode(createLeaveTypeDto.code),
      name: normalizeRequiredString(createLeaveTypeDto.name),
      description: normalizeOptionalString(createLeaveTypeDto.description) ?? null,
    };

    await this.assertLeaveTypeUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const leaveType = await this.prisma.leaveType.create({
        data: {
          companyId,
          ...normalizedInput,
        },
      });

      return this.mapLeaveType(leaveType);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A leave type with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async updateLeaveType(
    companyId: string,
    leaveTypeId: string,
    updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    const existingLeaveType = await this.referenceService.getLeaveTypeRecord(
      companyId,
      leaveTypeId,
    );
    const normalizedInput = {
      code: normalizeCode(updateLeaveTypeDto.code ?? existingLeaveType.code),
      name: normalizeRequiredString(updateLeaveTypeDto.name ?? existingLeaveType.name),
      description:
        updateLeaveTypeDto.description === undefined
          ? existingLeaveType.description
          : (normalizeOptionalString(updateLeaveTypeDto.description) ?? null),
    };

    await this.assertLeaveTypeUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingLeaveType.id,
    );

    try {
      const leaveType = await this.prisma.leaveType.update({
        where: {
          id: existingLeaveType.id,
        },
        data: normalizedInput,
      });

      return this.mapLeaveType(leaveType);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A leave type with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async setLeaveTypeActiveState(
    companyId: string,
    leaveTypeId: string,
    isActive: boolean,
  ) {
    await this.referenceService.getLeaveTypeRecord(companyId, leaveTypeId);

    const leaveType = await this.prisma.leaveType.update({
      where: {
        id: leaveTypeId,
      },
      data: {
        isActive,
      },
    });

    return this.mapLeaveType(leaveType);
  }

  private async assertLeaveTypeUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredLeaveTypeId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.leaveType.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredLeaveTypeId ? { id: { not: ignoredLeaveTypeId } } : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.leaveType.findFirst({
        where: {
          companyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredLeaveTypeId ? { id: { not: ignoredLeaveTypeId } } : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'A leave type with this code already exists in the company.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A leave type with this name already exists in the company.',
      );
    }
  }

  private mapLeaveType(leaveType: LeaveTypeRecord): LeaveTypeDto {
    return {
      id: leaveType.id,
      companyId: leaveType.companyId,
      code: leaveType.code,
      name: leaveType.name,
      description: leaveType.description,
      isActive: leaveType.isActive,
      createdAt: leaveType.createdAt.toISOString(),
      updatedAt: leaveType.updatedAt.toISOString(),
    };
  }
}
