import {
  BadRequestException,
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
import type { AttendanceDeviceRecord } from './hr-reference.service';
import { HrReferenceService } from './hr-reference.service';
import type {
  AttendanceDeviceDto,
  AttendanceDevicesListQueryDto,
  CreateAttendanceDeviceDto,
  UpdateAttendanceDeviceDto,
} from './dto/attendance-devices.dto';
import {
  normalizeCode,
  normalizeOptionalString,
  normalizeRequiredString,
} from './hr.utils';

const ATTENDANCE_DEVICE_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;

@Injectable()
export class AttendanceDevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: HrReferenceService,
  ) {}

  async listAttendanceDevices(
    companyId: string,
    query: AttendanceDevicesListQueryDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.AttendanceDeviceWhereInput = {
      companyId,
      ...(query.locationId ? { locationId: query.locationId } : {}),
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
              {
                location: {
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
      ATTENDANCE_DEVICE_SORT_FIELDS,
      'code',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.AttendanceDeviceOrderByWithRelationInput;
    const [attendanceDevices, total] = await Promise.all([
      this.prisma.attendanceDevice.findMany({
        where,
        include: this.attendanceDeviceInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.attendanceDevice.count({
        where,
      }),
    ]);

    return {
      items: attendanceDevices.map((attendanceDevice) =>
        this.mapAttendanceDevice(attendanceDevice),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getAttendanceDeviceDetail(companyId: string, attendanceDeviceId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const attendanceDevice =
      await this.referenceService.getAttendanceDeviceRecord(
        companyId,
        attendanceDeviceId,
      );

    return this.mapAttendanceDevice(attendanceDevice);
  }

  async createAttendanceDevice(
    companyId: string,
    createAttendanceDeviceDto: CreateAttendanceDeviceDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const normalizedInput = {
      code: normalizeCode(createAttendanceDeviceDto.code),
      name: normalizeRequiredString(createAttendanceDeviceDto.name),
      description:
        normalizeOptionalString(createAttendanceDeviceDto.description) ?? null,
      locationId: createAttendanceDeviceDto.locationId ?? null,
    };

    await this.assertLocation(companyId, normalizedInput.locationId);
    await this.assertAttendanceDeviceUniqueness(companyId, normalizedInput.code);

    try {
      const attendanceDevice = await this.prisma.attendanceDevice.create({
        data: {
          companyId,
          ...normalizedInput,
        },
        include: this.attendanceDeviceInclude,
      });

      return this.mapAttendanceDevice(attendanceDevice);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'An attendance device with this code already exists in the company.',
        );
      }

      throw error;
    }
  }

  async updateAttendanceDevice(
    companyId: string,
    attendanceDeviceId: string,
    updateAttendanceDeviceDto: UpdateAttendanceDeviceDto,
  ) {
    const existingAttendanceDevice =
      await this.referenceService.getAttendanceDeviceRecord(
        companyId,
        attendanceDeviceId,
      );
    const normalizedInput = {
      code: normalizeCode(
        updateAttendanceDeviceDto.code ?? existingAttendanceDevice.code,
      ),
      name: normalizeRequiredString(
        updateAttendanceDeviceDto.name ?? existingAttendanceDevice.name,
      ),
      description:
        updateAttendanceDeviceDto.description === undefined
          ? existingAttendanceDevice.description
          : (normalizeOptionalString(updateAttendanceDeviceDto.description) ??
              null),
      locationId:
        updateAttendanceDeviceDto.locationId === undefined
          ? existingAttendanceDevice.locationId
          : (updateAttendanceDeviceDto.locationId ?? null),
    };

    await this.assertLocation(companyId, normalizedInput.locationId);
    await this.assertAttendanceDeviceUniqueness(
      companyId,
      normalizedInput.code,
      existingAttendanceDevice.id,
    );

    try {
      const attendanceDevice = await this.prisma.attendanceDevice.update({
        where: {
          id: existingAttendanceDevice.id,
        },
        data: normalizedInput,
        include: this.attendanceDeviceInclude,
      });

      return this.mapAttendanceDevice(attendanceDevice);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'An attendance device with this code already exists in the company.',
        );
      }

      throw error;
    }
  }

  async setAttendanceDeviceActiveState(
    companyId: string,
    attendanceDeviceId: string,
    isActive: boolean,
  ) {
    await this.referenceService.getAttendanceDeviceRecord(
      companyId,
      attendanceDeviceId,
    );

    const attendanceDevice = await this.prisma.attendanceDevice.update({
      where: {
        id: attendanceDeviceId,
      },
      data: {
        isActive,
      },
      include: this.attendanceDeviceInclude,
    });

    return this.mapAttendanceDevice(attendanceDevice);
  }

  private readonly attendanceDeviceInclude = {
    location: true,
  } satisfies Prisma.AttendanceDeviceInclude;

  private async assertLocation(companyId: string, locationId: string | null) {
    if (!locationId) {
      return;
    }

    const location = await this.referenceService.getLocationRecord(
      companyId,
      locationId,
    );

    if (!location.isActive) {
      throw new BadRequestException(
        'Inactive locations cannot be assigned to attendance devices.',
      );
    }
  }

  private async assertAttendanceDeviceUniqueness(
    companyId: string,
    code: string,
    ignoredAttendanceDeviceId?: string,
  ) {
    const existingAttendanceDevice =
      await this.prisma.attendanceDevice.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredAttendanceDeviceId
            ? { id: { not: ignoredAttendanceDeviceId } }
            : {}),
        },
        select: {
          id: true,
        },
      });

    if (existingAttendanceDevice) {
      throw toConflictException(
        'An attendance device with this code already exists in the company.',
      );
    }
  }

  private mapAttendanceDevice(
    attendanceDevice: AttendanceDeviceRecord,
  ): AttendanceDeviceDto {
    return {
      id: attendanceDevice.id,
      companyId: attendanceDevice.companyId,
      code: attendanceDevice.code,
      name: attendanceDevice.name,
      description: attendanceDevice.description,
      locationId: attendanceDevice.locationId,
      locationCode: attendanceDevice.location?.code ?? null,
      locationName: attendanceDevice.location?.name ?? null,
      isActive: attendanceDevice.isActive,
      createdAt: attendanceDevice.createdAt.toISOString(),
      updatedAt: attendanceDevice.updatedAt.toISOString(),
    };
  }
}
