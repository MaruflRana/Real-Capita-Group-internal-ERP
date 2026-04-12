import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
import { buildPaginationMeta, getPaginationSkip } from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { AssignRoleDto } from './dto/assign-role.dto';
import type { RoleAssignmentsListQueryDto } from './dto/role-assignments-list-query.dto';

const ROLE_ASSIGNMENT_SORT_FIELDS = [
  'createdAt',
  'roleCode',
  'roleName',
  'updatedAt',
] as const;

type RoleAssignmentRecord = Prisma.UserRoleGetPayload<{
  include: {
    role: true;
  };
}>;

@Injectable()
export class RoleAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listUserRoleAssignments(
    companyId: string,
    userId: string,
    query: RoleAssignmentsListQueryDto,
  ) {
    await this.assertCompanyExists(companyId);
    await this.assertUserExistsInCompany(companyId, userId);

    const where: Prisma.UserRoleWhereInput = {
      companyId,
      userId,
      ...(query.isActive === undefined
        ? {}
        : {
            isActive: query.isActive,
          }),
      ...(query.search
        ? {
            OR: [
              {
                role: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                role: {
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
      ROLE_ASSIGNMENT_SORT_FIELDS,
      'roleCode',
    );
    const orderBy = this.buildOrderBy(sortField, query.sortOrder);
    const [assignments, total] = await Promise.all([
      this.prisma.userRole.findMany({
        where,
        include: {
          role: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.userRole.count({
        where,
      }),
    ]);

    return {
      items: assignments.map((assignment) => this.mapAssignment(assignment)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async assignRole(
    companyId: string,
    userId: string,
    actorUserId: string,
    requestId: string | undefined,
    assignRoleDto: AssignRoleDto,
  ) {
    await this.assertCompanyExists(companyId);

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.isActive) {
      throw new BadRequestException(
        'The user identity is inactive and cannot receive company role assignments.',
      );
    }

    const normalizedRoleCode = assignRoleDto.roleCode.trim().toLowerCase();
    const role = await this.prisma.role.findUnique({
      where: {
        code: normalizedRoleCode,
      },
    });

    if (!role?.isActive) {
      throw new NotFoundException('Role not found.');
    }

    const assignment = await this.prisma.userRole.upsert({
      where: {
        userId_companyId_roleId: {
          userId,
          companyId,
          roleId: role.id,
        },
      },
      create: {
        userId,
        companyId,
        roleId: role.id,
      },
      update: {
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    await this.auditService.recordEvent({
      companyId,
      actorUserId,
      category: 'ADMIN',
      eventType: AUDIT_EVENT_TYPES.userRoleAssigned,
      targetEntityType: 'USER_ROLE',
      targetEntityId: assignment.id,
      requestId,
      metadata: {
        userId,
        roleCode: assignment.role.code,
      },
    });

    return this.mapAssignment(assignment);
  }

  async removeRole(
    companyId: string,
    userId: string,
    roleCode: string,
    actorUserId: string,
    requestId: string | undefined,
  ) {
    await this.assertCompanyExists(companyId);

    const normalizedRoleCode = roleCode.trim().toLowerCase();
    const role = await this.prisma.role.findUnique({
      where: {
        code: normalizedRoleCode,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    const assignment = await this.prisma.userRole.findUnique({
      where: {
        userId_companyId_roleId: {
          userId,
          companyId,
          roleId: role.id,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        'Role assignment was not found for the requested user and company.',
      );
    }

    const updatedAssignment = await this.prisma.userRole.update({
      where: {
        id: assignment.id,
      },
      data: {
        isActive: false,
      },
      include: {
        role: true,
      },
    });

    await this.auditService.recordEvent({
      companyId,
      actorUserId,
      category: 'ADMIN',
      eventType: AUDIT_EVENT_TYPES.userRoleRemoved,
      targetEntityType: 'USER_ROLE',
      targetEntityId: updatedAssignment.id,
      requestId,
      metadata: {
        userId,
        roleCode: updatedAssignment.role.code,
      },
    });

    return this.mapAssignment(updatedAssignment);
  }

  private buildOrderBy(
    sortField: (typeof ROLE_ASSIGNMENT_SORT_FIELDS)[number],
    sortOrder: 'asc' | 'desc',
  ): Prisma.UserRoleOrderByWithRelationInput {
    if (sortField === 'roleCode') {
      return {
        role: {
          code: sortOrder,
        },
      };
    }

    if (sortField === 'roleName') {
      return {
        role: {
          name: sortOrder,
        },
      };
    }

    return {
      [sortField]: sortOrder,
    };
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

  private async assertUserExistsInCompany(
    companyId: string,
    userId: string,
  ): Promise<void> {
    const assignment = await this.prisma.userRole.findFirst({
      where: {
        companyId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('User not found in the company.');
    }
  }

  private mapAssignment(assignment: RoleAssignmentRecord) {
    return {
      id: assignment.id,
      companyId: assignment.companyId,
      userId: assignment.userId,
      roleId: assignment.roleId,
      roleCode: assignment.role.code,
      roleName: assignment.role.name,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    };
  }
}
