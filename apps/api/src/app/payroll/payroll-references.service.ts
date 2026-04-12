import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { buildPaginationMeta, getPaginationSkip } from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { ParticularAccountsListQueryDto } from '../chart-of-accounts/dto/particular-accounts.dto';
import type { EmployeesListQueryDto } from '../hr/dto/employees.dto';
import type { CostCentersListQueryDto } from '../project-property/dto/cost-centers.dto';
import type { ProjectsListQueryDto } from '../project-property/dto/projects.dto';
import { PayrollReferenceService } from './payroll-reference.service';

type ProjectReferenceRecord = Prisma.ProjectGetPayload<{
  include: {
    location: true;
  };
}>;

type CostCenterReferenceRecord = Prisma.CostCenterGetPayload<{
  include: {
    project: true;
  };
}>;

type EmployeeReferenceRecord = Prisma.EmployeeGetPayload<{
  include: {
    department: true;
    location: true;
    user: true;
    manager: true;
  };
}>;

type ParticularAccountReferenceRecord = Prisma.ParticularAccountGetPayload<{
  include: {
    ledgerAccount: {
      include: {
        accountGroup: {
          include: {
            accountClass: true;
          };
        };
      };
    };
  };
}>;

const PROJECT_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;
const COST_CENTER_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;
const EMPLOYEE_SORT_FIELDS = [
  'createdAt',
  'employeeCode',
  'fullName',
  'updatedAt',
] as const;
const PARTICULAR_ACCOUNT_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;

@Injectable()
export class PayrollReferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: PayrollReferenceService,
  ) {}

  async listProjectReferences(companyId: string, query: ProjectsListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.ProjectWhereInput = {
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
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(query.sortBy, PROJECT_SORT_FIELDS, 'name');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.ProjectOrderByWithRelationInput;
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          location: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.project.count({
        where,
      }),
    ]);

    return {
      items: projects.map((project) => this.mapProject(project)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async listCostCenterReferences(
    companyId: string,
    query: CostCentersListQueryDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.CostCenterWhereInput = {
      companyId,
      ...(query.projectId ? { projectId: query.projectId } : {}),
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
                project: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                project: {
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
      COST_CENTER_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.CostCenterOrderByWithRelationInput;
    const [costCenters, total] = await Promise.all([
      this.prisma.costCenter.findMany({
        where,
        include: {
          project: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.costCenter.count({
        where,
      }),
    ]);

    return {
      items: costCenters.map((costCenter) => this.mapCostCenter(costCenter)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async listEmployeeReferences(
    companyId: string,
    query: EmployeesListQueryDto,
  ) {
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
        include: {
          department: true,
          location: true,
          user: true,
          manager: true,
        },
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

  async listParticularAccountReferences(
    companyId: string,
    query: ParticularAccountsListQueryDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.ParticularAccountWhereInput = {
      companyId,
      ...(query.ledgerAccountId
        ? {
            ledgerAccountId: query.ledgerAccountId,
          }
        : {}),
      ...(query.accountGroupId || query.accountClassId
        ? {
            ledgerAccount: {
              ...(query.accountGroupId
                ? {
                    accountGroupId: query.accountGroupId,
                  }
                : {}),
              ...(query.accountClassId
                ? {
                    accountGroup: {
                      accountClassId: query.accountClassId,
                    },
                  }
                : {}),
            },
          }
        : {}),
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
                ledgerAccount: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                ledgerAccount: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                ledgerAccount: {
                  accountGroup: {
                    code: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                ledgerAccount: {
                  accountGroup: {
                    name: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      PARTICULAR_ACCOUNT_SORT_FIELDS,
      'code',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.ParticularAccountOrderByWithRelationInput;
    const [particularAccounts, total] = await Promise.all([
      this.prisma.particularAccount.findMany({
        where,
        include: {
          ledgerAccount: {
            include: {
              accountGroup: {
                include: {
                  accountClass: true,
                },
              },
            },
          },
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.particularAccount.count({
        where,
      }),
    ]);

    return {
      items: particularAccounts.map((account) =>
        this.mapParticularAccount(account),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  private mapProject(project: ProjectReferenceRecord) {
    return {
      id: project.id,
      companyId: project.companyId,
      locationId: project.locationId,
      locationCode: project.location?.code ?? null,
      locationName: project.location?.name ?? null,
      code: project.code,
      name: project.name,
      description: project.description,
      isActive: project.isActive,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private mapCostCenter(costCenter: CostCenterReferenceRecord) {
    return {
      id: costCenter.id,
      companyId: costCenter.companyId,
      projectId: costCenter.projectId,
      projectCode: costCenter.project?.code ?? null,
      projectName: costCenter.project?.name ?? null,
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description,
      isActive: costCenter.isActive,
      createdAt: costCenter.createdAt.toISOString(),
      updatedAt: costCenter.updatedAt.toISOString(),
    };
  }

  private mapEmployee(employee: EmployeeReferenceRecord) {
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

  private mapParticularAccount(
    particularAccount: ParticularAccountReferenceRecord,
  ) {
    return {
      id: particularAccount.id,
      companyId: particularAccount.companyId,
      accountClassId: particularAccount.ledgerAccount.accountGroup.accountClassId,
      accountClassCode: particularAccount.ledgerAccount.accountGroup.accountClass.code,
      accountClassName: particularAccount.ledgerAccount.accountGroup.accountClass.name,
      accountGroupId: particularAccount.ledgerAccount.accountGroupId,
      accountGroupCode: particularAccount.ledgerAccount.accountGroup.code,
      accountGroupName: particularAccount.ledgerAccount.accountGroup.name,
      ledgerAccountId: particularAccount.ledgerAccountId,
      ledgerAccountCode: particularAccount.ledgerAccount.code,
      ledgerAccountName: particularAccount.ledgerAccount.name,
      code: particularAccount.code,
      name: particularAccount.name,
      description: particularAccount.description,
      isActive: particularAccount.isActive,
      createdAt: particularAccount.createdAt.toISOString(),
      updatedAt: particularAccount.updatedAt.toISOString(),
    };
  }
}
