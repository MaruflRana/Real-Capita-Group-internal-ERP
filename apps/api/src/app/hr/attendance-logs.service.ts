import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type AttendanceLogDirection } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import { isUniqueConstraintError } from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { AttendanceLogRecord } from './hr-reference.service';
import { HrReferenceService } from './hr-reference.service';
import type {
  AttendanceLogDto,
  AttendanceLogsListQueryDto,
  BulkAttendanceLogsResultDto,
  BulkCreateAttendanceLogsDto,
  CreateAttendanceLogDto,
} from './dto/attendance-logs.dto';
import {
  buildDateTimeDateRangeFilter,
  normalizeOptionalString,
  parseDateTime,
} from './hr.utils';

const ATTENDANCE_LOG_SORT_FIELDS = [
  'createdAt',
  'direction',
  'loggedAt',
  'updatedAt',
] as const;

@Injectable()
export class AttendanceLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: HrReferenceService,
  ) {}

  async listAttendanceLogs(companyId: string, query: AttendanceLogsListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const loggedAtFilter = buildDateTimeDateRangeFilter(
      query.dateFrom,
      query.dateTo,
      'date',
    );
    const where: Prisma.AttendanceLogWhereInput = {
      companyId,
      ...(query.employeeId
        ? {
            deviceUser: {
              employeeId: query.employeeId,
            },
          }
        : {}),
      ...(query.attendanceDeviceId
        ? {
            deviceUser: {
              attendanceDeviceId: query.attendanceDeviceId,
            },
          }
        : {}),
      ...(query.deviceUserId ? { deviceUserId: query.deviceUserId } : {}),
      ...(query.locationId
        ? {
            deviceUser: {
              attendanceDevice: {
                locationId: query.locationId,
              },
            },
          }
        : {}),
      ...(query.direction
        ? { direction: query.direction as AttendanceLogDirection }
        : {}),
      ...(loggedAtFilter ? { loggedAt: loggedAtFilter } : {}),
      ...(query.search
        ? {
            OR: [
              {
                externalLogId: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                deviceUser: {
                  deviceEmployeeCode: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                deviceUser: {
                  employee: {
                    employeeCode: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                deviceUser: {
                  employee: {
                    fullName: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                deviceUser: {
                  attendanceDevice: {
                    code: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                deviceUser: {
                  attendanceDevice: {
                    name: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      ATTENDANCE_LOG_SORT_FIELDS,
      'loggedAt',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.AttendanceLogOrderByWithRelationInput;
    const [attendanceLogs, total] = await Promise.all([
      this.prisma.attendanceLog.findMany({
        where,
        include: this.attendanceLogInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.attendanceLog.count({
        where,
      }),
    ]);

    return {
      items: attendanceLogs.map((attendanceLog) =>
        this.mapAttendanceLog(attendanceLog),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getAttendanceLogDetail(companyId: string, attendanceLogId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const attendanceLog = await this.referenceService.getAttendanceLogRecord(
      companyId,
      attendanceLogId,
    );

    return this.mapAttendanceLog(attendanceLog);
  }

  async createAttendanceLog(
    companyId: string,
    createAttendanceLogDto: CreateAttendanceLogDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);
    await this.referenceService.getDeviceUserRecord(
      companyId,
      createAttendanceLogDto.deviceUserId,
    );

    try {
      const attendanceLog = await this.prisma.attendanceLog.create({
        data: {
          companyId,
          deviceUserId: createAttendanceLogDto.deviceUserId,
          loggedAt: parseDateTime(createAttendanceLogDto.loggedAt, 'loggedAt'),
          direction:
            (createAttendanceLogDto.direction as
              | AttendanceLogDirection
              | undefined) ?? 'UNKNOWN',
          externalLogId:
            normalizeOptionalString(createAttendanceLogDto.externalLogId) ??
            null,
        },
      });

      return this.getAttendanceLogDetail(companyId, attendanceLog.id);
    } catch (error) {
      this.throwAttendanceLogMutationError(error);
    }
  }

  async bulkCreateAttendanceLogs(
    companyId: string,
    bulkCreateAttendanceLogsDto: BulkCreateAttendanceLogsDto,
  ): Promise<BulkAttendanceLogsResultDto> {
    await this.referenceService.assertCompanyExists(companyId);

    const uniqueDeviceUserIds = Array.from(
      new Set(bulkCreateAttendanceLogsDto.entries.map((entry) => entry.deviceUserId)),
    );
    const existingDeviceUsers = await this.prisma.deviceUser.findMany({
      where: {
        companyId,
        id: {
          in: uniqueDeviceUserIds,
        },
      },
      select: {
        id: true,
      },
    });
    const resolvedDeviceUserIds = new Set(
      existingDeviceUsers.map((entry) => entry.id),
    );
    const missingDeviceUserIds = uniqueDeviceUserIds.filter(
      (deviceUserId) => !resolvedDeviceUserIds.has(deviceUserId),
    );

    if (missingDeviceUserIds.length > 0) {
      throw new NotFoundException(
        `Attendance device user mappings were not found: ${missingDeviceUserIds.join(', ')}.`,
      );
    }

    const now = new Date();
    const result = await this.prisma.attendanceLog.createMany({
      data: bulkCreateAttendanceLogsDto.entries.map((entry) => ({
        companyId,
        deviceUserId: entry.deviceUserId,
        loggedAt: parseDateTime(entry.loggedAt, 'loggedAt'),
        direction:
          (entry.direction as AttendanceLogDirection | undefined) ?? 'UNKNOWN',
        externalLogId: normalizeOptionalString(entry.externalLogId) ?? null,
        createdAt: now,
        updatedAt: now,
      })),
      skipDuplicates: true,
    });

    return {
      createdCount: result.count,
      skippedCount: bulkCreateAttendanceLogsDto.entries.length - result.count,
    };
  }

  private readonly attendanceLogInclude = {
    deviceUser: {
      include: {
        employee: {
          include: {
            department: true,
            location: true,
            user: true,
            manager: true,
          },
        },
        attendanceDevice: {
          include: {
            location: true,
          },
        },
      },
    },
  } satisfies Prisma.AttendanceLogInclude;

  private mapAttendanceLog(attendanceLog: AttendanceLogRecord): AttendanceLogDto {
    return {
      id: attendanceLog.id,
      companyId: attendanceLog.companyId,
      deviceUserId: attendanceLog.deviceUserId,
      employeeId: attendanceLog.deviceUser.employeeId,
      employeeCode: attendanceLog.deviceUser.employee.employeeCode,
      employeeFullName: attendanceLog.deviceUser.employee.fullName,
      attendanceDeviceId: attendanceLog.deviceUser.attendanceDeviceId,
      attendanceDeviceCode: attendanceLog.deviceUser.attendanceDevice.code,
      attendanceDeviceName: attendanceLog.deviceUser.attendanceDevice.name,
      locationId: attendanceLog.deviceUser.attendanceDevice.locationId,
      locationCode:
        attendanceLog.deviceUser.attendanceDevice.location?.code ?? null,
      locationName:
        attendanceLog.deviceUser.attendanceDevice.location?.name ?? null,
      deviceEmployeeCode: attendanceLog.deviceUser.deviceEmployeeCode,
      loggedAt: attendanceLog.loggedAt.toISOString(),
      direction: attendanceLog.direction,
      externalLogId: attendanceLog.externalLogId,
      createdAt: attendanceLog.createdAt.toISOString(),
      updatedAt: attendanceLog.updatedAt.toISOString(),
    };
  }

  private throwAttendanceLogMutationError(error: unknown): never {
    if (isUniqueConstraintError(error)) {
      const target = this.extractUniqueConstraintTarget(error);

      if (target.includes('externalLogId')) {
        throw new ConflictException(
          'An attendance log with this external log ID already exists in the company.',
        );
      }

      if (target.includes('deviceUserId') && target.includes('loggedAt')) {
        throw new ConflictException(
          'A duplicate attendance log already exists for the same device user, timestamp, and direction.',
        );
      }

      throw new ConflictException(
        'The attendance log conflicts with an existing attendance record.',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Attendance log not found.');
    }

    throw error;
  }

  private extractUniqueConstraintTarget(error: unknown): string[] {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return [];
    }

    const target = error.meta?.target;

    return Array.isArray(target)
      ? target.map((entry) => String(entry))
      : typeof target === 'string'
        ? [target]
        : [];
  }
}
