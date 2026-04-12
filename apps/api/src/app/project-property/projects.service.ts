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
  isUniqueConstraintError,
  toConflictException,
} from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type {
  CostCenterDto,
  CostCentersListQueryDto,
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-centers.dto';
import type {
  CreateProjectDto,
  ProjectDto,
  ProjectsListQueryDto,
  UpdateProjectDto,
} from './dto/projects.dto';

const PROJECT_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;
const COST_CENTER_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;

type ProjectRecord = Prisma.ProjectGetPayload<{
  include: {
    location: true;
  };
}>;

type CostCenterRecord = Prisma.CostCenterGetPayload<{
  include: {
    project: true;
  };
}>;

@Injectable()
export class ProjectMastersService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(companyId: string, query: ProjectsListQueryDto) {
    await this.assertCompanyExists(companyId);

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

  async getProjectDetail(companyId: string, projectId: string) {
    const project = await this.getProjectRecord(companyId, projectId);

    return this.mapProject(project);
  }

  async createProject(companyId: string, createProjectDto: CreateProjectDto) {
    await this.assertCompanyExists(companyId);

    if (createProjectDto.locationId) {
      await this.assertLocationBelongsToCompany(companyId, createProjectDto.locationId);
    }

    const normalizedInput = this.normalizeCodeNameInput(createProjectDto);

    await this.assertProjectUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const project = await this.prisma.project.create({
        data: {
          companyId,
          locationId: createProjectDto.locationId ?? null,
          ...normalizedInput,
        },
      });

      return this.getProjectDetail(companyId, project.id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A project with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async updateProject(
    companyId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const existingProject = await this.getProjectRecord(companyId, projectId);
    const locationId =
      updateProjectDto.locationId === undefined
        ? existingProject.locationId
        : (updateProjectDto.locationId ?? null);

    if (locationId) {
      await this.assertLocationBelongsToCompany(companyId, locationId);
    }

    const normalizedInput = this.normalizeCodeNameInput({
      code: updateProjectDto.code ?? existingProject.code,
      name: updateProjectDto.name ?? existingProject.name,
      description:
        updateProjectDto.description === undefined
          ? existingProject.description
          : updateProjectDto.description,
    });

    await this.assertProjectUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingProject.id,
    );

    const data: Prisma.ProjectUncheckedUpdateInput = {
      locationId,
      ...normalizedInput,
    };

    try {
      const project = await this.prisma.project.update({
        where: {
          id: existingProject.id,
        },
        data,
      });

      return this.getProjectDetail(companyId, project.id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A project with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async setProjectActiveState(
    companyId: string,
    projectId: string,
    isActive: boolean,
  ) {
    await this.getProjectRecord(companyId, projectId);

    const project = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        isActive,
      },
      include: {
        location: true,
      },
    });

    return this.mapProject(project);
  }

  async listCostCenters(companyId: string, query: CostCentersListQueryDto) {
    await this.assertCompanyExists(companyId);

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

  async getCostCenterDetail(companyId: string, costCenterId: string) {
    const costCenter = await this.getCostCenterRecord(companyId, costCenterId);

    return this.mapCostCenter(costCenter);
  }

  async createCostCenter(
    companyId: string,
    createCostCenterDto: CreateCostCenterDto,
  ) {
    await this.assertCompanyExists(companyId);

    if (createCostCenterDto.projectId) {
      await this.assertProjectBelongsToCompany(companyId, createCostCenterDto.projectId);
    }

    const normalizedInput = this.normalizeCodeNameInput(createCostCenterDto);

    await this.assertCostCenterUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const costCenter = await this.prisma.costCenter.create({
        data: {
          companyId,
          projectId: createCostCenterDto.projectId ?? null,
          ...normalizedInput,
        },
      });

      return this.getCostCenterDetail(companyId, costCenter.id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A cost center with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async updateCostCenter(
    companyId: string,
    costCenterId: string,
    updateCostCenterDto: UpdateCostCenterDto,
  ) {
    const existingCostCenter = await this.getCostCenterRecord(companyId, costCenterId);
    const projectId =
      updateCostCenterDto.projectId === undefined
        ? existingCostCenter.projectId
        : (updateCostCenterDto.projectId ?? null);

    if (projectId) {
      await this.assertProjectBelongsToCompany(companyId, projectId);
    }

    const normalizedInput = this.normalizeCodeNameInput({
      code: updateCostCenterDto.code ?? existingCostCenter.code,
      name: updateCostCenterDto.name ?? existingCostCenter.name,
      description:
        updateCostCenterDto.description === undefined
          ? existingCostCenter.description
          : updateCostCenterDto.description,
    });

    await this.assertCostCenterUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingCostCenter.id,
    );

    try {
      const costCenter = await this.prisma.costCenter.update({
        where: {
          id: existingCostCenter.id,
        },
        data: {
          projectId,
          ...normalizedInput,
        },
      });

      return this.getCostCenterDetail(companyId, costCenter.id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A cost center with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async setCostCenterActiveState(
    companyId: string,
    costCenterId: string,
    isActive: boolean,
  ) {
    await this.getCostCenterRecord(companyId, costCenterId);

    const costCenter = await this.prisma.costCenter.update({
      where: {
        id: costCenterId,
      },
      data: {
        isActive,
      },
      include: {
        project: true,
      },
    });

    return this.mapCostCenter(costCenter);
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

  private async assertLocationBelongsToCompany(
    companyId: string,
    locationId: string,
  ): Promise<void> {
    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }
  }

  private async assertProjectBelongsToCompany(
    companyId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
  }

  private async getProjectRecord(companyId: string, projectId: string) {
    await this.assertCompanyExists(companyId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        companyId,
      },
      include: {
        location: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  private async getCostCenterRecord(companyId: string, costCenterId: string) {
    await this.assertCompanyExists(companyId);

    const costCenter = await this.prisma.costCenter.findFirst({
      where: {
        id: costCenterId,
        companyId,
      },
      include: {
        project: true,
      },
    });

    if (!costCenter) {
      throw new NotFoundException('Cost center not found.');
    }

    return costCenter;
  }

  private async assertProjectUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredProjectId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.project.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredProjectId ? { id: { not: ignoredProjectId } } : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.project.findFirst({
        where: {
          companyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredProjectId ? { id: { not: ignoredProjectId } } : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'A project with this code already exists in the company.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A project with this name already exists in the company.',
      );
    }
  }

  private async assertCostCenterUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredCostCenterId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.costCenter.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredCostCenterId
            ? {
                id: {
                  not: ignoredCostCenterId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.costCenter.findFirst({
        where: {
          companyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredCostCenterId
            ? {
                id: {
                  not: ignoredCostCenterId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'A cost center with this code already exists in the company.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A cost center with this name already exists in the company.',
      );
    }
  }

  private normalizeCodeNameInput(input: {
    code: string;
    name: string;
    description?: string | null;
  }) {
    return {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
    };
  }

  private mapProject(project: ProjectRecord): ProjectDto {
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

  private mapCostCenter(costCenter: CostCenterRecord): CostCenterDto {
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
}
