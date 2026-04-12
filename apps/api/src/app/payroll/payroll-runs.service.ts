import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, type PayrollRunStatus } from '@prisma/client';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
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
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../database/prisma.service';
import type {
  CreatePayrollRunDto,
  PayrollRunDto,
  PayrollRunsListQueryDto,
  PostPayrollRunDto,
  UpdatePayrollRunDto,
} from './dto/payroll-runs.dto';
import type { PayrollRunRecord } from './payroll-reference.service';
import { PayrollReferenceService } from './payroll-reference.service';
import { normalizeOptionalString, parseCalendarDate } from './payroll.utils';

const PAYROLL_RUN_SORT_FIELDS = [
  'createdAt',
  'payrollMonth',
  'payrollYear',
  'status',
  'updatedAt',
] as const;

@Injectable()
export class PayrollRunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly databaseService: DatabaseService,
    private readonly referenceService: PayrollReferenceService,
    private readonly auditService: AuditService,
  ) {}

  async listPayrollRuns(companyId: string, query: PayrollRunsListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.PayrollRunWhereInput = {
      companyId,
      ...(query.payrollYear === undefined
        ? {}
        : { payrollYear: query.payrollYear }),
      ...(query.payrollMonth === undefined
        ? {}
        : { payrollMonth: query.payrollMonth }),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.costCenterId ? { costCenterId: query.costCenterId } : {}),
      ...(query.status ? { status: query.status as PayrollRunStatus } : {}),
      ...(query.search
        ? {
            OR: [
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
              {
                costCenter: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                costCenter: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                postedVoucher: {
                  reference: {
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
      PAYROLL_RUN_SORT_FIELDS,
      'createdAt',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.PayrollRunOrderByWithRelationInput;
    const [payrollRuns, total] = await Promise.all([
      this.prisma.payrollRun.findMany({
        where,
        include: this.payrollRunInclude,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.payrollRun.count({
        where,
      }),
    ]);

    return {
      items: payrollRuns.map((payrollRun) => this.mapPayrollRun(payrollRun)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getPayrollRunDetail(companyId: string, payrollRunId: string) {
    const payrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    return this.mapPayrollRun(payrollRun);
  }

  async createPayrollRun(companyId: string, createPayrollRunDto: CreatePayrollRunDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const normalizedInput = {
      payrollYear: createPayrollRunDto.payrollYear,
      payrollMonth: createPayrollRunDto.payrollMonth,
      projectId: createPayrollRunDto.projectId ?? null,
      costCenterId: createPayrollRunDto.costCenterId ?? null,
      description: normalizeOptionalString(createPayrollRunDto.description) ?? null,
    };

    await this.assertPayrollRunScope(
      companyId,
      normalizedInput.projectId,
      normalizedInput.costCenterId,
    );
    await this.assertPayrollRunUniqueness(
      companyId,
      normalizedInput.payrollYear,
      normalizedInput.payrollMonth,
      normalizedInput.projectId,
      normalizedInput.costCenterId,
    );

    try {
      const payrollRun = await this.prisma.payrollRun.create({
        data: {
          companyId,
          ...normalizedInput,
        },
      });

      return this.getPayrollRunDetail(companyId, payrollRun.id);
    } catch (error) {
      this.throwPayrollRunMutationError(error);
    }
  }

  async updatePayrollRun(
    companyId: string,
    payrollRunId: string,
    updatePayrollRunDto: UpdatePayrollRunDto,
  ) {
    const existingPayrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    this.assertPayrollRunIsDraft(existingPayrollRun);

    const normalizedInput = {
      payrollYear: updatePayrollRunDto.payrollYear ?? existingPayrollRun.payrollYear,
      payrollMonth:
        updatePayrollRunDto.payrollMonth ?? existingPayrollRun.payrollMonth,
      projectId:
        updatePayrollRunDto.projectId === undefined
          ? existingPayrollRun.projectId
          : (updatePayrollRunDto.projectId ?? null),
      costCenterId:
        updatePayrollRunDto.costCenterId === undefined
          ? existingPayrollRun.costCenterId
          : (updatePayrollRunDto.costCenterId ?? null),
      description:
        updatePayrollRunDto.description === undefined
          ? existingPayrollRun.description
          : (normalizeOptionalString(updatePayrollRunDto.description) ?? null),
    };

    await this.assertPayrollRunScope(
      companyId,
      normalizedInput.projectId,
      normalizedInput.costCenterId,
    );
    await this.assertPayrollRunUniqueness(
      companyId,
      normalizedInput.payrollYear,
      normalizedInput.payrollMonth,
      normalizedInput.projectId,
      normalizedInput.costCenterId,
      existingPayrollRun.id,
    );

    try {
      await this.prisma.payrollRun.update({
        where: {
          id: existingPayrollRun.id,
        },
        data: normalizedInput,
      });
    } catch (error) {
      this.throwPayrollRunMutationError(error);
    }

    return this.getPayrollRunDetail(companyId, existingPayrollRun.id);
  }

  async finalizePayrollRun(companyId: string, payrollRunId: string) {
    const payrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    this.assertPayrollRunIsDraft(payrollRun);

    if (payrollRun.payrollRunLines.length === 0) {
      throw new BadRequestException(
        'Payroll runs must contain at least one line before finalization.',
      );
    }

    await this.prisma.payrollRun.update({
      where: {
        id: payrollRun.id,
      },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
      },
    });

    return this.getPayrollRunDetail(companyId, payrollRun.id);
  }

  async cancelPayrollRun(companyId: string, payrollRunId: string) {
    const payrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    if (payrollRun.status === 'POSTED') {
      throw new BadRequestException('Posted payroll runs cannot be cancelled.');
    }

    if (payrollRun.status === 'CANCELLED') {
      throw new BadRequestException('Payroll run is already cancelled.');
    }

    await this.prisma.payrollRun.update({
      where: {
        id: payrollRun.id,
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return this.getPayrollRunDetail(companyId, payrollRun.id);
  }

  async postPayrollRun(
    companyId: string,
    payrollRunId: string,
    authenticatedUser: AuthenticatedUser,
    requestId: string | undefined,
    postPayrollRunDto: PostPayrollRunDto,
  ) {
    const payrollRun = await this.referenceService.getPayrollRunRecord(
      companyId,
      payrollRunId,
    );

    if (payrollRun.status !== 'FINALIZED') {
      throw new BadRequestException(
        'Only finalized payroll runs can be posted to accounting.',
      );
    }

    const voucherDate = parseCalendarDate(
      postPayrollRunDto.voucherDate,
      'voucherDate',
    );

    try {
      const [postingResult] = await this.databaseService.queryRaw<{
        payrollRunId: string;
        voucherId: string;
      }>(
        Prisma.sql`
          SELECT *
          FROM "post_payroll_run"(
            ${payrollRunId}::uuid,
            ${companyId}::uuid,
            ${authenticatedUser.id}::uuid,
            ${voucherDate}::date,
            ${postPayrollRunDto.expenseParticularAccountId}::uuid,
            ${postPayrollRunDto.payableParticularAccountId}::uuid,
            ${postPayrollRunDto.deductionParticularAccountId ?? null}::uuid
          )
        `,
      );

      await this.auditService.recordEvent({
        companyId,
        actorUserId: authenticatedUser.id,
        category: 'PAYROLL',
        eventType: AUDIT_EVENT_TYPES.payrollRunPosted,
        targetEntityType: 'PAYROLL_RUN',
        targetEntityId: payrollRunId,
        requestId,
        metadata: {
          voucherId: postingResult?.voucherId ?? null,
          voucherDate: postPayrollRunDto.voucherDate,
        },
      });

      if (postingResult?.voucherId) {
        await this.auditService.recordEvent({
          companyId,
          actorUserId: authenticatedUser.id,
          category: 'ACCOUNTING',
          eventType: AUDIT_EVENT_TYPES.voucherPosted,
          targetEntityType: 'VOUCHER',
          targetEntityId: postingResult.voucherId,
          requestId,
          metadata: {
            source: 'payroll_run',
            payrollRunId,
            voucherDate: postPayrollRunDto.voucherDate,
          },
        });
      }
    } catch (error) {
      this.throwPayrollPostingError(error);
    }

    return this.getPayrollRunDetail(companyId, payrollRunId);
  }

  private readonly payrollRunInclude = {
    project: true,
    costCenter: true,
    postedVoucher: true,
    payrollRunLines: {
      select: {
        basicAmount: true,
        allowanceAmount: true,
        deductionAmount: true,
        netAmount: true,
      },
    },
  } satisfies Prisma.PayrollRunInclude;

  private async assertPayrollRunScope(
    companyId: string,
    projectId: string | null,
    costCenterId: string | null,
  ) {
    const [project, costCenter] = await Promise.all([
      projectId
        ? this.referenceService.getProjectRecord(companyId, projectId)
        : Promise.resolve(null),
      costCenterId
        ? this.referenceService.getCostCenterRecord(companyId, costCenterId)
        : Promise.resolve(null),
    ]);

    if (
      project &&
      costCenter &&
      costCenter.projectId &&
      costCenter.projectId !== project.id
    ) {
      throw new BadRequestException(
        'The selected cost center must belong to the selected project when both are provided.',
      );
    }
  }

  private async assertPayrollRunUniqueness(
    companyId: string,
    payrollYear: number,
    payrollMonth: number,
    projectId: string | null,
    costCenterId: string | null,
    ignoredPayrollRunId?: string,
  ) {
    const existingPayrollRun = await this.prisma.payrollRun.findFirst({
      where: {
        companyId,
        payrollYear,
        payrollMonth,
        projectId,
        costCenterId,
        status: {
          not: 'CANCELLED',
        },
        ...(ignoredPayrollRunId
          ? {
              id: {
                not: ignoredPayrollRunId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingPayrollRun) {
      throw toConflictException(
        'A payroll run already exists for the selected company period and scope.',
      );
    }
  }

  private assertPayrollRunIsDraft(payrollRun: { status: string }) {
    if (payrollRun.status !== 'DRAFT') {
      throw new BadRequestException('Only draft payroll runs can be modified.');
    }
  }

  private calculatePayrollRunTotals(
    payrollRunLines: Array<{
      basicAmount: Prisma.Decimal;
      allowanceAmount: Prisma.Decimal;
      deductionAmount: Prisma.Decimal;
      netAmount: Prisma.Decimal;
    }>,
  ) {
    return payrollRunLines.reduce(
      (totals, payrollRunLine) => ({
        totalBasicAmount: totals.totalBasicAmount.plus(payrollRunLine.basicAmount),
        totalAllowanceAmount: totals.totalAllowanceAmount.plus(
          payrollRunLine.allowanceAmount,
        ),
        totalDeductionAmount: totals.totalDeductionAmount.plus(
          payrollRunLine.deductionAmount,
        ),
        totalNetAmount: totals.totalNetAmount.plus(payrollRunLine.netAmount),
      }),
      {
        totalBasicAmount: new Prisma.Decimal(0),
        totalAllowanceAmount: new Prisma.Decimal(0),
        totalDeductionAmount: new Prisma.Decimal(0),
        totalNetAmount: new Prisma.Decimal(0),
      },
    );
  }

  private mapPayrollRun(payrollRun: PayrollRunRecord): PayrollRunDto {
    const totals = this.calculatePayrollRunTotals(payrollRun.payrollRunLines);

    return {
      id: payrollRun.id,
      companyId: payrollRun.companyId,
      payrollYear: payrollRun.payrollYear,
      payrollMonth: payrollRun.payrollMonth,
      projectId: payrollRun.projectId,
      projectCode: payrollRun.project?.code ?? null,
      projectName: payrollRun.project?.name ?? null,
      costCenterId: payrollRun.costCenterId,
      costCenterCode: payrollRun.costCenter?.code ?? null,
      costCenterName: payrollRun.costCenter?.name ?? null,
      description: payrollRun.description,
      status: payrollRun.status,
      postedVoucherId: payrollRun.postedVoucherId,
      postedVoucherReference: payrollRun.postedVoucher?.reference ?? null,
      postedVoucherDate:
        payrollRun.postedVoucher?.voucherDate.toISOString().slice(0, 10) ?? null,
      finalizedAt: payrollRun.finalizedAt?.toISOString() ?? null,
      cancelledAt: payrollRun.cancelledAt?.toISOString() ?? null,
      postedAt: payrollRun.postedAt?.toISOString() ?? null,
      lineCount: payrollRun.payrollRunLines.length,
      totalBasicAmount: totals.totalBasicAmount.toFixed(2),
      totalAllowanceAmount: totals.totalAllowanceAmount.toFixed(2),
      totalDeductionAmount: totals.totalDeductionAmount.toFixed(2),
      totalNetAmount: totals.totalNetAmount.toFixed(2),
      createdAt: payrollRun.createdAt.toISOString(),
      updatedAt: payrollRun.updatedAt.toISOString(),
    };
  }

  private throwPayrollRunMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      if (databaseMessage.includes('payroll_runs_period_scope_active_key')) {
        throw toConflictException(
          'A payroll run already exists for the selected company period and scope.',
        );
      }

      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException(
        'The payroll run conflicts with an existing company period or voucher linkage.',
      );
    }

    throw error;
  }

  private throwPayrollPostingError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      if (databaseMessage.includes('payroll_runs_postedVoucherId_key')) {
        throw toConflictException('This payroll run is already linked to a voucher.');
      }

      throw new BadRequestException(databaseMessage);
    }

    throw error;
  }
}
