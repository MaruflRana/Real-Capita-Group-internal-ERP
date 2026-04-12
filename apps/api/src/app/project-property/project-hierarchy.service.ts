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
  BlockDto,
  BlocksListQueryDto,
  CreateBlockDto,
  UpdateBlockDto,
} from './dto/blocks.dto';
import type {
  CreateProjectPhaseDto,
  ProjectPhaseDto,
  ProjectPhasesListQueryDto,
  UpdateProjectPhaseDto,
} from './dto/project-phases.dto';
import type {
  CreateZoneDto,
  UpdateZoneDto,
  ZoneDto,
  ZonesListQueryDto,
} from './dto/zones.dto';

const PROJECT_PHASE_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;
const BLOCK_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;
const ZONE_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;

type ProjectSummaryRecord = Prisma.ProjectGetPayload<object>;
type ProjectPhaseRecord = Prisma.ProjectPhaseGetPayload<{
  include: {
    project: true;
  };
}>;
type BlockRecord = Prisma.BlockGetPayload<{
  include: {
    project: true;
    phase: true;
  };
}>;
type ZoneRecord = Prisma.ZoneGetPayload<{
  include: {
    project: true;
    block: true;
  };
}>;

@Injectable()
export class ProjectHierarchyService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjectPhases(companyId: string, query: ProjectPhasesListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.ProjectPhaseWhereInput = {
      project: {
        companyId,
        ...(query.projectId ? { id: query.projectId } : {}),
      },
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
      PROJECT_PHASE_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.ProjectPhaseOrderByWithRelationInput;
    const [projectPhases, total] = await Promise.all([
      this.prisma.projectPhase.findMany({
        where,
        include: {
          project: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.projectPhase.count({
        where,
      }),
    ]);

    return {
      items: projectPhases.map((projectPhase) =>
        this.mapProjectPhase(projectPhase),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getProjectPhaseDetail(companyId: string, projectPhaseId: string) {
    const projectPhase = await this.getProjectPhaseRecord(companyId, projectPhaseId);

    return this.mapProjectPhase(projectPhase);
  }

  async createProjectPhase(
    companyId: string,
    createProjectPhaseDto: CreateProjectPhaseDto,
  ) {
    const project = await this.assertProjectBelongsToCompany(
      companyId,
      createProjectPhaseDto.projectId,
      {
        requireActive: true,
        inactiveMessage:
          'Inactive projects cannot receive new project phases.',
      },
    );
    const normalizedInput = this.normalizeCodeNameInput(createProjectPhaseDto);

    await this.assertProjectPhaseUniqueness(
      project.id,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const projectPhase = await this.prisma.projectPhase.create({
        data: {
          projectId: project.id,
          ...normalizedInput,
        },
        include: {
          project: true,
        },
      });

      return this.mapProjectPhase(projectPhase);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A project phase with this code or name already exists in the project.',
        );
      }

      throw error;
    }
  }

  async updateProjectPhase(
    companyId: string,
    projectPhaseId: string,
    updateProjectPhaseDto: UpdateProjectPhaseDto,
  ) {
    const existingProjectPhase = await this.getProjectPhaseRecord(
      companyId,
      projectPhaseId,
    );
    const normalizedInput = this.normalizeCodeNameInput({
      code: updateProjectPhaseDto.code ?? existingProjectPhase.code,
      name: updateProjectPhaseDto.name ?? existingProjectPhase.name,
      description:
        updateProjectPhaseDto.description === undefined
          ? existingProjectPhase.description
          : updateProjectPhaseDto.description,
    });

    await this.assertProjectPhaseUniqueness(
      existingProjectPhase.projectId,
      normalizedInput.code,
      normalizedInput.name,
      existingProjectPhase.id,
    );

    try {
      const projectPhase = await this.prisma.projectPhase.update({
        where: {
          id: existingProjectPhase.id,
        },
        data: normalizedInput,
        include: {
          project: true,
        },
      });

      return this.mapProjectPhase(projectPhase);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A project phase with this code or name already exists in the project.',
        );
      }

      throw error;
    }
  }

  async setProjectPhaseActiveState(
    companyId: string,
    projectPhaseId: string,
    isActive: boolean,
  ) {
    await this.getProjectPhaseRecord(companyId, projectPhaseId);

    const projectPhase = await this.prisma.projectPhase.update({
      where: {
        id: projectPhaseId,
      },
      data: {
        isActive,
      },
      include: {
        project: true,
      },
    });

    return this.mapProjectPhase(projectPhase);
  }

  async listBlocks(companyId: string, query: BlocksListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.BlockWhereInput = {
      project: {
        companyId,
        ...(query.projectId ? { id: query.projectId } : {}),
      },
      ...(query.phaseId ? { phaseId: query.phaseId } : {}),
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
    const sortField = resolveSortField(query.sortBy, BLOCK_SORT_FIELDS, 'name');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.BlockOrderByWithRelationInput;
    const [blocks, total] = await Promise.all([
      this.prisma.block.findMany({
        where,
        include: {
          project: true,
          phase: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.block.count({
        where,
      }),
    ]);

    return {
      items: blocks.map((block) => this.mapBlock(block)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getBlockDetail(companyId: string, blockId: string) {
    const block = await this.getBlockRecord(companyId, blockId);

    return this.mapBlock(block);
  }

  async createBlock(companyId: string, createBlockDto: CreateBlockDto) {
    const project = await this.assertProjectBelongsToCompany(
      companyId,
      createBlockDto.projectId,
      {
        requireActive: true,
        inactiveMessage: 'Inactive projects cannot receive new blocks.',
      },
    );

    if (createBlockDto.phaseId) {
      await this.assertPhaseBelongsToProject(project.id, createBlockDto.phaseId, {
        requireActive: true,
        inactiveMessage: 'Inactive project phases cannot be assigned to blocks.',
      });
    }

    const normalizedInput = this.normalizeCodeNameInput(createBlockDto);

    await this.assertBlockUniqueness(
      project.id,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const block = await this.prisma.block.create({
        data: {
          projectId: project.id,
          phaseId: createBlockDto.phaseId ?? null,
          ...normalizedInput,
        },
        include: {
          project: true,
          phase: true,
        },
      });

      return this.mapBlock(block);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A block with this code or name already exists in the project.',
        );
      }

      throw error;
    }
  }

  async updateBlock(
    companyId: string,
    blockId: string,
    updateBlockDto: UpdateBlockDto,
  ) {
    const existingBlock = await this.getBlockRecord(companyId, blockId);
    const phaseId =
      updateBlockDto.phaseId === undefined
        ? existingBlock.phaseId
        : (updateBlockDto.phaseId ?? null);

    if (phaseId) {
      await this.assertPhaseBelongsToProject(existingBlock.projectId, phaseId, {
        requireActive: true,
        inactiveMessage: 'Inactive project phases cannot be assigned to blocks.',
      });
    }

    const normalizedInput = this.normalizeCodeNameInput({
      code: updateBlockDto.code ?? existingBlock.code,
      name: updateBlockDto.name ?? existingBlock.name,
      description:
        updateBlockDto.description === undefined
          ? existingBlock.description
          : updateBlockDto.description,
    });

    await this.assertBlockUniqueness(
      existingBlock.projectId,
      normalizedInput.code,
      normalizedInput.name,
      existingBlock.id,
    );

    try {
      const block = await this.prisma.block.update({
        where: {
          id: existingBlock.id,
        },
        data: {
          phaseId,
          ...normalizedInput,
        },
        include: {
          project: true,
          phase: true,
        },
      });

      return this.mapBlock(block);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A block with this code or name already exists in the project.',
        );
      }

      throw error;
    }
  }

  async setBlockActiveState(companyId: string, blockId: string, isActive: boolean) {
    await this.getBlockRecord(companyId, blockId);

    const block = await this.prisma.block.update({
      where: {
        id: blockId,
      },
      data: {
        isActive,
      },
      include: {
        project: true,
        phase: true,
      },
    });

    return this.mapBlock(block);
  }

  async listZones(companyId: string, query: ZonesListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.ZoneWhereInput = {
      project: {
        companyId,
        ...(query.projectId ? { id: query.projectId } : {}),
      },
      ...(query.blockId ? { blockId: query.blockId } : {}),
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
    const sortField = resolveSortField(query.sortBy, ZONE_SORT_FIELDS, 'name');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.ZoneOrderByWithRelationInput;
    const [zones, total] = await Promise.all([
      this.prisma.zone.findMany({
        where,
        include: {
          project: true,
          block: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.zone.count({
        where,
      }),
    ]);

    return {
      items: zones.map((zone) => this.mapZone(zone)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getZoneDetail(companyId: string, zoneId: string) {
    const zone = await this.getZoneRecord(companyId, zoneId);

    return this.mapZone(zone);
  }

  async createZone(companyId: string, createZoneDto: CreateZoneDto) {
    const project = await this.assertProjectBelongsToCompany(
      companyId,
      createZoneDto.projectId,
      {
        requireActive: true,
        inactiveMessage: 'Inactive projects cannot receive new zones.',
      },
    );

    if (createZoneDto.blockId) {
      await this.assertBlockBelongsToProject(project.id, createZoneDto.blockId, {
        requireActive: true,
        inactiveMessage: 'Inactive blocks cannot be assigned to zones.',
      });
    }

    const normalizedInput = this.normalizeCodeNameInput(createZoneDto);

    await this.assertZoneUniqueness(
      project.id,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const zone = await this.prisma.zone.create({
        data: {
          projectId: project.id,
          blockId: createZoneDto.blockId ?? null,
          ...normalizedInput,
        },
        include: {
          project: true,
          block: true,
        },
      });

      return this.mapZone(zone);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A zone with this code or name already exists in the project.',
        );
      }

      throw error;
    }
  }

  async updateZone(
    companyId: string,
    zoneId: string,
    updateZoneDto: UpdateZoneDto,
  ) {
    const existingZone = await this.getZoneRecord(companyId, zoneId);
    const blockId =
      updateZoneDto.blockId === undefined
        ? existingZone.blockId
        : (updateZoneDto.blockId ?? null);

    if (blockId) {
      await this.assertBlockBelongsToProject(existingZone.projectId, blockId, {
        requireActive: true,
        inactiveMessage: 'Inactive blocks cannot be assigned to zones.',
      });
    }

    const normalizedInput = this.normalizeCodeNameInput({
      code: updateZoneDto.code ?? existingZone.code,
      name: updateZoneDto.name ?? existingZone.name,
      description:
        updateZoneDto.description === undefined
          ? existingZone.description
          : updateZoneDto.description,
    });

    await this.assertZoneUniqueness(
      existingZone.projectId,
      normalizedInput.code,
      normalizedInput.name,
      existingZone.id,
    );

    try {
      const zone = await this.prisma.zone.update({
        where: {
          id: existingZone.id,
        },
        data: {
          blockId,
          ...normalizedInput,
        },
        include: {
          project: true,
          block: true,
        },
      });

      return this.mapZone(zone);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A zone with this code or name already exists in the project.',
        );
      }

      throw error;
    }
  }

  async setZoneActiveState(companyId: string, zoneId: string, isActive: boolean) {
    await this.getZoneRecord(companyId, zoneId);

    const zone = await this.prisma.zone.update({
      where: {
        id: zoneId,
      },
      data: {
        isActive,
      },
      include: {
        project: true,
        block: true,
      },
    });

    return this.mapZone(zone);
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

  private async assertProjectBelongsToCompany(
    companyId: string,
    projectId: string,
    options: {
      requireActive?: boolean;
      inactiveMessage?: string;
    } = {},
  ): Promise<ProjectSummaryRecord> {
    await this.assertCompanyExists(companyId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        companyId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (options.requireActive && !project.isActive) {
      throw new BadRequestException(
        options.inactiveMessage ?? 'Inactive projects cannot be assigned here.',
      );
    }

    return project;
  }

  private async assertPhaseBelongsToProject(
    projectId: string,
    projectPhaseId: string,
    options: {
      requireActive?: boolean;
      inactiveMessage?: string;
    } = {},
  ) {
    const projectPhase = await this.prisma.projectPhase.findFirst({
      where: {
        id: projectPhaseId,
        projectId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!projectPhase) {
      throw new NotFoundException('Project phase not found.');
    }

    if (options.requireActive && !projectPhase.isActive) {
      throw new BadRequestException(
        options.inactiveMessage ??
          'Inactive project phases cannot be assigned here.',
      );
    }
  }

  private async assertBlockBelongsToProject(
    projectId: string,
    blockId: string,
    options: {
      requireActive?: boolean;
      inactiveMessage?: string;
    } = {},
  ) {
    const block = await this.prisma.block.findFirst({
      where: {
        id: blockId,
        projectId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found.');
    }

    if (options.requireActive && !block.isActive) {
      throw new BadRequestException(
        options.inactiveMessage ?? 'Inactive blocks cannot be assigned here.',
      );
    }
  }

  private async getProjectPhaseRecord(companyId: string, projectPhaseId: string) {
    await this.assertCompanyExists(companyId);

    const projectPhase = await this.prisma.projectPhase.findFirst({
      where: {
        id: projectPhaseId,
        project: {
          companyId,
        },
      },
      include: {
        project: true,
      },
    });

    if (!projectPhase) {
      throw new NotFoundException('Project phase not found.');
    }

    return projectPhase;
  }

  private async getBlockRecord(companyId: string, blockId: string) {
    await this.assertCompanyExists(companyId);

    const block = await this.prisma.block.findFirst({
      where: {
        id: blockId,
        project: {
          companyId,
        },
      },
      include: {
        project: true,
        phase: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found.');
    }

    return block;
  }

  private async getZoneRecord(companyId: string, zoneId: string) {
    await this.assertCompanyExists(companyId);

    const zone = await this.prisma.zone.findFirst({
      where: {
        id: zoneId,
        project: {
          companyId,
        },
      },
      include: {
        project: true,
        block: true,
      },
    });

    if (!zone) {
      throw new NotFoundException('Zone not found.');
    }

    return zone;
  }

  private async assertProjectPhaseUniqueness(
    projectId: string,
    code: string,
    name: string,
    ignoredProjectPhaseId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.projectPhase.findFirst({
        where: {
          projectId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredProjectPhaseId
            ? {
                id: {
                  not: ignoredProjectPhaseId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.projectPhase.findFirst({
        where: {
          projectId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredProjectPhaseId
            ? {
                id: {
                  not: ignoredProjectPhaseId,
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
        'A project phase with this code already exists in the project.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A project phase with this name already exists in the project.',
      );
    }
  }

  private async assertBlockUniqueness(
    projectId: string,
    code: string,
    name: string,
    ignoredBlockId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.block.findFirst({
        where: {
          projectId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredBlockId ? { id: { not: ignoredBlockId } } : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.block.findFirst({
        where: {
          projectId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredBlockId ? { id: { not: ignoredBlockId } } : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'A block with this code already exists in the project.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A block with this name already exists in the project.',
      );
    }
  }

  private async assertZoneUniqueness(
    projectId: string,
    code: string,
    name: string,
    ignoredZoneId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.zone.findFirst({
        where: {
          projectId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredZoneId ? { id: { not: ignoredZoneId } } : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.zone.findFirst({
        where: {
          projectId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredZoneId ? { id: { not: ignoredZoneId } } : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'A zone with this code already exists in the project.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A zone with this name already exists in the project.',
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

  private mapProjectPhase(projectPhase: ProjectPhaseRecord): ProjectPhaseDto {
    return {
      id: projectPhase.id,
      companyId: projectPhase.project.companyId,
      projectId: projectPhase.projectId,
      projectCode: projectPhase.project.code,
      projectName: projectPhase.project.name,
      code: projectPhase.code,
      name: projectPhase.name,
      description: projectPhase.description,
      isActive: projectPhase.isActive,
      createdAt: projectPhase.createdAt.toISOString(),
      updatedAt: projectPhase.updatedAt.toISOString(),
    };
  }

  private mapBlock(block: BlockRecord): BlockDto {
    return {
      id: block.id,
      companyId: block.project.companyId,
      projectId: block.projectId,
      projectCode: block.project.code,
      projectName: block.project.name,
      phaseId: block.phaseId,
      phaseCode: block.phase?.code ?? null,
      phaseName: block.phase?.name ?? null,
      code: block.code,
      name: block.name,
      description: block.description,
      isActive: block.isActive,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
    };
  }

  private mapZone(zone: ZoneRecord): ZoneDto {
    return {
      id: zone.id,
      companyId: zone.project.companyId,
      projectId: zone.projectId,
      projectCode: zone.project.code,
      projectName: zone.project.name,
      blockId: zone.blockId,
      blockCode: zone.block?.code ?? null,
      blockName: zone.block?.name ?? null,
      code: zone.code,
      name: zone.name,
      description: zone.description,
      isActive: zone.isActive,
      createdAt: zone.createdAt.toISOString(),
      updatedAt: zone.updatedAt.toISOString(),
    };
  }
}
