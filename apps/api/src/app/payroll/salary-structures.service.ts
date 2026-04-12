import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import {
  extractDatabaseErrorMessage,
  isUniqueConstraintError,
  toConflictException,
} from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type {
  CreateSalaryStructureDto,
  SalaryStructureDto,
  SalaryStructuresListQueryDto,
  UpdateSalaryStructureDto,
} from './dto/salary-structures.dto';
import type { SalaryStructureRecord } from './payroll-reference.service';
import { PayrollReferenceService } from './payroll-reference.service';
import {
  normalizeCode,
  normalizeOptionalString,
  normalizePayrollAmounts,
  normalizeRequiredString,
} from './payroll.utils';

const SALARY_STRUCTURE_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;

@Injectable()
export class SalaryStructuresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: PayrollReferenceService,
  ) {}

  async listSalaryStructures(
    companyId: string,
    query: SalaryStructuresListQueryDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.SalaryStructureWhereInput = {
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
      SALARY_STRUCTURE_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.SalaryStructureOrderByWithRelationInput;
    const [salaryStructures, total] = await Promise.all([
      this.prisma.salaryStructure.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.salaryStructure.count({
        where,
      }),
    ]);

    return {
      items: salaryStructures.map((salaryStructure) =>
        this.mapSalaryStructure(salaryStructure),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getSalaryStructureDetail(companyId: string, salaryStructureId: string) {
    const salaryStructure = await this.referenceService.getSalaryStructureRecord(
      companyId,
      salaryStructureId,
    );

    return this.mapSalaryStructure(salaryStructure);
  }

  async createSalaryStructure(
    companyId: string,
    createSalaryStructureDto: CreateSalaryStructureDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const normalizedInput = this.normalizeSalaryStructureInput(
      createSalaryStructureDto,
    );

    await this.assertSalaryStructureUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    try {
      const salaryStructure = await this.prisma.salaryStructure.create({
        data: {
          companyId,
          ...normalizedInput,
        },
      });

      return this.mapSalaryStructure(salaryStructure);
    } catch (error) {
      this.throwSalaryStructureMutationError(error);
    }
  }

  async updateSalaryStructure(
    companyId: string,
    salaryStructureId: string,
    updateSalaryStructureDto: UpdateSalaryStructureDto,
  ) {
    const existingSalaryStructure =
      await this.referenceService.getSalaryStructureRecord(
        companyId,
        salaryStructureId,
      );
    const normalizedInput = this.normalizeSalaryStructureInput({
      code: updateSalaryStructureDto.code ?? existingSalaryStructure.code,
      name: updateSalaryStructureDto.name ?? existingSalaryStructure.name,
      description:
        updateSalaryStructureDto.description === undefined
          ? existingSalaryStructure.description
          : updateSalaryStructureDto.description,
      basicAmount:
        updateSalaryStructureDto.basicAmount ??
        existingSalaryStructure.basicAmount.toFixed(2),
      allowanceAmount:
        updateSalaryStructureDto.allowanceAmount ??
        existingSalaryStructure.allowanceAmount.toFixed(2),
      deductionAmount:
        updateSalaryStructureDto.deductionAmount ??
        existingSalaryStructure.deductionAmount.toFixed(2),
      netAmount:
        updateSalaryStructureDto.netAmount ??
        existingSalaryStructure.netAmount.toFixed(2),
    });

    await this.assertSalaryStructureUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingSalaryStructure.id,
    );

    try {
      const salaryStructure = await this.prisma.salaryStructure.update({
        where: {
          id: existingSalaryStructure.id,
        },
        data: normalizedInput,
      });

      return this.mapSalaryStructure(salaryStructure);
    } catch (error) {
      this.throwSalaryStructureMutationError(error);
    }
  }

  async setSalaryStructureActiveState(
    companyId: string,
    salaryStructureId: string,
    isActive: boolean,
  ) {
    await this.referenceService.getSalaryStructureRecord(
      companyId,
      salaryStructureId,
    );

    const salaryStructure = await this.prisma.salaryStructure.update({
      where: {
        id: salaryStructureId,
      },
      data: {
        isActive,
      },
    });

    return this.mapSalaryStructure(salaryStructure);
  }

  private normalizeSalaryStructureInput(input: {
    code: string;
    name: string;
    description?: string | null;
    basicAmount: string;
    allowanceAmount: string;
    deductionAmount: string;
    netAmount: string;
  }) {
    const amounts = normalizePayrollAmounts({
      basicAmount: input.basicAmount,
      allowanceAmount: input.allowanceAmount,
      deductionAmount: input.deductionAmount,
      netAmount: input.netAmount,
    });

    return {
      code: normalizeCode(input.code),
      name: normalizeRequiredString(input.name),
      description: normalizeOptionalString(input.description) ?? null,
      basicAmount: amounts.basicAmount,
      allowanceAmount: amounts.allowanceAmount,
      deductionAmount: amounts.deductionAmount,
      netAmount: amounts.netAmount,
    };
  }

  private async assertSalaryStructureUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredSalaryStructureId?: string,
  ) {
    const [existingCode, existingName] = await Promise.all([
      this.prisma.salaryStructure.findFirst({
        where: {
          companyId,
          code: {
            equals: code,
            mode: 'insensitive',
          },
          ...(ignoredSalaryStructureId
            ? {
                id: {
                  not: ignoredSalaryStructureId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      }),
      this.prisma.salaryStructure.findFirst({
        where: {
          companyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          ...(ignoredSalaryStructureId
            ? {
                id: {
                  not: ignoredSalaryStructureId,
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
        'A salary structure with this code already exists in the company.',
      );
    }

    if (existingName) {
      throw toConflictException(
        'A salary structure with this name already exists in the company.',
      );
    }
  }

  private mapSalaryStructure(
    salaryStructure: SalaryStructureRecord,
  ): SalaryStructureDto {
    return {
      id: salaryStructure.id,
      companyId: salaryStructure.companyId,
      code: salaryStructure.code,
      name: salaryStructure.name,
      description: salaryStructure.description,
      basicAmount: salaryStructure.basicAmount.toFixed(2),
      allowanceAmount: salaryStructure.allowanceAmount.toFixed(2),
      deductionAmount: salaryStructure.deductionAmount.toFixed(2),
      netAmount: salaryStructure.netAmount.toFixed(2),
      isActive: salaryStructure.isActive,
      createdAt: salaryStructure.createdAt.toISOString(),
      updatedAt: salaryStructure.updatedAt.toISOString(),
    };
  }

  private throwSalaryStructureMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException(
        'The salary structure details conflict with an existing company salary structure.',
      );
    }

    throw error;
  }
}
