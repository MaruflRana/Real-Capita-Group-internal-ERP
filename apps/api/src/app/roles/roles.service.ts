import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { buildPaginationMeta, getPaginationSkip } from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { RolesListQueryDto } from './dto/roles-list-query.dto';

const ROLE_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;

type RoleRecord = Prisma.RoleGetPayload<object>;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(query: RolesListQueryDto) {
    const where: Prisma.RoleWhereInput = {
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
    const sortField = resolveSortField(query.sortBy, ROLE_SORT_FIELDS, 'name');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.RoleOrderByWithRelationInput;
    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.role.count({
        where,
      }),
    ]);

    return {
      items: roles.map((role) => this.mapRole(role)),
      meta: buildPaginationMeta(query, total),
    };
  }

  private mapRole(role: RoleRecord) {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }
}
