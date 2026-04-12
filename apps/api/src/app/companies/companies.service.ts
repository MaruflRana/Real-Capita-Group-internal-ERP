import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
import { ROLE_COMPANY_ADMIN } from '../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';
import { buildPaginationMeta, getPaginationSkip } from '../common/utils/pagination.util';
import { isUniqueConstraintError, toConflictException } from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import type { CompaniesListQueryDto } from './dto/companies-list-query.dto';
import type { CreateCompanyDto } from './dto/create-company.dto';
import type { UpdateCompanyDto } from './dto/update-company.dto';

const COMPANY_SORT_FIELDS = ['createdAt', 'name', 'slug', 'updatedAt'] as const;

type CompanyRecord = Prisma.CompanyGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async listVisibleCompanies(
    authenticatedUser: AuthenticatedUser,
    query: CompaniesListQueryDto,
  ) {
    const where: Prisma.CompanyWhereInput = {
      userRoles: {
        some: {
          userId: authenticatedUser.id,
          isActive: true,
          user: {
            isActive: true,
          },
          role: {
            isActive: true,
          },
        },
      },
      ...(query.isActive === undefined
        ? {}
        : {
            isActive: query.isActive,
          }),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                slug: {
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
      COMPANY_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.CompanyOrderByWithRelationInput;
    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          userRoles: {
            where: {
              userId: authenticatedUser.id,
              isActive: true,
              role: {
                isActive: true,
              },
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
      this.prisma.company.count({
        where,
      }),
    ]);

    return {
      items: companies.map((company) => this.mapCompany(company)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getCompanyDetail(companyId: string, userId: string) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      include: {
        userRoles: {
          where: {
            userId,
            isActive: true,
            role: {
              isActive: true,
            },
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    return this.mapCompany(company);
  }

  async createCompany(
    authenticatedUser: AuthenticatedUser,
    requestId: string | undefined,
    createCompanyDto: CreateCompanyDto,
  ) {
    const adminRole = await this.prisma.role.findUnique({
      where: {
        code: ROLE_COMPANY_ADMIN,
      },
    });

    if (!adminRole?.isActive) {
      throw new BadRequestException(
        'The company_admin role is not available for company creation.',
      );
    }

    const normalizedInput = {
      name: createCompanyDto.name.trim(),
      slug: createCompanyDto.slug.trim().toLowerCase(),
    };

    try {
      return await this.databaseService.withTransaction(async (transaction) => {
        const company = await transaction.company.create({
          data: normalizedInput,
        });

        await transaction.userRole.upsert({
          where: {
            userId_companyId_roleId: {
              userId: authenticatedUser.id,
              companyId: company.id,
              roleId: adminRole.id,
            },
          },
          create: {
            userId: authenticatedUser.id,
            companyId: company.id,
            roleId: adminRole.id,
          },
          update: {
            isActive: true,
          },
        });

        await this.auditService.recordEvent(
          {
            companyId: company.id,
            actorUserId: authenticatedUser.id,
            category: 'ADMIN',
            eventType: AUDIT_EVENT_TYPES.companyCreated,
            targetEntityType: 'COMPANY',
            targetEntityId: company.id,
            requestId,
            metadata: {
              name: company.name,
              slug: company.slug,
            },
          },
          transaction,
        );

        return this.mapCompany({
          ...company,
          userRoles: [
            {
              id: 'created-assignment',
              userId: authenticatedUser.id,
              companyId: company.id,
              roleId: adminRole.id,
              isActive: true,
              createdAt: company.createdAt,
              updatedAt: company.updatedAt,
              role: adminRole,
            },
          ],
        } as CompanyRecord);
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException('A company with this slug already exists.');
      }

      throw error;
    }
  }

  async updateCompany(
    companyId: string,
    userId: string,
    requestId: string | undefined,
    updateCompanyDto: UpdateCompanyDto,
  ) {
    await this.assertCompanyExists(companyId);

    const data: Prisma.CompanyUpdateInput = {};

    if (updateCompanyDto.name !== undefined) {
      data.name = updateCompanyDto.name.trim();
    }

    if (updateCompanyDto.slug !== undefined) {
      data.slug = updateCompanyDto.slug.trim().toLowerCase();
    }

    if (Object.keys(data).length === 0) {
      return this.getCompanyDetail(companyId, userId);
    }

    try {
      await this.databaseService.withTransaction(async (transaction) => {
        const updatedCompany = await transaction.company.update({
          where: {
            id: companyId,
          },
          data,
        });

        await this.auditService.recordEvent(
          {
            companyId,
            actorUserId: userId,
            category: 'ADMIN',
            eventType: AUDIT_EVENT_TYPES.companyUpdated,
            targetEntityType: 'COMPANY',
            targetEntityId: companyId,
            requestId,
            metadata: {
              name: updatedCompany.name,
              slug: updatedCompany.slug,
            },
          },
          transaction,
        );
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException('A company with this slug already exists.');
      }

      throw error;
    }

    return this.getCompanyDetail(companyId, userId);
  }

  async setCompanyActiveState(
    companyId: string,
    userId: string,
    requestId: string | undefined,
    isActive: boolean,
  ) {
    await this.assertCompanyExists(companyId);

    await this.databaseService.withTransaction(async (transaction) => {
      await transaction.company.update({
        where: {
          id: companyId,
        },
        data: {
          isActive,
        },
      });

      await this.auditService.recordEvent(
        {
          companyId,
          actorUserId: userId,
          category: 'ADMIN',
          eventType: isActive
            ? AUDIT_EVENT_TYPES.companyActivated
            : AUDIT_EVENT_TYPES.companyDeactivated,
          targetEntityType: 'COMPANY',
          targetEntityId: companyId,
          requestId,
        },
        transaction,
      );
    });

    return this.getCompanyDetail(companyId, userId);
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

  private mapCompany(company: CompanyRecord) {
    const currentUserRoles = Array.from(
      new Set(company.userRoles.map((userRole) => userRole.role.code)),
    ).sort();

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      isActive: company.isActive,
      currentUserRoles,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }
}
