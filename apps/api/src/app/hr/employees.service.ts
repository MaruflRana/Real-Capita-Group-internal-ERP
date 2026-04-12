import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import {
  extractDatabaseErrorMessage,
  isUniqueConstraintError,
  toConflictException,
} from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { EmployeeRecord } from './hr-reference.service';
import { HrReferenceService } from './hr-reference.service';
import type {
  CreateEmployeeDto,
  EmployeeDto,
  EmployeesListQueryDto,
  UpdateEmployeeDto,
} from './dto/employees.dto';
import { normalizeCode, normalizeRequiredString } from './hr.utils';

const EMPLOYEE_SORT_FIELDS = [
  'createdAt',
  'employeeCode',
  'fullName',
  'updatedAt',
] as const;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: HrReferenceService,
  ) {}

  async listEmployees(companyId: string, query: EmployeesListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.EmployeeWhereInput = {
      companyId,
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.managerEmployeeId
        ? { managerEmployeeId: query.managerEmployeeId }
        : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                employeeCode: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                fullName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                department: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
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
              {
                user: {
                  email: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                manager: {
                  fullName: {
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
      EMPLOYEE_SORT_FIELDS,
      'employeeCode',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.EmployeeOrderByWithRelationInput;
    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: this.employeeInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.employee.count({
        where,
      }),
    ]);

    return {
      items: employees.map((employee) => this.mapEmployee(employee)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getEmployeeDetail(companyId: string, employeeId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const employee = await this.referenceService.getEmployeeRecord(
      companyId,
      employeeId,
    );

    return this.mapEmployee(employee);
  }

  async createEmployee(companyId: string, createEmployeeDto: CreateEmployeeDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const normalizedInput = {
      employeeCode: normalizeCode(createEmployeeDto.employeeCode),
      fullName: normalizeRequiredString(createEmployeeDto.fullName),
      departmentId: createEmployeeDto.departmentId ?? null,
      locationId: createEmployeeDto.locationId ?? null,
      userId: createEmployeeDto.userId ?? null,
      managerEmployeeId: createEmployeeDto.managerEmployeeId ?? null,
    };

    await this.assertEmployeeAssociations(
      companyId,
      normalizedInput.departmentId,
      normalizedInput.locationId,
      normalizedInput.userId,
      normalizedInput.managerEmployeeId,
    );
    await this.assertEmployeeUniqueness(
      companyId,
      normalizedInput.employeeCode,
      normalizedInput.userId,
    );

    try {
      const employee = await this.prisma.employee.create({
        data: {
          companyId,
          ...normalizedInput,
        },
        include: this.employeeInclude,
      });

      return this.mapEmployee(employee);
    } catch (error) {
      this.throwEmployeeMutationError(error);
    }
  }

  async updateEmployee(
    companyId: string,
    employeeId: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ) {
    const existingEmployee = await this.referenceService.getEmployeeRecord(
      companyId,
      employeeId,
    );
    const normalizedInput = {
      employeeCode: normalizeCode(
        updateEmployeeDto.employeeCode ?? existingEmployee.employeeCode,
      ),
      fullName: normalizeRequiredString(
        updateEmployeeDto.fullName ?? existingEmployee.fullName,
      ),
      departmentId:
        updateEmployeeDto.departmentId === undefined
          ? existingEmployee.departmentId
          : (updateEmployeeDto.departmentId ?? null),
      locationId:
        updateEmployeeDto.locationId === undefined
          ? existingEmployee.locationId
          : (updateEmployeeDto.locationId ?? null),
      userId:
        updateEmployeeDto.userId === undefined
          ? existingEmployee.userId
          : (updateEmployeeDto.userId ?? null),
      managerEmployeeId:
        updateEmployeeDto.managerEmployeeId === undefined
          ? existingEmployee.managerEmployeeId
          : (updateEmployeeDto.managerEmployeeId ?? null),
    };

    if (normalizedInput.managerEmployeeId === existingEmployee.id) {
      throw new BadRequestException('An employee cannot manage themselves.');
    }

    await this.assertEmployeeAssociations(
      companyId,
      normalizedInput.departmentId,
      normalizedInput.locationId,
      normalizedInput.userId,
      normalizedInput.managerEmployeeId,
    );
    await this.assertEmployeeUniqueness(
      companyId,
      normalizedInput.employeeCode,
      normalizedInput.userId,
      existingEmployee.id,
    );
    await this.assertManagerChainSafe(
      companyId,
      existingEmployee.id,
      normalizedInput.managerEmployeeId,
    );

    try {
      const employee = await this.prisma.employee.update({
        where: {
          id: existingEmployee.id,
        },
        data: normalizedInput,
        include: this.employeeInclude,
      });

      return this.mapEmployee(employee);
    } catch (error) {
      this.throwEmployeeMutationError(error);
    }
  }

  async setEmployeeActiveState(
    companyId: string,
    employeeId: string,
    isActive: boolean,
  ) {
    await this.referenceService.getEmployeeRecord(companyId, employeeId);

    const employee = await this.prisma.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        isActive,
      },
      include: this.employeeInclude,
    });

    return this.mapEmployee(employee);
  }

  private readonly employeeInclude = {
    department: true,
    location: true,
    user: true,
    manager: true,
  } satisfies Prisma.EmployeeInclude;

  private async assertEmployeeAssociations(
    companyId: string,
    departmentId: string | null,
    locationId: string | null,
    userId: string | null,
    managerEmployeeId: string | null,
  ) {
    const [department, location, userAssignment, manager] = await Promise.all([
      departmentId
        ? this.referenceService.getDepartmentRecord(companyId, departmentId)
        : Promise.resolve(null),
      locationId
        ? this.referenceService.getLocationRecord(companyId, locationId)
        : Promise.resolve(null),
      userId
        ? this.referenceService.getUserCompanyAccessRecord(companyId, userId)
        : Promise.resolve(null),
      managerEmployeeId
        ? this.referenceService.getEmployeeRecord(companyId, managerEmployeeId)
        : Promise.resolve(null),
    ]);

    if (department && !department.isActive) {
      throw new BadRequestException(
        'Inactive departments cannot be assigned to employees.',
      );
    }

    if (location && !location.isActive) {
      throw new BadRequestException(
        'Inactive locations cannot be assigned to employees.',
      );
    }

    if (userAssignment && !userAssignment.user.isActive) {
      throw new BadRequestException(
        'Inactive users cannot be linked to employees.',
      );
    }

    if (manager && !manager.isActive) {
      throw new BadRequestException(
        'Inactive managers cannot be assigned to employees.',
      );
    }
  }

  private async assertEmployeeUniqueness(
    companyId: string,
    employeeCode: string,
    userId: string | null,
    ignoredEmployeeId?: string,
  ) {
    const [existingEmployeeCode, existingUserLink] = await Promise.all([
      this.prisma.employee.findFirst({
        where: {
          companyId,
          employeeCode: {
            equals: employeeCode,
            mode: 'insensitive',
          },
          ...(ignoredEmployeeId ? { id: { not: ignoredEmployeeId } } : {}),
        },
        select: {
          id: true,
        },
      }),
      userId
        ? this.prisma.employee.findFirst({
            where: {
              companyId,
              userId,
              ...(ignoredEmployeeId ? { id: { not: ignoredEmployeeId } } : {}),
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (existingEmployeeCode) {
      throw toConflictException(
        'An employee with this code already exists in the company.',
      );
    }

    if (existingUserLink) {
      throw toConflictException(
        'This user is already linked to another employee in the company.',
      );
    }
  }

  private async assertManagerChainSafe(
    companyId: string,
    employeeId: string,
    managerEmployeeId: string | null,
  ) {
    let currentManagerId = managerEmployeeId;

    while (currentManagerId) {
      if (currentManagerId === employeeId) {
        throw new BadRequestException(
          'Manager relationship cannot create a cycle.',
        );
      }

      const manager = await this.prisma.employee.findFirst({
        where: {
          id: currentManagerId,
          companyId,
        },
        select: {
          id: true,
          managerEmployeeId: true,
        },
      });

      if (!manager) {
        throw new NotFoundException('Manager employee not found.');
      }

      currentManagerId = manager.managerEmployeeId;
    }
  }

  private mapEmployee(employee: EmployeeRecord): EmployeeDto {
    return {
      id: employee.id,
      companyId: employee.companyId,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      departmentId: employee.departmentId,
      departmentCode: employee.department?.code ?? null,
      departmentName: employee.department?.name ?? null,
      locationId: employee.locationId,
      locationCode: employee.location?.code ?? null,
      locationName: employee.location?.name ?? null,
      userId: employee.userId,
      userEmail: employee.user?.email ?? null,
      userFirstName: employee.user?.firstName ?? null,
      userLastName: employee.user?.lastName ?? null,
      managerEmployeeId: employee.managerEmployeeId,
      managerEmployeeCode: employee.manager?.employeeCode ?? null,
      managerFullName: employee.manager?.fullName ?? null,
      isActive: employee.isActive,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };
  }

  private throwEmployeeMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      if (databaseMessage.includes('employees_manager_not_self_check')) {
        throw new BadRequestException('An employee cannot manage themselves.');
      }

      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException(
        'The employee details conflict with an existing employee in the company.',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Employee not found.');
    }

    throw error;
  }
}
