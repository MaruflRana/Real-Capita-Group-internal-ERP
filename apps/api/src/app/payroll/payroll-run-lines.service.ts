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
import { PrismaService } from '../database/prisma.service';
import type {
  BulkUpsertPayrollRunLinesDto,
  CreatePayrollRunLineDto,
  PayrollRunLineDto,
  PayrollRunLinesListQueryDto,
  UpdatePayrollRunLineDto,
} from './dto/payroll-run-lines.dto';
import type { PayrollRunLineRecord } from './payroll-reference.service';
import { PayrollReferenceService } from './payroll-reference.service';
import { normalizePayrollAmounts } from './payroll.utils';

@Injectable()
export class PayrollRunLinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: PayrollReferenceService,
  ) {}

  async listPayrollRunLines(
    companyId: string,
    payrollRunId: string,
    query: PayrollRunLinesListQueryDto,
  ) {
    await this.referenceService.getPayrollRunRecord(companyId, payrollRunId);

    const where: Prisma.PayrollRunLineWhereInput = {
      companyId,
      payrollRunId,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                employee: {
                  employeeCode: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                employee: {
                  fullName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                employee: {
                  department: {
                    name: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                employee: {
                  location: {
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
    const orderBy = this.resolveOrderBy(query.sortBy, query.sortOrder);
    const [payrollRunLines, total] = await Promise.all([
      this.prisma.payrollRunLine.findMany({
        where,
        include: this.payrollRunLineInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.payrollRunLine.count({
        where,
      }),
    ]);

    return {
      items: payrollRunLines.map((payrollRunLine) =>
        this.mapPayrollRunLine(payrollRunLine),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getPayrollRunLineDetail(
    companyId: string,
    payrollRunId: string,
    payrollRunLineId: string,
  ) {
    const payrollRunLine = await this.referenceService.getPayrollRunLineRecord(
      companyId,
      payrollRunId,
      payrollRunLineId,
    );

    return this.mapPayrollRunLine(payrollRunLine);
  }

  async createPayrollRunLine(
    companyId: string,
    payrollRunId: string,
    createPayrollRunLineDto: CreatePayrollRunLineDto,
  ) {
    const payrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    this.assertPayrollRunIsDraft(payrollRun);
    await this.referenceService.getEmployeeRecord(
      companyId,
      createPayrollRunLineDto.employeeId,
    );

    const amounts = normalizePayrollAmounts(createPayrollRunLineDto);

    try {
      const payrollRunLine = await this.prisma.payrollRunLine.create({
        data: {
          companyId,
          payrollRunId,
          employeeId: createPayrollRunLineDto.employeeId,
          basicAmount: amounts.basicAmount,
          allowanceAmount: amounts.allowanceAmount,
          deductionAmount: amounts.deductionAmount,
          netAmount: amounts.netAmount,
        },
        include: this.payrollRunLineInclude,
      });

      return this.mapPayrollRunLine(payrollRunLine);
    } catch (error) {
      this.throwPayrollRunLineMutationError(error);
    }
  }

  async updatePayrollRunLine(
    companyId: string,
    payrollRunId: string,
    payrollRunLineId: string,
    updatePayrollRunLineDto: UpdatePayrollRunLineDto,
  ) {
    const payrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    this.assertPayrollRunIsDraft(payrollRun);

    const existingPayrollRunLine =
      await this.referenceService.getPayrollRunLineRecord(
        companyId,
        payrollRunId,
        payrollRunLineId,
      );
    const amounts = normalizePayrollAmounts({
      basicAmount:
        updatePayrollRunLineDto.basicAmount ??
        existingPayrollRunLine.basicAmount.toFixed(2),
      allowanceAmount:
        updatePayrollRunLineDto.allowanceAmount ??
        existingPayrollRunLine.allowanceAmount.toFixed(2),
      deductionAmount:
        updatePayrollRunLineDto.deductionAmount ??
        existingPayrollRunLine.deductionAmount.toFixed(2),
      netAmount:
        updatePayrollRunLineDto.netAmount ??
        existingPayrollRunLine.netAmount.toFixed(2),
    });

    try {
      const payrollRunLine = await this.prisma.payrollRunLine.update({
        where: {
          id: existingPayrollRunLine.id,
        },
        data: {
          basicAmount: amounts.basicAmount,
          allowanceAmount: amounts.allowanceAmount,
          deductionAmount: amounts.deductionAmount,
          netAmount: amounts.netAmount,
        },
        include: this.payrollRunLineInclude,
      });

      return this.mapPayrollRunLine(payrollRunLine);
    } catch (error) {
      this.throwPayrollRunLineMutationError(error);
    }
  }

  async bulkUpsertPayrollRunLines(
    companyId: string,
    payrollRunId: string,
    bulkUpsertPayrollRunLinesDto: BulkUpsertPayrollRunLinesDto,
  ) {
    const payrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    this.assertPayrollRunIsDraft(payrollRun);
    this.assertDistinctEmployees(bulkUpsertPayrollRunLinesDto);

    const employeeIds = bulkUpsertPayrollRunLinesDto.lines.map(
      ({ employeeId }) => employeeId,
    );

    await this.assertEmployeesExist(companyId, employeeIds);

    for (const payrollRunLine of bulkUpsertPayrollRunLinesDto.lines) {
      const amounts = normalizePayrollAmounts(payrollRunLine);

      try {
        await this.prisma.payrollRunLine.upsert({
          where: {
            payrollRunId_employeeId: {
              payrollRunId,
              employeeId: payrollRunLine.employeeId,
            },
          },
          create: {
            companyId,
            payrollRunId,
            employeeId: payrollRunLine.employeeId,
            basicAmount: amounts.basicAmount,
            allowanceAmount: amounts.allowanceAmount,
            deductionAmount: amounts.deductionAmount,
            netAmount: amounts.netAmount,
          },
          update: {
            basicAmount: amounts.basicAmount,
            allowanceAmount: amounts.allowanceAmount,
            deductionAmount: amounts.deductionAmount,
            netAmount: amounts.netAmount,
          },
        });
      } catch (error) {
        this.throwPayrollRunLineMutationError(error);
      }
    }

    const payrollRunLines = await this.prisma.payrollRunLine.findMany({
      where: {
        companyId,
        payrollRunId,
      },
      include: this.payrollRunLineInclude,
      orderBy: {
        employee: {
          employeeCode: 'asc',
        },
      },
    });

    return payrollRunLines.map((payrollRunLine) =>
      this.mapPayrollRunLine(payrollRunLine),
    );
  }

  async removePayrollRunLine(
    companyId: string,
    payrollRunId: string,
    payrollRunLineId: string,
  ) {
    const payrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    this.assertPayrollRunIsDraft(payrollRun);

    const payrollRunLine = await this.referenceService.getPayrollRunLineRecord(
      companyId,
      payrollRunId,
      payrollRunLineId,
    );

    try {
      await this.prisma.payrollRunLine.delete({
        where: {
          id: payrollRunLine.id,
        },
      });
    } catch (error) {
      this.throwPayrollRunLineMutationError(error);
    }
  }

  private readonly payrollRunLineInclude = {
    employee: {
      include: {
        department: true,
        location: true,
      },
    },
  } satisfies Prisma.PayrollRunLineInclude;

  private resolveOrderBy(
    sortBy: string | undefined,
    sortOrder: 'asc' | 'desc',
  ): Prisma.PayrollRunLineOrderByWithRelationInput {
    if (sortBy === 'employeeCode') {
      return {
        employee: {
          employeeCode: sortOrder,
        },
      };
    }

    if (sortBy === 'employeeFullName') {
      return {
        employee: {
          fullName: sortOrder,
        },
      };
    }

    if (sortBy === 'updatedAt') {
      return {
        updatedAt: sortOrder,
      };
    }

    return {
      createdAt: sortOrder,
    };
  }

  private assertPayrollRunIsDraft(payrollRun: { status: string }) {
    if (payrollRun.status !== 'DRAFT') {
      throw new BadRequestException('Only draft payroll runs can be modified.');
    }
  }

  private assertDistinctEmployees(
    bulkUpsertPayrollRunLinesDto: BulkUpsertPayrollRunLinesDto,
  ) {
    const employeeIds = bulkUpsertPayrollRunLinesDto.lines.map(
      ({ employeeId }) => employeeId,
    );

    if (new Set(employeeIds).size !== employeeIds.length) {
      throw new BadRequestException(
        'Bulk payroll line requests cannot contain duplicate employees.',
      );
    }
  }

  private async assertEmployeesExist(companyId: string, employeeIds: string[]) {
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        id: {
          in: employeeIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (employees.length !== employeeIds.length) {
      throw new BadRequestException(
        'One or more payroll line employees were not found in the company.',
      );
    }
  }

  private mapPayrollRunLine(payrollRunLine: PayrollRunLineRecord): PayrollRunLineDto {
    return {
      id: payrollRunLine.id,
      companyId: payrollRunLine.companyId,
      payrollRunId: payrollRunLine.payrollRunId,
      employeeId: payrollRunLine.employeeId,
      employeeCode: payrollRunLine.employee.employeeCode,
      employeeFullName: payrollRunLine.employee.fullName,
      departmentId: payrollRunLine.employee.departmentId,
      departmentCode: payrollRunLine.employee.department?.code ?? null,
      departmentName: payrollRunLine.employee.department?.name ?? null,
      locationId: payrollRunLine.employee.locationId,
      locationCode: payrollRunLine.employee.location?.code ?? null,
      locationName: payrollRunLine.employee.location?.name ?? null,
      basicAmount: payrollRunLine.basicAmount.toFixed(2),
      allowanceAmount: payrollRunLine.allowanceAmount.toFixed(2),
      deductionAmount: payrollRunLine.deductionAmount.toFixed(2),
      netAmount: payrollRunLine.netAmount.toFixed(2),
      createdAt: payrollRunLine.createdAt.toISOString(),
      updatedAt: payrollRunLine.updatedAt.toISOString(),
    };
  }

  private throwPayrollRunLineMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException(
        'A payroll line for this employee already exists in the selected payroll run.',
      );
    }

    throw error;
  }
}
