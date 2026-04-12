import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';
import { buildPaginationMeta, getPaginationSkip } from '../common/utils/pagination.util';
import { isUniqueConstraintError, toConflictException } from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';
import type { CompanyUsersListQueryDto } from './dto/company-users-list-query.dto';
import type { CreateCompanyUserDto } from './dto/create-company-user.dto';
import type { UpdateCompanyUserDto } from './dto/update-company-user.dto';

const USER_SORT_FIELDS = [
  'createdAt',
  'email',
  'firstName',
  'lastLoginAt',
  'lastName',
  'updatedAt',
] as const;

type CompanyUserRecord = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async listUsers(companyId: string, query: CompanyUsersListQueryDto) {
    await this.assertCompanyExists(companyId);

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
    const [users, total] = await Promise.all([
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
      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      items: users.map((user) => this.mapUser(user)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getUserDetail(companyId: string, userId: string) {
    const user = await this.getCompanyUserRecord(companyId, userId);

    return this.mapUser(user);
  }

  async createUser(
    companyId: string,
    actorUserId: string,
    requestId: string | undefined,
    createCompanyUserDto: CreateCompanyUserDto,
  ) {
    await this.assertCompanyExists(companyId);

    const normalizedEmail = createCompanyUserDto.email.trim().toLowerCase();
    const normalizedRoleCodes = Array.from(
      new Set(
        createCompanyUserDto.roleCodes.map((roleCode) =>
          roleCode.trim().toLowerCase(),
        ),
      ),
    );

    if (normalizedRoleCodes.some((roleCode) => roleCode.length === 0)) {
      throw new BadRequestException('roleCodes must not contain empty values.');
    }

    const passwordHash = await this.passwordService.hashPassword(
      createCompanyUserDto.password,
    );
    const createdUserId = await this.databaseService.withTransaction(
      async (transaction) => {
        const existingUser = await transaction.user.findUnique({
          where: {
            email: normalizedEmail,
          },
          select: {
            id: true,
          },
        });

        if (existingUser) {
          throw toConflictException('A user with this email already exists.');
        }

        const roles = await transaction.role.findMany({
          where: {
            code: {
              in: normalizedRoleCodes,
            },
            isActive: true,
          },
        });

        if (roles.length !== normalizedRoleCodes.length) {
          const resolvedRoleCodes = new Set(roles.map((role) => role.code));
          const missingRoleCodes = normalizedRoleCodes.filter(
            (roleCode) => !resolvedRoleCodes.has(roleCode),
          );

          throw new NotFoundException(
            `The following roles were not found or are inactive: ${missingRoleCodes.join(', ')}.`,
          );
        }

        try {
          const user = await transaction.user.create({
            data: {
              email: normalizedEmail,
              passwordHash,
              firstName: createCompanyUserDto.firstName?.trim() ?? null,
              lastName: createCompanyUserDto.lastName?.trim() ?? null,
            },
          });

          await transaction.userRole.createMany({
            data: roles.map((role) => ({
              userId: user.id,
              companyId,
              roleId: role.id,
            })),
          });

          await this.auditService.recordEvent(
            {
              companyId,
              actorUserId,
              category: 'ADMIN',
              eventType: AUDIT_EVENT_TYPES.userCreated,
              targetEntityType: 'USER',
              targetEntityId: user.id,
              requestId,
              metadata: {
                email: user.email,
                roleCodes: roles.map((role) => role.code),
              },
            },
            transaction,
          );

          return user.id;
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throw toConflictException('A user with this email already exists.');
          }

          throw error;
        }
      },
    );

    return this.getUserDetail(companyId, createdUserId);
  }

  async updateUser(
    companyId: string,
    userId: string,
    actorUserId: string,
    requestId: string | undefined,
    updateCompanyUserDto: UpdateCompanyUserDto,
  ) {
    const user = await this.getCompanyUserRecord(companyId, userId);
    const data: Prisma.UserUpdateInput = {};

    if (updateCompanyUserDto.firstName !== undefined) {
      data.firstName = updateCompanyUserDto.firstName.trim() || null;
    }

    if (updateCompanyUserDto.lastName !== undefined) {
      data.lastName = updateCompanyUserDto.lastName.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return this.mapUser(user);
    }

    await this.databaseService.withTransaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: {
          id: user.id,
        },
        data,
      });

      await this.auditService.recordEvent(
        {
          companyId,
          actorUserId,
          category: 'ADMIN',
          eventType: AUDIT_EVENT_TYPES.userUpdated,
          targetEntityType: 'USER',
          targetEntityId: updatedUser.id,
          requestId,
          metadata: {
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
          },
        },
        transaction,
      );
    });

    return this.getUserDetail(companyId, userId);
  }

  async setUserCompanyAccessState(
    companyId: string,
    userId: string,
    actorUserId: string,
    requestId: string | undefined,
    isActive: boolean,
  ) {
    await this.getCompanyUserRecord(companyId, userId);

    await this.databaseService.withTransaction(async (transaction) => {
      await transaction.userRole.updateMany({
        where: {
          companyId,
          userId,
        },
        data: {
          isActive,
        },
      });

      await this.auditService.recordEvent(
        {
          companyId,
          actorUserId,
          category: 'ADMIN',
          eventType: isActive
            ? AUDIT_EVENT_TYPES.userAccessActivated
            : AUDIT_EVENT_TYPES.userAccessDeactivated,
          targetEntityType: 'USER',
          targetEntityId: userId,
          requestId,
        },
        transaction,
      );
    });

    return this.getUserDetail(companyId, userId);
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

  private async getCompanyUserRecord(companyId: string, userId: string) {
    await this.assertCompanyExists(companyId);

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        userRoles: {
          some: {
            companyId,
          },
        },
      },
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
    });

    if (!user) {
      throw new NotFoundException('User not found in the company.');
    }

    return user;
  }

  private mapUser(user: CompanyUserRecord) {
    const activeRoleCodes = Array.from(
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
      companyAccessIsActive: activeRoleCodes.length > 0,
      roles: activeRoleCodes,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
