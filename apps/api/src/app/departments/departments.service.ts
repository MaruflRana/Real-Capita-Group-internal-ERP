import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
import { buildPaginationMeta, getPaginationSkip } from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { CreateDepartmentDto } from './dto/create-department.dto';
import type { DepartmentsListQueryDto } from './dto/departments-list-query.dto';
import type { UpdateDepartmentDto } from './dto/update-department.dto';

const DEPARTMENT_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;

type DepartmentRecord = Prisma.DepartmentGetPayload<object>;

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listDepartments(companyId: string, query: DepartmentsListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.DepartmentWhereInput = {
      companyId,
      ...(query.isActive === undefined
        ? {}
        : {
            isActive: query.isActive,
          }),
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
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      DEPARTMENT_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.DepartmentOrderByWithRelationInput;
    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.department.count({
        where,
      }),
    ]);

    return {
      items: departments.map((department) => this.mapDepartment(department)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getDepartmentDetail(companyId: string, departmentId: string) {
    await this.assertCompanyExists(companyId);

    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    return this.mapDepartment(department);
  }

  async createDepartment(
    companyId: string,
    actorUserId: string,
    requestId: string | undefined,
    createDepartmentDto: CreateDepartmentDto,
  ) {
    await this.assertCompanyExists(companyId);

    const normalizedInput = this.normalizeInput({
      code: createDepartmentDto.code,
      name: createDepartmentDto.name,
      description: createDepartmentDto.description,
    });

    await this.assertDepartmentUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    const department = await this.prisma.department.create({
      data: {
        companyId,
        ...normalizedInput,
      },
    });

    await this.auditService.recordEvent({
      companyId,
      actorUserId,
      category: 'ADMIN',
      eventType: AUDIT_EVENT_TYPES.departmentCreated,
      targetEntityType: 'DEPARTMENT',
      targetEntityId: department.id,
      requestId,
      metadata: {
        code: department.code,
        name: department.name,
      },
    });

    return this.mapDepartment(department);
  }

  async updateDepartment(
    companyId: string,
    departmentId: string,
    actorUserId: string,
    requestId: string | undefined,
    updateDepartmentDto: UpdateDepartmentDto,
  ) {
    await this.assertCompanyExists(companyId);

    const existingDepartment = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
    });

    if (!existingDepartment) {
      throw new NotFoundException('Department not found.');
    }

    const normalizedInput = this.normalizeInput({
      code: updateDepartmentDto.code ?? existingDepartment.code,
      name: updateDepartmentDto.name ?? existingDepartment.name,
      description:
        updateDepartmentDto.description === undefined
          ? existingDepartment.description ?? undefined
          : updateDepartmentDto.description,
    });

    await this.assertDepartmentUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingDepartment.id,
    );

    const department = await this.prisma.department.update({
      where: {
        id: existingDepartment.id,
      },
      data: normalizedInput,
    });

    await this.auditService.recordEvent({
      companyId,
      actorUserId,
      category: 'ADMIN',
      eventType: AUDIT_EVENT_TYPES.departmentUpdated,
      targetEntityType: 'DEPARTMENT',
      targetEntityId: department.id,
      requestId,
      metadata: {
        code: department.code,
        name: department.name,
      },
    });

    return this.mapDepartment(department);
  }

  async setDepartmentActiveState(
    companyId: string,
    departmentId: string,
    actorUserId: string,
    requestId: string | undefined,
    isActive: boolean,
  ) {
    await this.assertCompanyExists(companyId);

    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    const updatedDepartment = await this.prisma.department.update({
      where: {
        id: department.id,
      },
      data: {
        isActive,
      },
    });

    await this.auditService.recordEvent({
      companyId,
      actorUserId,
      category: 'ADMIN',
      eventType: isActive
        ? AUDIT_EVENT_TYPES.departmentActivated
        : AUDIT_EVENT_TYPES.departmentDeactivated,
      targetEntityType: 'DEPARTMENT',
      targetEntityId: updatedDepartment.id,
      requestId,
    });

    return this.mapDepartment(updatedDepartment);
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
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

  private normalizeInput(input: {
    code: string;
    name: string;
    description: string | undefined | null;
  }) {
    return {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
    };
  }

  private async assertDepartmentUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredDepartmentId?: string,
  ): Promise<void> {
    const existingDepartmentWithCode = await this.prisma.department.findFirst({
      where: {
        companyId,
        code: {
          equals: code,
          mode: 'insensitive',
        },
        ...(ignoredDepartmentId
          ? {
              id: {
                not: ignoredDepartmentId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingDepartmentWithCode) {
      throw new ConflictException(
        'A department with this code already exists in the company.',
      );
    }

    const existingDepartmentWithName = await this.prisma.department.findFirst({
      where: {
        companyId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...(ignoredDepartmentId
          ? {
              id: {
                not: ignoredDepartmentId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingDepartmentWithName) {
      throw new ConflictException(
        'A department with this name already exists in the company.',
      );
    }
  }

  private mapDepartment(department: DepartmentRecord) {
    return {
      id: department.id,
      companyId: department.companyId,
      code: department.code,
      name: department.name,
      description: department.description,
      isActive: department.isActive,
      createdAt: department.createdAt.toISOString(),
      updatedAt: department.updatedAt.toISOString(),
    };
  }
}
