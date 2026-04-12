import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type LeaveRequestStatus } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import {
  extractDatabaseErrorMessage,
  isUniqueConstraintError,
} from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { LeaveRequestRecord } from './hr-reference.service';
import { HrReferenceService } from './hr-reference.service';
import type {
  CreateLeaveRequestDto,
  LeaveRequestActionDto,
  LeaveRequestDto,
  LeaveRequestsListQueryDto,
  UpdateLeaveRequestDto,
} from './dto/leave-requests.dto';
import {
  normalizeOptionalString,
  parseCalendarDate,
} from './hr.utils';

const LEAVE_REQUEST_SORT_FIELDS = [
  'createdAt',
  'endDate',
  'startDate',
  'status',
  'updatedAt',
] as const;

@Injectable()
export class LeaveRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: HrReferenceService,
  ) {}

  async listLeaveRequests(companyId: string, query: LeaveRequestsListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const overlappingDateFilter = this.buildLeaveDateRangeWhere(
      query.dateFrom,
      query.dateTo,
    );
    const where: Prisma.LeaveRequestWhereInput = {
      companyId,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.leaveTypeId ? { leaveTypeId: query.leaveTypeId } : {}),
      ...(query.departmentId
        ? {
            employee: {
              departmentId: query.departmentId,
            },
          }
        : {}),
      ...(query.locationId
        ? {
            employee: {
              locationId: query.locationId,
            },
          }
        : {}),
      ...(query.status ? { status: query.status as LeaveRequestStatus } : {}),
      ...(overlappingDateFilter ?? {}),
      ...(query.search
        ? {
            OR: [
              {
                reason: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                decisionNote: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                employee: {
                  employeeCode: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                employee: {
                  fullName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                leaveType: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                leaveType: {
                  name: {
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
      LEAVE_REQUEST_SORT_FIELDS,
      'startDate',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.LeaveRequestOrderByWithRelationInput;
    const [leaveRequests, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        include: this.leaveRequestInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.leaveRequest.count({
        where,
      }),
    ]);

    return {
      items: leaveRequests.map((leaveRequest) =>
        this.mapLeaveRequest(leaveRequest),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getLeaveRequestDetail(companyId: string, leaveRequestId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const leaveRequest = await this.referenceService.getLeaveRequestRecord(
      companyId,
      leaveRequestId,
    );

    return this.mapLeaveRequest(leaveRequest);
  }

  async createLeaveRequest(
    companyId: string,
    createLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);
    await this.assertActiveEmployeeAndLeaveType(
      companyId,
      createLeaveRequestDto.employeeId,
      createLeaveRequestDto.leaveTypeId,
    );
    const startDate = parseCalendarDate(createLeaveRequestDto.startDate, 'startDate');
    const endDate = parseCalendarDate(createLeaveRequestDto.endDate, 'endDate');

    this.assertChronologicalLeaveRange(startDate, endDate);

    try {
      const leaveRequest = await this.prisma.leaveRequest.create({
        data: {
          companyId,
          employeeId: createLeaveRequestDto.employeeId,
          leaveTypeId: createLeaveRequestDto.leaveTypeId,
          startDate,
          endDate,
          reason: normalizeOptionalString(createLeaveRequestDto.reason) ?? null,
        },
      });

      return this.getLeaveRequestDetail(companyId, leaveRequest.id);
    } catch (error) {
      this.throwLeaveRequestMutationError(error);
    }
  }

  async updateLeaveRequest(
    companyId: string,
    leaveRequestId: string,
    updateLeaveRequestDto: UpdateLeaveRequestDto,
  ) {
    const existingLeaveRequest = await this.referenceService.getLeaveRequestRecord(
      companyId,
      leaveRequestId,
    );

    if (existingLeaveRequest.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only draft leave requests can be updated.',
      );
    }

    const nextEmployeeId =
      updateLeaveRequestDto.employeeId ?? existingLeaveRequest.employeeId;
    const nextLeaveTypeId =
      updateLeaveRequestDto.leaveTypeId ?? existingLeaveRequest.leaveTypeId;

    await this.assertActiveEmployeeAndLeaveType(
      companyId,
      nextEmployeeId,
      nextLeaveTypeId,
    );
    const nextStartDate =
      updateLeaveRequestDto.startDate === undefined
        ? existingLeaveRequest.startDate
        : parseCalendarDate(updateLeaveRequestDto.startDate, 'startDate');
    const nextEndDate =
      updateLeaveRequestDto.endDate === undefined
        ? existingLeaveRequest.endDate
        : parseCalendarDate(updateLeaveRequestDto.endDate, 'endDate');

    this.assertChronologicalLeaveRange(nextStartDate, nextEndDate);

    try {
      await this.prisma.leaveRequest.update({
        where: {
          id: existingLeaveRequest.id,
        },
        data: {
          employeeId: nextEmployeeId,
          leaveTypeId: nextLeaveTypeId,
          startDate: nextStartDate,
          endDate: nextEndDate,
          reason:
            updateLeaveRequestDto.reason === undefined
              ? existingLeaveRequest.reason
              : (normalizeOptionalString(updateLeaveRequestDto.reason) ?? null),
        },
      });
    } catch (error) {
      this.throwLeaveRequestMutationError(error);
    }

    return this.getLeaveRequestDetail(companyId, leaveRequestId);
  }

  async submitLeaveRequest(companyId: string, leaveRequestId: string) {
    const existingLeaveRequest = await this.referenceService.getLeaveRequestRecord(
      companyId,
      leaveRequestId,
    );

    if (existingLeaveRequest.status !== 'DRAFT') {
      throw new BadRequestException(
        'Only draft leave requests can be submitted.',
      );
    }

    await this.assertActiveEmployeeAndLeaveType(
      companyId,
      existingLeaveRequest.employeeId,
      existingLeaveRequest.leaveTypeId,
    );

    try {
      await this.prisma.leaveRequest.update({
        where: {
          id: existingLeaveRequest.id,
        },
        data: {
          status: 'SUBMITTED',
        },
      });
    } catch (error) {
      this.throwLeaveRequestMutationError(error);
    }

    return this.getLeaveRequestDetail(companyId, leaveRequestId);
  }

  async approveLeaveRequest(
    companyId: string,
    leaveRequestId: string,
    leaveRequestActionDto: LeaveRequestActionDto,
  ) {
    return this.applyLeaveRequestDecision(
      companyId,
      leaveRequestId,
      'APPROVED',
      leaveRequestActionDto,
    );
  }

  async rejectLeaveRequest(
    companyId: string,
    leaveRequestId: string,
    leaveRequestActionDto: LeaveRequestActionDto,
  ) {
    return this.applyLeaveRequestDecision(
      companyId,
      leaveRequestId,
      'REJECTED',
      leaveRequestActionDto,
    );
  }

  async cancelLeaveRequest(
    companyId: string,
    leaveRequestId: string,
    leaveRequestActionDto: LeaveRequestActionDto,
  ) {
    const existingLeaveRequest = await this.referenceService.getLeaveRequestRecord(
      companyId,
      leaveRequestId,
    );

    if (
      existingLeaveRequest.status !== 'DRAFT' &&
      existingLeaveRequest.status !== 'SUBMITTED'
    ) {
      throw new BadRequestException(
        'Only draft or submitted leave requests can be cancelled.',
      );
    }

    try {
      await this.prisma.leaveRequest.update({
        where: {
          id: existingLeaveRequest.id,
        },
        data: {
          status: 'CANCELLED',
          decisionNote:
            normalizeOptionalString(leaveRequestActionDto.decisionNote) ?? null,
        },
      });
    } catch (error) {
      this.throwLeaveRequestMutationError(error);
    }

    return this.getLeaveRequestDetail(companyId, leaveRequestId);
  }

  private readonly leaveRequestInclude = {
    employee: {
      include: {
        department: true,
        location: true,
        user: true,
        manager: true,
      },
    },
    leaveType: true,
  } satisfies Prisma.LeaveRequestInclude;

  private buildLeaveDateRangeWhere(
    dateFrom: string | undefined,
    dateTo: string | undefined,
  ): Prisma.LeaveRequestWhereInput | undefined {
    if (!dateFrom && !dateTo) {
      return undefined;
    }

    const startDate = dateFrom
      ? parseCalendarDate(dateFrom, 'dateFrom')
      : undefined;
    const endDate = dateTo ? parseCalendarDate(dateTo, 'dateTo') : undefined;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'dateFrom must be less than or equal to dateTo.',
      );
    }

    return {
      ...(startDate ? { endDate: { gte: startDate } } : {}),
      ...(endDate ? { startDate: { lte: endDate } } : {}),
    };
  }

  private async assertActiveEmployeeAndLeaveType(
    companyId: string,
    employeeId: string,
    leaveTypeId: string,
  ) {
    const [employee, leaveType] = await Promise.all([
      this.referenceService.getEmployeeRecord(companyId, employeeId),
      this.referenceService.getLeaveTypeRecord(companyId, leaveTypeId),
    ]);

    if (!employee.isActive) {
      throw new BadRequestException(
        'Inactive employees cannot create leave requests.',
      );
    }

    if (!leaveType.isActive) {
      throw new BadRequestException(
        'Inactive leave types cannot be assigned to leave requests.',
      );
    }
  }

  private async applyLeaveRequestDecision(
    companyId: string,
    leaveRequestId: string,
    status: 'APPROVED' | 'REJECTED',
    leaveRequestActionDto: LeaveRequestActionDto,
  ) {
    const existingLeaveRequest = await this.referenceService.getLeaveRequestRecord(
      companyId,
      leaveRequestId,
    );

    if (existingLeaveRequest.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Only submitted leave requests can be approved or rejected.',
      );
    }

    try {
      await this.prisma.leaveRequest.update({
        where: {
          id: existingLeaveRequest.id,
        },
        data: {
          status,
          decisionNote:
            normalizeOptionalString(leaveRequestActionDto.decisionNote) ?? null,
        },
      });
    } catch (error) {
      this.throwLeaveRequestMutationError(error);
    }

    return this.getLeaveRequestDetail(companyId, leaveRequestId);
  }

  private assertChronologicalLeaveRange(startDate: Date, endDate: Date) {
    if (startDate > endDate) {
      throw new BadRequestException(
        'startDate must be less than or equal to endDate.',
      );
    }
  }

  private mapLeaveRequest(leaveRequest: LeaveRequestRecord): LeaveRequestDto {
    return {
      id: leaveRequest.id,
      companyId: leaveRequest.companyId,
      employeeId: leaveRequest.employeeId,
      employeeCode: leaveRequest.employee.employeeCode,
      employeeFullName: leaveRequest.employee.fullName,
      departmentId: leaveRequest.employee.departmentId,
      departmentCode: leaveRequest.employee.department?.code ?? null,
      departmentName: leaveRequest.employee.department?.name ?? null,
      locationId: leaveRequest.employee.locationId,
      locationCode: leaveRequest.employee.location?.code ?? null,
      locationName: leaveRequest.employee.location?.name ?? null,
      leaveTypeId: leaveRequest.leaveTypeId,
      leaveTypeCode: leaveRequest.leaveType.code,
      leaveTypeName: leaveRequest.leaveType.name,
      startDate: leaveRequest.startDate.toISOString().slice(0, 10),
      endDate: leaveRequest.endDate.toISOString().slice(0, 10),
      reason: leaveRequest.reason,
      decisionNote: leaveRequest.decisionNote,
      status: leaveRequest.status,
      createdAt: leaveRequest.createdAt.toISOString(),
      updatedAt: leaveRequest.updatedAt.toISOString(),
    };
  }

  private throwLeaveRequestMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage?.includes('leave_requests_active_overlap_excl')) {
      throw new ConflictException(
        'The employee already has an overlapping submitted or approved leave request.',
      );
    }

    if (databaseMessage) {
      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw new ConflictException(
        'The leave request conflicts with an existing leave record.',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Leave request not found.');
    }

    throw error;
  }
}
