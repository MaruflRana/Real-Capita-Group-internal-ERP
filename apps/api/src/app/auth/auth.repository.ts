import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { DatabaseTransactionClient } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';

const userRoleWithRelationsArgs = Prisma.validator<Prisma.UserRoleDefaultArgs>()({
  include: {
    company: true,
    role: true,
    user: true,
  },
});

const userWithAssignmentsArgs = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    userRoles: {
      include: {
        company: true,
        role: true,
      },
    },
  },
});

const refreshTokenWithRelationsArgs =
  Prisma.validator<Prisma.RefreshTokenDefaultArgs>()({
    include: {
      company: true,
      user: true,
    },
  });

export type UserWithAssignmentsRecord = Prisma.UserGetPayload<
  typeof userWithAssignmentsArgs
>;
export type UserRoleWithRelationsRecord = Prisma.UserRoleGetPayload<
  typeof userRoleWithRelationsArgs
>;
export type RefreshTokenRecord = Prisma.RefreshTokenGetPayload<
  typeof refreshTokenWithRelationsArgs
>;

type PrismaClientLike = PrismaService | DatabaseTransactionClient;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<UserWithAssignmentsRecord | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        userRoles: {
          where: {
            isActive: true,
            company: {
              isActive: true,
            },
            role: {
              isActive: true,
            },
          },
          include: {
            company: true,
            role: true,
          },
        },
      },
    });
  }

  async findUserById(userId: string): Promise<UserWithAssignmentsRecord | null> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        userRoles: {
          where: {
            isActive: true,
            company: {
              isActive: true,
            },
            role: {
              isActive: true,
            },
          },
          include: {
            company: true,
            role: true,
          },
        },
      },
    });
  }

  async findUserCompanyAccess(
    userId: string,
    companyId: string,
  ): Promise<UserRoleWithRelationsRecord[] | null> {
    const assignments = await this.prisma.userRole.findMany({
      where: {
        userId,
        companyId,
        isActive: true,
        user: {
          isActive: true,
        },
        company: {
          isActive: true,
        },
        role: {
          isActive: true,
        },
      },
      include: {
        company: true,
        role: true,
        user: true,
      },
    });

    return assignments.length > 0 ? assignments : null;
  }

  async createRefreshToken(
    data: Prisma.RefreshTokenUncheckedCreateInput,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.refreshToken.create({
      data,
    });
  }

  async findRefreshTokenByTokenId(
    tokenId: string,
  ): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({
      where: {
        tokenId,
      },
      include: {
        company: true,
        user: true,
      },
    });
  }

  async markRefreshTokenRotated(
    id: string,
    replacedByTokenId: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'rotated',
        replacedByTokenId,
        lastUsedAt: new Date(),
      },
    });
  }

  async revokeRefreshTokenFamily(
    familyId: string,
    reason: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  async updateUserLastLogin(
    userId: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.user.update({
      where: {
        id: userId,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async findCompanyBySlug(
    slug: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.company.findUnique({
      where: {
        slug,
      },
    });
  }

  async createCompany(
    name: string,
    slug: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.company.create({
      data: {
        name,
        slug,
      },
    });
  }

  async updateCompanyName(
    companyId: string,
    name: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.company.update({
      where: {
        id: companyId,
      },
      data: {
        name,
      },
    });
  }

  async findRoleByCode(
    code: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.role.findUnique({
      where: {
        code,
      },
    });
  }

  async upsertRole(
    role: {
      code: string;
      name: string;
      description?: string;
    },
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.role.upsert({
      where: {
        code: role.code,
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description ?? null,
      },
      update: {
        name: role.name,
        description: role.description ?? null,
        isActive: true,
      },
    });
  }

  async findAnyUserByEmail(
    email: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.user.findUnique({
      where: {
        email,
      },
    });
  }

  async createUser(
    email: string,
    passwordHash: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.user.create({
      data: {
        email,
        passwordHash,
      },
    });
  }

  async findUserRoleAssignment(
    userId: string,
    companyId: string,
    roleId: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.userRole.findUnique({
      where: {
        userId_companyId_roleId: {
          userId,
          companyId,
          roleId,
        },
      },
    });
  }

  async ensureUserRole(
    userId: string,
    companyId: string,
    roleId: string,
    transaction?: DatabaseTransactionClient,
  ) {
    const client = this.getClient(transaction);

    return client.userRole.upsert({
      where: {
        userId_companyId_roleId: {
          userId,
          companyId,
          roleId,
        },
      },
      create: {
        userId,
        companyId,
        roleId,
      },
      update: {
        isActive: true,
      },
    });
  }

  private getClient(
    transaction?: DatabaseTransactionClient,
  ): PrismaClientLike {
    return transaction ?? this.prisma;
  }
}
