import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type VoucherStatus, type VoucherType } from '@prisma/client';

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
  CreateVoucherDraftDto,
  CreateVoucherLineDto,
  UpdateVoucherDraftDto,
  UpdateVoucherLineDto,
  VoucherDetailDto,
  VoucherDto,
  VoucherLineDto,
  VouchersListQueryDto,
} from './dto/vouchers.dto';

const VOUCHER_SORT_FIELDS = [
  'createdAt',
  'postedAt',
  'status',
  'updatedAt',
  'voucherDate',
  'voucherType',
] as const;

type VoucherSummaryRecord = Prisma.VoucherGetPayload<{
  include: {
    voucherLines: {
      select: {
        debitAmount: true;
        creditAmount: true;
      };
    };
  };
}>;
type VoucherDetailRecord = Prisma.VoucherGetPayload<{
  include: {
    voucherLines: {
      include: {
        particularAccount: {
          include: {
            ledgerAccount: true;
          };
        };
      };
      orderBy: {
        lineNumber: 'asc';
      };
    };
  };
}>;
type VoucherLineRecord = Prisma.VoucherLineGetPayload<{
  include: {
    particularAccount: {
      include: {
        ledgerAccount: true;
      };
    };
  };
}>;

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async listVouchers(companyId: string, query: VouchersListQueryDto) {
    await this.assertCompanyExists(companyId);
    const voucherDateFilter = this.buildVoucherDateFilter(
      query.dateFrom,
      query.dateTo,
    );
    const where: Prisma.VoucherWhereInput = {
      companyId,
      ...(query.voucherType
        ? { voucherType: query.voucherType as VoucherType }
        : {}),
      ...(query.status ? { status: query.status as VoucherStatus } : {}),
      ...(voucherDateFilter ? { voucherDate: voucherDateFilter } : {}),
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
                reference: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(query.sortBy, VOUCHER_SORT_FIELDS, 'voucherDate');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.VoucherOrderByWithRelationInput;
    const [vouchers, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        include: {
          voucherLines: {
            select: {
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.voucher.count({
        where,
      }),
    ]);

    return {
      items: vouchers.map((voucher) => this.mapVoucherSummary(voucher)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getVoucherDetail(companyId: string, voucherId: string): Promise<VoucherDetailDto> {
    const voucher = await this.getVoucherRecord(companyId, voucherId);

    return this.mapVoucherDetail(voucher);
  }

  async createVoucherDraft(
    companyId: string,
    authenticatedUser: AuthenticatedUser,
    createVoucherDraftDto: CreateVoucherDraftDto,
  ) {
    await this.assertCompanyExists(companyId);

    const voucher = await this.prisma.voucher.create({
      data: {
        companyId,
        createdById: authenticatedUser.id,
        voucherType: createVoucherDraftDto.voucherType as VoucherType,
        voucherDate: this.parseVoucherDate(createVoucherDraftDto.voucherDate),
        description: createVoucherDraftDto.description ?? null,
        reference: createVoucherDraftDto.reference ?? null,
      },
    });

    return this.getVoucherDetail(companyId, voucher.id);
  }

  async updateVoucherDraft(
    companyId: string,
    voucherId: string,
    updateVoucherDraftDto: UpdateVoucherDraftDto,
  ) {
    const voucher = await this.getVoucherRecord(companyId, voucherId);

    this.assertVoucherIsDraft(voucher);

    const data: Prisma.VoucherUpdateInput = {};

    if (updateVoucherDraftDto.voucherType !== undefined) {
      data.voucherType = updateVoucherDraftDto.voucherType as VoucherType;
    }

    if (updateVoucherDraftDto.voucherDate !== undefined) {
      data.voucherDate = this.parseVoucherDate(updateVoucherDraftDto.voucherDate);
    }

    if (updateVoucherDraftDto.description !== undefined) {
      data.description = updateVoucherDraftDto.description ?? null;
    }

    if (updateVoucherDraftDto.reference !== undefined) {
      data.reference = updateVoucherDraftDto.reference ?? null;
    }

    if (Object.keys(data).length === 0) {
      return this.mapVoucherDetail(voucher);
    }

    await this.prisma.voucher.update({
      where: {
        id: voucher.id,
      },
      data,
    });

    return this.getVoucherDetail(companyId, voucher.id);
  }

  async addVoucherLine(
    companyId: string,
    voucherId: string,
    createVoucherLineDto: CreateVoucherLineDto,
  ) {
    await this.databaseService.withTransaction(async (transaction) => {
      const voucher = await transaction.voucher.findFirst({
        where: {
          id: voucherId,
          companyId,
        },
      });

      if (!voucher) {
        throw new NotFoundException('Voucher not found.');
      }

      this.assertVoucherIsDraft(voucher);

      await this.assertPostingAccountAvailable(
        transaction,
        companyId,
        createVoucherLineDto.particularAccountId,
      );

      const lineAmounts = this.normalizeLineAmounts(
        createVoucherLineDto.debitAmount,
        createVoucherLineDto.creditAmount,
      );
      const lastLine = await transaction.voucherLine.findFirst({
        where: {
          voucherId,
        },
        orderBy: {
          lineNumber: 'desc',
        },
        select: {
          lineNumber: true,
        },
      });

      try {
        await transaction.voucherLine.create({
          data: {
            voucherId,
            particularAccountId: createVoucherLineDto.particularAccountId,
            lineNumber: (lastLine?.lineNumber ?? 0) + 1,
            description: createVoucherLineDto.description ?? null,
            ...lineAmounts,
          },
        });
      } catch (error) {
        this.throwVoucherMutationError(error);
      }
    });

    return this.getVoucherDetail(companyId, voucherId);
  }

  async updateVoucherLine(
    companyId: string,
    voucherId: string,
    voucherLineId: string,
    updateVoucherLineDto: UpdateVoucherLineDto,
  ) {
    await this.databaseService.withTransaction(async (transaction) => {
      const voucher = await transaction.voucher.findFirst({
        where: {
          id: voucherId,
          companyId,
        },
      });

      if (!voucher) {
        throw new NotFoundException('Voucher not found.');
      }

      this.assertVoucherIsDraft(voucher);

      const voucherLine = await transaction.voucherLine.findFirst({
        where: {
          id: voucherLineId,
          voucherId,
        },
      });

      if (!voucherLine) {
        throw new NotFoundException('Voucher line not found.');
      }

      const particularAccountId =
        updateVoucherLineDto.particularAccountId ?? voucherLine.particularAccountId;

      await this.assertPostingAccountAvailable(
        transaction,
        companyId,
        particularAccountId,
      );

      const lineAmounts = this.normalizeLineAmounts(
        updateVoucherLineDto.debitAmount ?? voucherLine.debitAmount.toFixed(2),
        updateVoucherLineDto.creditAmount ?? voucherLine.creditAmount.toFixed(2),
      );

      try {
        await transaction.voucherLine.update({
          where: {
            id: voucherLine.id,
          },
          data: {
            particularAccountId,
            description:
              updateVoucherLineDto.description === undefined
                ? voucherLine.description
                : (updateVoucherLineDto.description ?? null),
            ...lineAmounts,
          },
        });
      } catch (error) {
        this.throwVoucherMutationError(error);
      }
    });

    return this.getVoucherDetail(companyId, voucherId);
  }

  async removeVoucherLine(
    companyId: string,
    voucherId: string,
    voucherLineId: string,
  ) {
    await this.databaseService.withTransaction(async (transaction) => {
      const voucher = await transaction.voucher.findFirst({
        where: {
          id: voucherId,
          companyId,
        },
      });

      if (!voucher) {
        throw new NotFoundException('Voucher not found.');
      }

      this.assertVoucherIsDraft(voucher);

      const voucherLine = await transaction.voucherLine.findFirst({
        where: {
          id: voucherLineId,
          voucherId,
        },
        select: {
          id: true,
        },
      });

      if (!voucherLine) {
        throw new NotFoundException('Voucher line not found.');
      }

      try {
        await transaction.voucherLine.delete({
          where: {
            id: voucherLine.id,
          },
        });
      } catch (error) {
        this.throwVoucherMutationError(error);
      }
    });

    return this.getVoucherDetail(companyId, voucherId);
  }

  async postVoucher(
    companyId: string,
    voucherId: string,
    authenticatedUser: AuthenticatedUser,
    requestId?: string,
  ) {
    const voucher = await this.getVoucherRecord(companyId, voucherId);

    this.assertVoucherIsDraft(voucher);

    try {
      await this.databaseService.withTransaction(async (transaction) => {
        const postedVoucher = await transaction.voucher.update({
          where: {
            id: voucher.id,
          },
          data: {
            status: 'POSTED',
            postedById: authenticatedUser.id,
          },
        });

        await this.auditService.recordEvent(
          {
            companyId,
            actorUserId: authenticatedUser.id,
            category: 'ACCOUNTING',
            eventType: AUDIT_EVENT_TYPES.voucherPosted,
            targetEntityType: 'VOUCHER',
            targetEntityId: voucher.id,
            requestId,
            metadata: {
              voucherType: postedVoucher.voucherType,
              voucherDate: postedVoucher.voucherDate.toISOString().slice(0, 10),
              reference: postedVoucher.reference,
            },
          },
          transaction,
        );
      });
    } catch (error) {
      this.throwVoucherMutationError(error);
    }

    return this.getVoucherDetail(companyId, voucher.id);
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

  private async assertPostingAccountAvailable(
    transaction: Prisma.TransactionClient,
    companyId: string,
    particularAccountId: string,
  ) {
    const particularAccount = await transaction.particularAccount.findFirst({
      where: {
        id: particularAccountId,
        companyId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!particularAccount) {
      throw new NotFoundException('Particular account not found.');
    }

    if (!particularAccount.isActive) {
      throw new BadRequestException(
        'Voucher lines must use active posting accounts.',
      );
    }
  }

  private async getVoucherRecord(companyId: string, voucherId: string) {
    await this.assertCompanyExists(companyId);

    const voucher = await this.prisma.voucher.findFirst({
      where: {
        id: voucherId,
        companyId,
      },
      include: {
        voucherLines: {
          include: {
            particularAccount: {
              include: {
                ledgerAccount: true,
              },
            },
          },
          orderBy: {
            lineNumber: 'asc',
          },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found.');
    }

    return voucher;
  }

  private buildVoucherDateFilter(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) {
      return undefined;
    }

    const gte = dateFrom ? this.parseVoucherDate(dateFrom) : undefined;
    const lte = dateTo ? this.parseVoucherDate(dateTo) : undefined;

    if (gte && lte && gte > lte) {
      throw new BadRequestException('dateFrom must be less than or equal to dateTo.');
    }

    return {
      ...(gte ? { gte } : {}),
      ...(lte ? { lte } : {}),
    };
  }

  private parseVoucherDate(value: string) {
    const parsedDate = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('voucherDate must be a valid calendar date.');
    }

    return parsedDate;
  }

  private normalizeLineAmounts(debitAmount: string, creditAmount: string) {
    const normalizedDebitAmount = new Prisma.Decimal(debitAmount);
    const normalizedCreditAmount = new Prisma.Decimal(creditAmount);
    const hasDebit = normalizedDebitAmount.gt(0);
    const hasCredit = normalizedCreditAmount.gt(0);

    if ((hasDebit && hasCredit) || (!hasDebit && !hasCredit)) {
      throw new BadRequestException(
        'Voucher lines must contain either a debit amount or a credit amount.',
      );
    }

    return {
      debitAmount: normalizedDebitAmount,
      creditAmount: normalizedCreditAmount,
    };
  }

  private assertVoucherIsDraft(voucher: { status: string }) {
    if (voucher.status !== 'DRAFT') {
      throw new BadRequestException('Posted vouchers cannot be modified.');
    }
  }

  private calculateVoucherTotals(
    lines: Array<{
      debitAmount: Prisma.Decimal;
      creditAmount: Prisma.Decimal;
    }>,
  ) {
    return lines.reduce(
      (totals, line) => ({
        totalDebit: totals.totalDebit.plus(line.debitAmount),
        totalCredit: totals.totalCredit.plus(line.creditAmount),
      }),
      {
        totalDebit: new Prisma.Decimal(0),
        totalCredit: new Prisma.Decimal(0),
      },
    );
  }

  private mapVoucherSummary(voucher: VoucherSummaryRecord): VoucherDto {
    const totals = this.calculateVoucherTotals(voucher.voucherLines);

    return {
      id: voucher.id,
      companyId: voucher.companyId,
      voucherType: voucher.voucherType,
      status: voucher.status,
      voucherDate: voucher.voucherDate.toISOString().slice(0, 10),
      description: voucher.description,
      reference: voucher.reference,
      createdById: voucher.createdById,
      postedById: voucher.postedById,
      postedAt: voucher.postedAt?.toISOString() ?? null,
      lineCount: voucher.voucherLines.length,
      totalDebit: totals.totalDebit.toFixed(2),
      totalCredit: totals.totalCredit.toFixed(2),
      createdAt: voucher.createdAt.toISOString(),
      updatedAt: voucher.updatedAt.toISOString(),
    };
  }

  private mapVoucherLine(voucherLine: VoucherLineRecord): VoucherLineDto {
    return {
      id: voucherLine.id,
      voucherId: voucherLine.voucherId,
      lineNumber: voucherLine.lineNumber,
      particularAccountId: voucherLine.particularAccountId,
      particularAccountCode: voucherLine.particularAccount.code,
      particularAccountName: voucherLine.particularAccount.name,
      ledgerAccountId: voucherLine.particularAccount.ledgerAccountId,
      ledgerAccountCode: voucherLine.particularAccount.ledgerAccount.code,
      ledgerAccountName: voucherLine.particularAccount.ledgerAccount.name,
      description: voucherLine.description,
      debitAmount: voucherLine.debitAmount.toFixed(2),
      creditAmount: voucherLine.creditAmount.toFixed(2),
      createdAt: voucherLine.createdAt.toISOString(),
      updatedAt: voucherLine.updatedAt.toISOString(),
    };
  }

  private mapVoucherDetail(voucher: VoucherDetailRecord): VoucherDetailDto {
    const summary = this.mapVoucherSummary(voucher);

    return {
      ...summary,
      lines: voucher.voucherLines.map((voucherLine) =>
        this.mapVoucherLine(voucherLine),
      ),
    };
  }

  private throwVoucherMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException(
        'The voucher line change could not be applied because of a uniqueness conflict.',
      );
    }

    throw error;
  }
}
