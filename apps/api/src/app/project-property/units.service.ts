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
  CreateUnitTypeDto,
  UnitTypeDto,
  UnitTypesListQueryDto,
  UpdateUnitTypeDto,
} from './dto/unit-types.dto';
import type {
  UnitStatusDto,
  UnitStatusesListQueryDto,
} from './dto/unit-statuses.dto';
import type {
  CreateUnitDto,
  UnitDto,
  UnitsListQueryDto,
  UpdateUnitDto,
} from './dto/units.dto';

const UNIT_TYPE_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;
const UNIT_STATUS_SORT_FIELDS = ['code', 'name', 'sortOrder', 'updatedAt'] as const;
const UNIT_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;

type ProjectSummaryRecord = Prisma.ProjectGetPayload<object>;
type UnitTypeRecord = Prisma.UnitTypeGetPayload<object>;
type UnitStatusRecord = Prisma.UnitStatusGetPayload<object>;
type UnitRecord = Prisma.UnitGetPayload<{
  include: {
    project: true;
    phase: true;
    block: {
      include: {
        phase: true;
      };
    };
    zone: {
      include: {
        block: {
          include: {
            phase: true;
          };
        };
      };
    };
    unitType: true;
    unitStatus: true;
  };
}>;

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async listUnitTypes(companyId: string, query: UnitTypesListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.UnitTypeWhereInput = {
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
    const sortField = resolveSortField(
      query.sortBy,
      UNIT_TYPE_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.UnitTypeOrderByWithRelationInput;
    const [unitTypes, total] = await Promise.all([
      this.prisma.unitType.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.unitType.count({
        where,
      }),
    ]);

    return {
      items: unitTypes.map((unitType) => this.mapUnitType(unitType)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getUnitTypeDetail(companyId: string, unitTypeId: string) {
    const unitType = await this.getUnitTypeRecord(companyId, unitTypeId);

    return this.mapUnitType(unitType);
  }

  async createUnitType(companyId: string, createUnitTypeDto: CreateUnitTypeDto) {
    await this.assertCompanyExists(companyId);

    const normalizedInput = this.normalizeCodeNameInput(createUnitTypeDto);

    await this.assertUnitTypeUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const unitType = await this.prisma.unitType.create({
        data: {
          companyId,
          ...normalizedInput,
        },
      });

      return this.mapUnitType(unitType);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A unit type with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async updateUnitType(
    companyId: string,
    unitTypeId: string,
    updateUnitTypeDto: UpdateUnitTypeDto,
  ) {
    const existingUnitType = await this.getUnitTypeRecord(companyId, unitTypeId);
    const normalizedInput = this.normalizeCodeNameInput({
      code: updateUnitTypeDto.code ?? existingUnitType.code,
      name: updateUnitTypeDto.name ?? existingUnitType.name,
      description:
        updateUnitTypeDto.description === undefined
          ? existingUnitType.description
          : updateUnitTypeDto.description,
    });

    await this.assertUnitTypeUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingUnitType.id,
    );

    try {
      const unitType = await this.prisma.unitType.update({
        where: {
          id: existingUnitType.id,
        },
        data: normalizedInput,
      });

      return this.mapUnitType(unitType);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A unit type with this code or name already exists in the company.',
        );
      }

      throw error;
    }
  }

  async setUnitTypeActiveState(
    companyId: string,
    unitTypeId: string,
    isActive: boolean,
  ) {
    await this.getUnitTypeRecord(companyId, unitTypeId);

    const unitType = await this.prisma.unitType.update({
      where: {
        id: unitTypeId,
      },
      data: {
        isActive,
      },
    });

    return this.mapUnitType(unitType);
  }

  async listUnitStatuses(companyId: string, query: UnitStatusesListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.UnitStatusWhereInput = {
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
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      UNIT_STATUS_SORT_FIELDS,
      'sortOrder',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.UnitStatusOrderByWithRelationInput;
    const [unitStatuses, total] = await Promise.all([
      this.prisma.unitStatus.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.unitStatus.count({
        where,
      }),
    ]);

    return {
      items: unitStatuses.map((unitStatus) => this.mapUnitStatus(unitStatus)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async listUnits(companyId: string, query: UnitsListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.UnitWhereInput = {
      project: {
        companyId,
      },
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.phaseId ? { phaseId: query.phaseId } : {}),
      ...(query.blockId ? { blockId: query.blockId } : {}),
      ...(query.zoneId ? { zoneId: query.zoneId } : {}),
      ...(query.unitTypeId ? { unitTypeId: query.unitTypeId } : {}),
      ...(query.unitStatusId ? { unitStatusId: query.unitStatusId } : {}),
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
    const sortField = resolveSortField(query.sortBy, UNIT_SORT_FIELDS, 'code');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.UnitOrderByWithRelationInput;
    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        include: this.unitInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.unit.count({
        where,
      }),
    ]);

    return {
      items: units.map((unit) => this.mapUnit(unit)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getUnitDetail(companyId: string, unitId: string) {
    const unit = await this.getUnitRecord(companyId, unitId);

    return this.mapUnit(unit);
  }

  async createUnit(companyId: string, createUnitDto: CreateUnitDto) {
    const project = await this.assertProjectBelongsToCompany(
      companyId,
      createUnitDto.projectId,
      {
        requireActive: true,
        inactiveMessage: 'Inactive projects cannot receive new units.',
      },
    );

    await this.assertActiveUnitType(companyId, createUnitDto.unitTypeId);
    await this.assertActiveUnitStatus(createUnitDto.unitStatusId);
    await this.resolveUnitHierarchy(project.id, {
      phaseId: createUnitDto.phaseId ?? null,
      blockId: createUnitDto.blockId ?? null,
      zoneId: createUnitDto.zoneId ?? null,
    });

    const normalizedInput = this.normalizeUnitInput(createUnitDto);

    await this.assertUnitUniqueness(project.id, normalizedInput.code);

    try {
      const unit = await this.prisma.unit.create({
        data: {
          projectId: project.id,
          phaseId: createUnitDto.phaseId ?? null,
          blockId: createUnitDto.blockId ?? null,
          zoneId: createUnitDto.zoneId ?? null,
          unitTypeId: createUnitDto.unitTypeId,
          unitStatusId: createUnitDto.unitStatusId,
          ...normalizedInput,
        },
        include: this.unitInclude,
      });

      return this.mapUnit(unit);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A unit with this code already exists in the project.',
        );
      }

      throw error;
    }
  }

  async updateUnit(companyId: string, unitId: string, updateUnitDto: UpdateUnitDto) {
    const existingUnit = await this.getUnitRecord(companyId, unitId);

    if (updateUnitDto.unitTypeId !== undefined) {
      await this.assertActiveUnitType(companyId, updateUnitDto.unitTypeId);
    }

    if (updateUnitDto.unitStatusId !== undefined) {
      await this.assertActiveUnitStatus(updateUnitDto.unitStatusId);
    }

    if (
      updateUnitDto.phaseId !== undefined ||
      updateUnitDto.blockId !== undefined ||
      updateUnitDto.zoneId !== undefined
    ) {
      await this.resolveUnitHierarchy(existingUnit.projectId, {
        phaseId:
          updateUnitDto.phaseId === undefined
            ? existingUnit.phaseId
            : (updateUnitDto.phaseId ?? null),
        blockId:
          updateUnitDto.blockId === undefined
            ? existingUnit.blockId
            : (updateUnitDto.blockId ?? null),
        zoneId:
          updateUnitDto.zoneId === undefined
            ? existingUnit.zoneId
            : (updateUnitDto.zoneId ?? null),
      });
    }

    const normalizedInput = this.normalizeUnitInput({
      code: updateUnitDto.code ?? existingUnit.code,
      name: updateUnitDto.name ?? existingUnit.name,
      description:
        updateUnitDto.description === undefined
          ? existingUnit.description
          : updateUnitDto.description,
    });

    await this.assertUnitUniqueness(
      existingUnit.projectId,
      normalizedInput.code,
      existingUnit.id,
    );

    try {
      const unit = await this.prisma.unit.update({
        where: {
          id: existingUnit.id,
        },
        data: {
          phaseId:
            updateUnitDto.phaseId === undefined
              ? existingUnit.phaseId
              : (updateUnitDto.phaseId ?? null),
          blockId:
            updateUnitDto.blockId === undefined
              ? existingUnit.blockId
              : (updateUnitDto.blockId ?? null),
          zoneId:
            updateUnitDto.zoneId === undefined
              ? existingUnit.zoneId
              : (updateUnitDto.zoneId ?? null),
          unitTypeId: updateUnitDto.unitTypeId ?? existingUnit.unitTypeId,
          unitStatusId: updateUnitDto.unitStatusId ?? existingUnit.unitStatusId,
          ...normalizedInput,
        },
        include: this.unitInclude,
      });

      return this.mapUnit(unit);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'A unit with this code already exists in the project.',
        );
      }

      throw error;
    }
  }

  async setUnitActiveState(companyId: string, unitId: string, isActive: boolean) {
    await this.getUnitRecord(companyId, unitId);

    const unit = await this.prisma.unit.update({
      where: {
        id: unitId,
      },
      data: {
        isActive,
      },
      include: this.unitInclude,
    });

    return this.mapUnit(unit);
  }

  private readonly unitInclude = {
    project: true,
    phase: true,
    block: {
      include: {
        phase: true,
      },
    },
    zone: {
      include: {
        block: {
          include: {
            phase: true,
          },
        },
      },
    },
    unitType: true,
    unitStatus: true,
  } satisfies Prisma.UnitInclude;

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

  private async assertActiveUnitType(
    companyId: string,
    unitTypeId: string,
  ): Promise<void> {
    const unitType = await this.prisma.unitType.findFirst({
      where: {
        id: unitTypeId,
        companyId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!unitType) {
      throw new NotFoundException('Unit type not found.');
    }

    if (!unitType.isActive) {
      throw new BadRequestException('Inactive unit types cannot be assigned to units.');
    }
  }

  private async assertActiveUnitStatus(unitStatusId: string): Promise<void> {
    const unitStatus = await this.prisma.unitStatus.findUnique({
      where: {
        id: unitStatusId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!unitStatus) {
      throw new NotFoundException('Unit status not found.');
    }

    if (!unitStatus.isActive) {
      throw new BadRequestException(
        'Inactive unit statuses cannot be assigned to units.',
      );
    }
  }

  private async resolveUnitHierarchy(
    projectId: string,
    selection: {
      phaseId: string | null;
      blockId: string | null;
      zoneId: string | null;
    },
  ): Promise<void> {
    const [phase, block, zone] = await Promise.all([
      selection.phaseId
        ? this.prisma.projectPhase.findFirst({
            where: {
              id: selection.phaseId,
              projectId,
            },
            select: {
              id: true,
              isActive: true,
            },
          })
        : Promise.resolve(null),
      selection.blockId
        ? this.prisma.block.findFirst({
            where: {
              id: selection.blockId,
              projectId,
            },
            select: {
              id: true,
              isActive: true,
              phaseId: true,
            },
          })
        : Promise.resolve(null),
      selection.zoneId
        ? this.prisma.zone.findFirst({
            where: {
              id: selection.zoneId,
              projectId,
            },
            select: {
              id: true,
              isActive: true,
              blockId: true,
              block: {
                select: {
                  id: true,
                  phaseId: true,
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    if (selection.phaseId && !phase) {
      throw new NotFoundException('Project phase not found.');
    }

    if (selection.blockId && !block) {
      throw new NotFoundException('Block not found.');
    }

    if (selection.zoneId && !zone) {
      throw new NotFoundException('Zone not found.');
    }

    if (phase && !phase.isActive) {
      throw new BadRequestException(
        'Inactive project phases cannot be assigned to units.',
      );
    }

    if (block && !block.isActive) {
      throw new BadRequestException('Inactive blocks cannot be assigned to units.');
    }

    if (zone && !zone.isActive) {
      throw new BadRequestException('Inactive zones cannot be assigned to units.');
    }

    if (phase && block?.phaseId && block.phaseId !== phase.id) {
      throw new BadRequestException(
        'Selected block does not belong to the selected project phase.',
      );
    }

    if (block && zone?.blockId && zone.blockId !== block.id) {
      throw new BadRequestException(
        'Selected zone does not belong to the selected block.',
      );
    }

    if (phase && zone?.block?.phaseId && zone.block.phaseId !== phase.id) {
      throw new BadRequestException(
        'Selected zone does not belong to the selected project phase.',
      );
    }
  }

  private async getUnitTypeRecord(companyId: string, unitTypeId: string) {
    await this.assertCompanyExists(companyId);

    const unitType = await this.prisma.unitType.findFirst({
      where: {
        id: unitTypeId,
        companyId,
      },
    });

    if (!unitType) {
      throw new NotFoundException('Unit type not found.');
    }

    return unitType;
  }

  private async getUnitRecord(companyId: string, unitId: string) {
    await this.assertCompanyExists(companyId);

    const unit = await this.prisma.unit.findFirst({
      where: {
        id: unitId,
        project: {
          companyId,
        },
      },
      include: this.unitInclude,
    });

    if (!unit) {
      throw new NotFoundException('Unit not found.');
    }

    return unit;
  }

  private async assertUnitTypeUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredUnitTypeId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.unitType.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredUnitTypeId ? { id: { not: ignoredUnitTypeId } } : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.unitType.findFirst({
        where: {
          companyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredUnitTypeId ? { id: { not: ignoredUnitTypeId } } : {}),
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (existingCode) {
      throw toConflictException(
        'A unit type with this code already exists in the company.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A unit type with this name already exists in the company.',
      );
    }
  }

  private async assertUnitUniqueness(
    projectId: string,
    code: string,
    ignoredUnitId?: string,
  ) {
    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        projectId,
        code: {
          equals: code,
          mode: 'insensitive',
        },
        ...(ignoredUnitId ? { id: { not: ignoredUnitId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingUnit) {
      throw toConflictException(
        'A unit with this code already exists in the project.',
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

  private normalizeUnitInput(input: {
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

  private mapUnitType(unitType: UnitTypeRecord): UnitTypeDto {
    return {
      id: unitType.id,
      companyId: unitType.companyId,
      code: unitType.code,
      name: unitType.name,
      description: unitType.description,
      isActive: unitType.isActive,
      createdAt: unitType.createdAt.toISOString(),
      updatedAt: unitType.updatedAt.toISOString(),
    };
  }

  private mapUnitStatus(unitStatus: UnitStatusRecord): UnitStatusDto {
    return {
      id: unitStatus.id,
      code: unitStatus.code,
      name: unitStatus.name,
      sortOrder: unitStatus.sortOrder,
      isActive: unitStatus.isActive,
      createdAt: unitStatus.createdAt.toISOString(),
      updatedAt: unitStatus.updatedAt.toISOString(),
    };
  }

  private mapUnit(unit: UnitRecord): UnitDto {
    return {
      id: unit.id,
      companyId: unit.project.companyId,
      projectId: unit.projectId,
      projectCode: unit.project.code,
      projectName: unit.project.name,
      phaseId: unit.phaseId,
      phaseCode: unit.phase?.code ?? null,
      phaseName: unit.phase?.name ?? null,
      blockId: unit.blockId,
      blockCode: unit.block?.code ?? null,
      blockName: unit.block?.name ?? null,
      zoneId: unit.zoneId,
      zoneCode: unit.zone?.code ?? null,
      zoneName: unit.zone?.name ?? null,
      unitTypeId: unit.unitTypeId,
      unitTypeCode: unit.unitType.code,
      unitTypeName: unit.unitType.name,
      unitStatusId: unit.unitStatusId,
      unitStatusCode: unit.unitStatus.code,
      unitStatusName: unit.unitStatus.name,
      code: unit.code,
      name: unit.name,
      description: unit.description,
      isActive: unit.isActive,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
    };
  }
}
