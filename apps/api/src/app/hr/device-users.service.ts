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
import type { DeviceUserRecord } from './hr-reference.service';
import { HrReferenceService } from './hr-reference.service';
import type {
  CreateDeviceUserDto,
  DeviceUserDto,
  DeviceUsersListQueryDto,
  UpdateDeviceUserDto,
} from './dto/device-users.dto';
import { normalizeRequiredString } from './hr.utils';

const DEVICE_USER_SORT_FIELDS = [
  'createdAt',
  'deviceEmployeeCode',
  'updatedAt',
] as const;

@Injectable()
export class DeviceUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: HrReferenceService,
  ) {}

  async listDeviceUsers(companyId: string, query: DeviceUsersListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.DeviceUserWhereInput = {
      companyId,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.attendanceDeviceId
        ? { attendanceDeviceId: query.attendanceDeviceId }
        : {}),
      ...(query.locationId
        ? {
            attendanceDevice: {
              locationId: query.locationId,
            },
          }
        : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                deviceEmployeeCode: {
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
                attendanceDevice: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                attendanceDevice: {
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
      DEVICE_USER_SORT_FIELDS,
      'deviceEmployeeCode',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.DeviceUserOrderByWithRelationInput;
    const [deviceUsers, total] = await Promise.all([
      this.prisma.deviceUser.findMany({
        where,
        include: this.deviceUserInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.deviceUser.count({
        where,
      }),
    ]);

    return {
      items: deviceUsers.map((deviceUser) => this.mapDeviceUser(deviceUser)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getDeviceUserDetail(companyId: string, deviceUserId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const deviceUser = await this.referenceService.getDeviceUserRecord(
      companyId,
      deviceUserId,
    );

    return this.mapDeviceUser(deviceUser);
  }

  async createDeviceUser(companyId: string, createDeviceUserDto: CreateDeviceUserDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const normalizedDeviceEmployeeCode = normalizeRequiredString(
      createDeviceUserDto.deviceEmployeeCode,
    );

    await this.assertActiveEmployeeAndDevice(
      companyId,
      createDeviceUserDto.employeeId,
      createDeviceUserDto.attendanceDeviceId,
    );
    await this.assertActiveMappingUniqueness(
      companyId,
      createDeviceUserDto.employeeId,
      createDeviceUserDto.attendanceDeviceId,
      normalizedDeviceEmployeeCode,
    );

    try {
      const deviceUser = await this.prisma.deviceUser.create({
        data: {
          companyId,
          employeeId: createDeviceUserDto.employeeId,
          attendanceDeviceId: createDeviceUserDto.attendanceDeviceId,
          deviceEmployeeCode: normalizedDeviceEmployeeCode,
        },
        include: this.deviceUserInclude,
      });

      return this.mapDeviceUser(deviceUser);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'The attendance device user mapping conflicts with an existing active mapping.',
        );
      }

      throw error;
    }
  }

  async updateDeviceUser(
    companyId: string,
    deviceUserId: string,
    updateDeviceUserDto: UpdateDeviceUserDto,
  ) {
    const existingDeviceUser = await this.referenceService.getDeviceUserRecord(
      companyId,
      deviceUserId,
    );
    const nextEmployeeId =
      updateDeviceUserDto.employeeId ?? existingDeviceUser.employeeId;
    const nextAttendanceDeviceId =
      updateDeviceUserDto.attendanceDeviceId ??
      existingDeviceUser.attendanceDeviceId;
    const nextDeviceEmployeeCode =
      updateDeviceUserDto.deviceEmployeeCode === undefined
        ? existingDeviceUser.deviceEmployeeCode
        : normalizeRequiredString(updateDeviceUserDto.deviceEmployeeCode);

    await this.assertActiveEmployeeAndDevice(
      companyId,
      nextEmployeeId,
      nextAttendanceDeviceId,
    );
    await this.assertActiveMappingUniqueness(
      companyId,
      nextEmployeeId,
      nextAttendanceDeviceId,
      nextDeviceEmployeeCode,
      existingDeviceUser.id,
      existingDeviceUser.isActive,
    );

    try {
      const deviceUser = await this.prisma.deviceUser.update({
        where: {
          id: existingDeviceUser.id,
        },
        data: {
          employeeId: nextEmployeeId,
          attendanceDeviceId: nextAttendanceDeviceId,
          deviceEmployeeCode: nextDeviceEmployeeCode,
        },
        include: this.deviceUserInclude,
      });

      return this.mapDeviceUser(deviceUser);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'The attendance device user mapping conflicts with an existing active mapping.',
        );
      }

      throw error;
    }
  }

  async setDeviceUserActiveState(
    companyId: string,
    deviceUserId: string,
    isActive: boolean,
  ) {
    const existingDeviceUser = await this.referenceService.getDeviceUserRecord(
      companyId,
      deviceUserId,
    );

    if (isActive) {
      await this.assertActiveEmployeeAndDevice(
        companyId,
        existingDeviceUser.employeeId,
        existingDeviceUser.attendanceDeviceId,
      );
      await this.assertActiveMappingUniqueness(
        companyId,
        existingDeviceUser.employeeId,
        existingDeviceUser.attendanceDeviceId,
        existingDeviceUser.deviceEmployeeCode,
        existingDeviceUser.id,
        true,
      );
    }

    try {
      const deviceUser = await this.prisma.deviceUser.update({
        where: {
          id: existingDeviceUser.id,
        },
        data: {
          isActive,
        },
        include: this.deviceUserInclude,
      });

      return this.mapDeviceUser(deviceUser);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'The attendance device user mapping conflicts with an existing active mapping.',
        );
      }

      throw error;
    }
  }

  private readonly deviceUserInclude = {
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
  } satisfies Prisma.DeviceUserInclude;

  private async assertActiveEmployeeAndDevice(
    companyId: string,
    employeeId: string,
    attendanceDeviceId: string,
  ) {
    const [employee, attendanceDevice] = await Promise.all([
      this.referenceService.getEmployeeRecord(companyId, employeeId),
      this.referenceService.getAttendanceDeviceRecord(
        companyId,
        attendanceDeviceId,
      ),
    ]);

    if (!employee.isActive) {
      throw new BadRequestException(
        'Inactive employees cannot be mapped to attendance devices.',
      );
    }

    if (!attendanceDevice.isActive) {
      throw new BadRequestException(
        'Inactive attendance devices cannot receive employee mappings.',
      );
    }
  }

  private async assertActiveMappingUniqueness(
    companyId: string,
    employeeId: string,
    attendanceDeviceId: string,
    deviceEmployeeCode: string,
    ignoredDeviceUserId?: string,
    nextIsActive = true,
  ) {
    if (!nextIsActive) {
      return;
    }

    const [existingEmployeeMapping, existingDeviceCodeMapping] = await Promise.all([
      this.prisma.deviceUser.findFirst({
        where: {
          companyId,
          employeeId,
          attendanceDeviceId,
          isActive: true,
          ...(ignoredDeviceUserId ? { id: { not: ignoredDeviceUserId } } : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.deviceUser.findFirst({
        where: {
          companyId,
          attendanceDeviceId,
          isActive: true,
          deviceEmployeeCode: {
            equals: deviceEmployeeCode,
            mode: 'insensitive',
          },
          ...(ignoredDeviceUserId ? { id: { not: ignoredDeviceUserId } } : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingEmployeeMapping) {
      throw toConflictException(
        'The employee already has an active mapping on this attendance device.',
      );
    }

    if (existingDeviceCodeMapping) {
      throw toConflictException(
        'The device employee code is already assigned on this attendance device.',
      );
    }
  }

  private mapDeviceUser(deviceUser: DeviceUserRecord): DeviceUserDto {
    return {
      id: deviceUser.id,
      companyId: deviceUser.companyId,
      employeeId: deviceUser.employeeId,
      employeeCode: deviceUser.employee.employeeCode,
      employeeFullName: deviceUser.employee.fullName,
      attendanceDeviceId: deviceUser.attendanceDeviceId,
      attendanceDeviceCode: deviceUser.attendanceDevice.code,
      attendanceDeviceName: deviceUser.attendanceDevice.name,
      locationId: deviceUser.attendanceDevice.locationId,
      locationCode: deviceUser.attendanceDevice.location?.code ?? null,
      locationName: deviceUser.attendanceDevice.location?.name ?? null,
      deviceEmployeeCode: deviceUser.deviceEmployeeCode,
      isActive: deviceUser.isActive,
      createdAt: deviceUser.createdAt.toISOString(),
      updatedAt: deviceUser.updatedAt.toISOString(),
    };
  }
}
