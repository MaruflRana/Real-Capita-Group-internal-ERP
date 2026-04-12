import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { DepartmentsListQueryDto } from '../departments/dto/departments-list-query.dto';
import type { LocationsListQueryDto } from '../locations/dto/locations-list-query.dto';
import type { CompanyUsersListQueryDto } from '../users/dto/company-users-list-query.dto';
import { HrReferenceService } from './hr-reference.service';

const DEPARTMENT_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;
const LOCATION_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;
const USER_SORT_FIELDS = [
  'createdAt',
  'email',
  'firstName',
  'lastLoginAt',
  'lastName',
  'updatedAt',
] as const;

type CompanyUserReferenceRecord = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

@Injectable()
export class HrReferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: HrReferenceService,
  ) {}

  async listDepartmentReferences(
    companyId: string,
    query: DepartmentsListQueryDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.DepartmentWhereInput = {
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
    const sortField = resolveSortField(query.sortBy, DEPARTMENT_SORT_FIELDS, 'name');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.DepartmentOrderByWithRelationInput;
    const [items, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      items: items.map((department) => ({
        id: department.id,
        companyId: department.companyId,
        code: department.code,
        name: department.name,
        description: department.description,
        isActive: department.isActive,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString(),
      })),
      meta: buildPaginationMeta(query, total),
    };
  }

  async listLocationReferences(
    companyId: string,
    query: LocationsListQueryDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.LocationWhereInput = {
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
    const sortField = resolveSortField(query.sortBy, LOCATION_SORT_FIELDS, 'name');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.LocationOrderByWithRelationInput;
    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      items: items.map((location) => ({
        id: location.id,
        companyId: location.companyId,
        code: location.code,
        name: location.name,
        description: location.description,
        isActive: location.isActive,
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString(),
      })),
      meta: buildPaginationMeta(query, total),
    };
  }

  async listUserReferences(companyId: string, query: CompanyUsersListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const normalizedRoleCode = query.roleCode?.trim().toLowerCase();
    const andConditions: Prisma.UserWhereInput[] = [
      {
        userRoles: {
          some: {
            companyId,
          },
        },
      },
    ];

    if (query.search) {
      andConditions.push({
        OR: [
          {
            email: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (normalizedRoleCode) {
      andConditions.push({
        userRoles: {
          some: {
            companyId,
            role: {
              code: normalizedRoleCode,
            },
          },
        },
      });
    }

    if (query.isActive === true) {
      andConditions.push({
        userRoles: {
          some: {
            companyId,
            ...(normalizedRoleCode
              ? {
                  role: {
                    code: normalizedRoleCode,
                    isActive: true,
                  },
                }
              : {
                  role: {
                    isActive: true,
                  },
                }),
            isActive: true,
          },
        },
      });
    }

    if (query.isActive === false) {
      andConditions.push({
        NOT: {
          userRoles: {
            some: {
              companyId,
              ...(normalizedRoleCode
                ? {
                    role: {
                      code: normalizedRoleCode,
                      isActive: true,
                    },
                  }
                : {
                    role: {
                      isActive: true,
                    },
                  }),
              isActive: true,
            },
          },
        },
      });
    }

    const where: Prisma.UserWhereInput = {
      AND: andConditions,
    };
    const sortField = resolveSortField(query.sortBy, USER_SORT_FIELDS, 'email');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.UserOrderByWithRelationInput;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            where: {
              companyId,
            },
            include: {
              role: true,
            },
          },
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => this.mapCompanyUser(user)),
      meta: buildPaginationMeta(query, total),
    };
  }

  private mapCompanyUser(user: CompanyUserReferenceRecord) {
    const roles = Array.from(
      new Set(
        user.userRoles
          .filter((assignment) => assignment.isActive && assignment.role.isActive)
          .map((assignment) => assignment.role.code),
      ),
    ).sort();

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      identityIsActive: user.isActive,
      companyAccessIsActive: roles.length > 0,
      roles,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
